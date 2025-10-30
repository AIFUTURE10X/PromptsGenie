// Enhanced hash function with normalization for better cache hits
function hashPrompt(prompt, aspectRatio) {
  // Normalize prompt for better cache matching
  const normalized = prompt
    .toLowerCase() // Case insensitive
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[.,!?;:]+$/g, '') // Remove trailing punctuation
    .trim(); // Remove leading/trailing whitespace

  let hash = 0;
  const str = `${normalized}|${aspectRatio || '16:9'}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// In-memory cache for generated images (resets on function cold start)
const imageCache = new Map();
const CACHE_MAX_SIZE = 200; // Increased for better cost savings (200 frames = ~100MB)
const CACHE_TTL = 3600000; // 1 hour TTL

// Analytics tracking (resets on function cold start)
const analytics = {
  cacheHits: 0,
  cacheMisses: 0,
  totalGenerations: 0,
  totalFailures: 0,
  averageGenerationTime: 0,
  get hitRate() {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? ((this.cacheHits / total) * 100).toFixed(1) : 0;
  },
  get successRate() {
    const total = this.totalGenerations + this.totalFailures;
    return total > 0 ? ((this.totalGenerations / total) * 100).toFixed(1) : 0;
  }
};

// Get Google Cloud access token using OAuth2 JWT flow (no external libraries needed)
async function getAccessToken() {
  try {
    // Parse service account credentials from environment variable
    // WORKAROUND: Netlify strips quotes from JSON env vars (known bug)
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not configured');
    }

    let credentials;
    try {
      // First try normal JSON parse
      credentials = JSON.parse(credentialsJson);
    } catch (jsonError) {
      // Fallback: Use eval for Netlify's quote-stripping bug
      console.log('⚠️ JSON parse failed, using eval fallback');
      credentials = eval('(' + credentialsJson + ')');
    }

    if (!credentials || !credentials.private_key || !credentials.client_email) {
      throw new Error('Invalid credentials structure');
    }

    // Create JWT for OAuth2 token exchange
    const { createJWT } = await import('./utils/jwt.js');
    const jwt = createJWT(credentials);

    // Exchange JWT for access token
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OAuth2 token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    throw new Error('Could not get access token: ' + error.message);
  }
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔵 Received generate-frame request');

    const { description, frameIndex, storyboardId, aspectRatio, basePrompt } = JSON.parse(event.body);

    console.log('📦 Parsed request:', {
      frameIndex,
      storyboardId,
      aspectRatio,
      descriptionLength: description?.length,
      hasBasePrompt: !!basePrompt
    });

    // Input validation to prevent wasted API calls
    if (!description || typeof frameIndex !== 'number') {
      console.error('❌ Invalid request parameters');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid request. Must include description and frameIndex'
        })
      };
    }

    // Validate and sanitize description to avoid content policy issues
    const cleanDescription = description.trim();
    if (cleanDescription.length < 10) {
      console.error('❌ Description too short for quality generation');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Description too short. Please provide at least 10 characters for quality image generation (minimum: detailed scene description).'
        })
      };
    }

    // Increased limit to 5000 to accommodate detailed scene descriptions with character details
    if (cleanDescription.length > 5000) {
      console.error('❌ Description too long:', cleanDescription.length, 'characters');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Description too long. Please keep it under 5000 characters.'
        })
      };
    }

    // Sanitize description to remove potentially problematic content
    // Remove explicit violence, gore, or unsafe content keywords
    const sanitizedDescription = cleanDescription
      .replace(/\b(blood|gore|violent|explicit|nude|naked)\b/gi, '')
      .trim();

    if (!sanitizedDescription) {
      console.error('❌ Description contains only filtered content');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Description contains restricted content. Please rephrase.'
        })
      };
    }

    // Use single model for all frames (Imagen 3 - highest quality available)
    const model = 'imagegeneration@006';

    // Enhanced prompt with EXPLICIT character separation to prevent confusion
    // Process the description to make character actions more explicit
    let processedDescription = sanitizedDescription;

    // Make character distinctions VERY explicit to prevent AI confusion
    if (sanitizedDescription.toLowerCase().includes('jimmy') || sanitizedDescription.toLowerCase().includes('olsen')) {
      processedDescription = processedDescription.replace(/jimmy olsen/gi, 'Jimmy Olsen (the civilian photographer, NOT Superman)');
    }
    if (sanitizedDescription.toLowerCase().includes('superman')) {
      processedDescription = processedDescription.replace(/superman/gi, 'Superman (the superhero in blue suit and red cape, NOT holding a camera)');
    }

    let prompt;
    if (basePrompt) {
      // Use consistent style from the initial prompt for all frames
      prompt = `${basePrompt}. Scene: ${processedDescription}.

CRITICAL CHARACTER RULES - DO NOT MIX THESE CHARACTERS:
- Jimmy Olsen = young man, red hair, civilian clothes (polo shirt/casual wear), holding camera, NO superhero costume
- Superman = muscular hero, blue suit, red cape, 'S' symbol on chest, NO camera
- NEVER show Superman with a camera
- NEVER show Jimmy Olsen in a Superman costume
- These are TWO DIFFERENT people

Style: Cinematic, vibrant colors, photorealistic, dramatic lighting. NO sketches, NO grayscale.`;
    } else {
      // Fallback to default cinematic style if no base prompt
      prompt = `Cinematic movie scene showing: ${processedDescription}.

CRITICAL CHARACTER RULES - DO NOT MIX THESE CHARACTERS:
- Jimmy Olsen = young man, red hair, civilian clothes (polo shirt/casual wear), holding camera, NO superhero costume
- Superman = muscular hero, blue suit, red cape, 'S' symbol on chest, NO camera
- NEVER show Superman with a camera
- NEVER show Jimmy Olsen in a Superman costume
- These are TWO DIFFERENT people

Style: Vibrant colors, photorealistic rendering, dramatic lighting, professional film quality. NO sketches, NO grayscale.`;
    }

    console.log(`📝 Frame ${frameIndex + 1}: Generating with ${basePrompt ? 'consistent style' : 'default style'}`);
    console.log(`   Description: ${sanitizedDescription.substring(0, 80)}...`);

    // Check cache first (cost optimization)
    const cacheKey = hashPrompt(prompt, aspectRatio);
    const cached = imageCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      analytics.cacheHits++;
      console.log(`💰 Cache HIT for frame ${frameIndex + 1} - saving API call cost!`);
      console.log(`📊 Analytics: ${analytics.cacheHits} hits, ${analytics.cacheMisses} misses, ${analytics.hitRate}% hit rate`);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT'
        },
        body: JSON.stringify({
          success: true,
          frame: {
            id: `frame_${storyboardId}_${frameIndex}`,
            image_url: cached.imageBase64,
            title: `Scene ${frameIndex + 1}`,
            description: description,
            status: 'completed'
          }
        })
      };
    }
    analytics.cacheMisses++;
    console.log(`🔍 Cache MISS for frame ${frameIndex + 1} - will generate new image`);
    console.log(`📊 Analytics: ${analytics.cacheHits} hits, ${analytics.cacheMisses} misses, ${analytics.hitRate}% hit rate`);

    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/${model}:predict`;

    // Map aspect ratio to parameters
    const aspectRatioMap = {
      '16:9': { aspectRatio: '16:9' },
      '1:1': { aspectRatio: '1:1' },
      '9:16': { aspectRatio: '9:16' },
      '4:3': { aspectRatio: '4:3' },
      '21:9': { aspectRatio: '16:9' } // 21:9 not supported, use 16:9
    };

    // Request body with valid parameters for imagegeneration@006
    const body = {
      instances: [
        {
          prompt: prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        // Only use parameters that are confirmed to work with imagegeneration@006
        ...(aspectRatio && aspectRatioMap[aspectRatio] ? aspectRatioMap[aspectRatio] : {}),
      },
    };

    // Retry logic - 3 attempts with increasing delays to handle empty API responses
    // Common issue: Imagen API returns 200 but no image data (rate limiting/safety)
    // Exponential backoff helps with rate limiting and transient issues
    let attempts = 0;
    let lastError = null;
    const MAX_ATTEMPTS = 3; // 3 attempts to handle intermittent empty responses

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      try {
        const accessToken = await getAccessToken();

        console.log(`🔧 Frame ${frameIndex + 1} - Attempt ${attempts}/${MAX_ATTEMPTS} - Calling Google Imagen API...`);
        const startTime = Date.now();

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        if (response.ok) {
          const data = await response.json();

          // Enhanced logging to diagnose empty responses
          console.log(`📦 API Response structure for frame ${frameIndex + 1}:`, {
            hasPredictions: !!data?.predictions,
            predictionsLength: data?.predictions?.length,
            predictionKeys: data?.predictions?.[0] ? Object.keys(data.predictions[0]) : [],
            allDataKeys: Object.keys(data || {}),
            hasError: !!data?.error
          });

          // Check for content policy errors
          if (data?.error || data?.predictions?.[0]?.error) {
            const errorMsg = data.error || data.predictions[0].error;
            lastError = `Content policy or API error: ${JSON.stringify(errorMsg)}`;
            console.error(`❌ Frame ${frameIndex + 1} blocked by content policy or API error:`, errorMsg);
            // Don't retry content policy errors
            break;
          }

          const imageBase64 = data?.predictions?.[0]?.bytesBase64Encoded;

          if (imageBase64) {
            // Track successful generation
            analytics.totalGenerations++;
            analytics.averageGenerationTime = ((analytics.averageGenerationTime * (analytics.totalGenerations - 1)) + parseFloat(elapsed)) / analytics.totalGenerations;

            console.log(`✅ Frame ${frameIndex + 1} generated successfully in ${elapsed}s (attempt ${attempts})`);
            console.log(`📊 Success rate: ${analytics.successRate}%, Avg time: ${analytics.averageGenerationTime.toFixed(2)}s`);

            // Store in cache for future requests (cost optimization)
            if (imageCache.size >= CACHE_MAX_SIZE) {
              // Remove oldest entry if cache is full
              const firstKey = imageCache.keys().next().value;
              imageCache.delete(firstKey);
              console.log(`🗑️ Cache full, removed oldest entry`);
            }
            imageCache.set(cacheKey, {
              imageBase64: `data:image/png;base64,${imageBase64}`,
              timestamp: Date.now()
            });
            console.log(`💾 Cached frame ${frameIndex + 1} (cache size: ${imageCache.size}/${CACHE_MAX_SIZE})`);

            // Success! Return frame object
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'MISS',
                'X-Generation-Time': `${elapsed}s`,
                'X-Attempts': attempts.toString()
              },
              body: JSON.stringify({
                success: true,
                frame: {
                  id: `frame_${storyboardId}_${frameIndex}`,
                  image_url: `data:image/png;base64,${imageBase64}`,
                  title: `Scene ${frameIndex + 1}`,
                  description: description,
                  status: 'completed'
                }
              })
            };
          } else {
            // API returned 200 but no image - might be rate limiting, content policy, or temp issue
            const availableKeys = Object.keys(data || {}).join(', ');
            const fullResponse = JSON.stringify(data, null, 2);
            lastError = `No image in API response. Available keys: ${availableKeys}`;
            console.warn(`⚠️ Frame ${frameIndex + 1} attempt ${attempts}: ${lastError}`);
            console.warn(`Full API response:`, fullResponse.substring(0, 1000)); // Log first 1000 chars for debugging

            // Check if this is a content policy or safety issue
            if (data?.predictions?.[0]?.safetyAttributes || fullResponse.includes('safety') || fullResponse.includes('blocked')) {
              console.error(`🚫 Frame ${frameIndex + 1} likely blocked by content policy/safety filters`);
              lastError = 'Content blocked by safety filters. Try a different description.';
              break; // Don't retry content policy blocks
            }

            if (attempts < MAX_ATTEMPTS) {
              // Exponential backoff: 3s, 6s, 12s to handle rate limiting
              const waitTime = Math.min(3000 * attempts, 12000); // 3s, 6s, 12s (capped at 12s)
              console.log(`⏱️ Retrying frame ${frameIndex + 1} in ${waitTime/1000} seconds... (attempt ${attempts}/${MAX_ATTEMPTS})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue; // Try again
            } else {
              // Last attempt failed - break out of loop
              console.error(`❌ Frame ${frameIndex + 1} - All ${MAX_ATTEMPTS} attempts exhausted`);
              break;
            }
          }
        } else {
          // API returned error status
          const errorText = await response.text();
          lastError = `API error ${response.status}: ${errorText}`;
          console.warn(`⚠️ Frame ${frameIndex + 1} attempt ${attempts} failed in ${elapsed}s: ${lastError}`);

          if (attempts < MAX_ATTEMPTS && response.status >= 500) {
            // Retry on 5xx server errors with exponential backoff
            const waitTime = Math.min(3000 * attempts, 12000);
            console.log(`Server error - retrying in ${waitTime/1000}s... (attempt ${attempts}/${MAX_ATTEMPTS})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else if (response.status === 429) {
            // Rate limit - wait longer before retry
            const waitTime = Math.min(5000 * attempts, 15000); // 5s, 10s, 15s for rate limits
            console.log(`Rate limited - waiting ${waitTime/1000}s before retry... (attempt ${attempts}/${MAX_ATTEMPTS})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            if (attempts < MAX_ATTEMPTS) continue;
          } else {
            // 4xx client errors don't retry
            break;
          }
        }
      } catch (fetchError) {
        lastError = fetchError.message;
        console.warn(`⚠️ Frame ${frameIndex + 1} attempt ${attempts} network error: ${lastError}`);
        if (attempts < MAX_ATTEMPTS) {
          const waitTime = Math.min(3000 * attempts, 12000);
          console.log(`Network error - retrying in ${waitTime/1000}s... (attempt ${attempts}/${MAX_ATTEMPTS})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
    }

    // All attempts failed - track failure
    analytics.totalFailures++;
    const errorMsg = `Failed after ${attempts} attempts: ${lastError}`;
    console.error(`❌ Frame ${frameIndex + 1} - ${errorMsg}`);
    console.error(`📊 Failure tracked. Success rate: ${analytics.successRate}%`);
    console.error(`Frame ${frameIndex + 1} details:`, {
      storyboardId,
      frameIndex,
      model,
      aspectRatio,
      attempts
    });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: errorMsg,
        frameIndex,
        attempts
      })
    };
  } catch (error) {
    console.error(`💥 CRASH in generate-frame for frame ${frameIndex + 1}:`, {
      error: error.message,
      stack: error.stack,
      frameIndex
    });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: `Function crash: ${error.message}`,
        frameIndex
      })
    };
  }
};
