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

    const { description, frameIndex, storyboardId, aspectRatio } = JSON.parse(event.body);

    console.log('📦 Parsed request:', {
      frameIndex,
      storyboardId,
      aspectRatio,
      descriptionLength: description?.length
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

    // Validate description quality to avoid wasted $0.04 API calls
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

    if (cleanDescription.length > 1000) {
      console.error('❌ Description too long');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Description too long. Please keep it under 1000 characters for optimal results.'
        })
      };
    }

    // Use single model for all frames
    const model = 'imagegeneration@006';

    // Enhanced prompt for better quality and consistency
    const prompt = `Cinematic storyboard frame, professional composition, clear visual storytelling: ${description}. High-quality digital art style, dramatic lighting.`;

    console.log(`📝 Frame ${frameIndex + 1}: ${prompt}`);

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

    // Enhanced request body with quality parameters
    const body = {
      instances: [
        {
          prompt: prompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        guidanceScale: 18, // Higher = more prompt adherence (range: 1-20, default: 15)
        negativePrompt: 'blurry, low quality, distorted, deformed, text, watermark, signature', // Avoid these
        ...(aspectRatio && aspectRatioMap[aspectRatio] ? aspectRatioMap[aspectRatio] : {}),
      },
    };

    // Retry logic - up to 2 attempts (cost optimization: reduce from 3 to 2)
    let attempts = 0;
    let lastError = null;
    const MAX_ATTEMPTS = 2; // Reduced from 3 to save costs on failures

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
            // API returned 200 but no image - might be rate limiting or temp issue
            const availableKeys = Object.keys(data || {}).join(', ');
            lastError = `No image in API response. Available keys: ${availableKeys}`;
            console.warn(`⚠️ Frame ${frameIndex + 1} attempt ${attempts}: ${lastError}`);
            if (attempts < MAX_ATTEMPTS) {
              console.log(`Retrying in 2 seconds...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue; // Try again
            } else {
              // Last attempt failed - break out of loop
              break;
            }
          }
        } else {
          // API returned error status
          const errorText = await response.text();
          lastError = `API error ${response.status}: ${errorText}`;
          console.warn(`⚠️ Frame ${frameIndex + 1} attempt ${attempts} failed in ${elapsed}s: ${lastError}`);

          if (attempts < MAX_ATTEMPTS && response.status >= 500) {
            // Retry on 5xx server errors
            console.log(`Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          } else if (response.status === 429) {
            // Rate limit - wait longer
            console.log(`Rate limited - waiting 5 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
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
          console.log(`Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
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
