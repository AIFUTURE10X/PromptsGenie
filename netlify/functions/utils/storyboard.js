import { getAccessToken } from './gemini.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory store for storyboards (for serverless, consider using a database or KV store)
export const storyboardStore = {};

export function deterministicSeed(storyboardId, extra = "") {
  let hash = 0;
  const str = storyboardId + (extra || "");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function generateStoryboardFrames(plan, seed, storyboardsDir) {
  const model = 'imagegeneration@006';
  const frames = [];

  try {
    for (let i = 0; i < plan.frames.length; i++) {
      const description = plan.frames[i]?.description || `Frame ${i + 1}`;
      let image_url = '';
      let attempts = 0;

      while (attempts < 3) {
        try {
          const prompt = `Generate a cinematic storyboard frame: ${description}`;
          const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/${model}:predict`;

          const body = {
            instances: [
              {
                prompt: prompt,
              },
            ],
            parameters: {
              sampleCount: 1,
            },
          };

          const accessToken = await getAccessToken();
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
          });

          if (response.ok) {
            const data = await response.json();
            console.log(
              `🟦 Gemini API raw response for frame ${i + 1}:`,
              JSON.stringify(data, null, 2)
            );

            const imageBase64 = data?.predictions?.[0]?.bytesBase64Encoded;
            if (imageBase64) {
              const imageBuffer = Buffer.from(imageBase64, 'base64');
              const imageFileName = `frame_${seed}_${i + 1}.png`;
              const imagePath = path.join(storyboardsDir, imageFileName);

              // Ensure directory exists
              if (!fs.existsSync(storyboardsDir)) {
                fs.mkdirSync(storyboardsDir, { recursive: true });
              }

              fs.writeFileSync(imagePath, imageBuffer);
              image_url = `/storyboards/${imageFileName}`;
              break;
            } else {
              const availableKeys = Object.keys(data || {}).join(', ');
              const errorMessage = `Image generation failed for frame ${i + 1}: Predictions not found in response. Available keys: ${availableKeys}`;
              console.error(errorMessage);
              image_url = `https://dummyimage.com/512x288/eee/333&text=ERROR`;
            }
          } else {
            const errorText = await response.text();
            console.error(`Image generation failed for frame ${i + 1} with status ${response.status}: ${errorText}`);
            image_url = `https://dummyimage.com/512x288/eee/333&text=ERROR`;
          }
        } catch (err) {
          console.error('Error in generateStoryboardFrames for frame ' + (i + 1), err);
          image_url = `https://dummyimage.com/512x288/eee/333&text=ERROR`;
        }

        attempts++;
        if (attempts < 3) {
          console.log(`Retrying frame ${i + 1}, attempt ${attempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (i === 6) {
        console.log('Logging details for 7th frame:', { i, image_url, description });
      }

      frames.push({
        id: `frame_${i + 1}`,
        image_url,
        title: `Scene ${i + 1}`,
        description,
      });

      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (e) {
    console.error('Error in generateStoryboardFrames loop', e);
  }

  return frames;
}
