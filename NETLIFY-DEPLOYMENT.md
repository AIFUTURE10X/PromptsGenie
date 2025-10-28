# Netlify Deployment Guide for PromptsGenie

This guide will help you deploy PromptsGenie to Netlify with full serverless function support.

## Prerequisites

1. A Netlify account (free tier works)
2. Google Cloud account with:
   - Gemini API key
   - Google Cloud Project with Vertex AI enabled
   - Service account with Vertex AI permissions

## Step 1: Connect Your Repository to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git provider (GitHub, GitLab, etc.)
4. Select the PromptsGenie repository
5. Netlify will auto-detect the build settings from `netlify.toml`

## Step 2: Configure Environment Variables

Go to your site's dashboard → **Site settings** → **Environment variables** → **Add a variable**

Add the following environment variables:

### Required Variables

#### 1. Google API Key (for Gemini API)
```
Variable name: GOOGLE_API_KEY
Value: your_google_api_key_here
```
Get your API key from: https://makersuite.google.com/app/apikey

#### 2. Google Cloud Project ID
```
Variable name: GOOGLE_PROJECT_ID
Value: your_google_project_id
```
Find this in your Google Cloud Console dashboard

#### 3. Google Service Account Credentials
```
Variable name: GOOGLE_APPLICATION_CREDENTIALS_JSON
Value: {"type":"service_account","project_id":"...","private_key":"..."}
```

**How to get service account credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Create a new service account or select an existing one
4. Add the **Vertex AI User** role
5. Click **Keys** → **Add Key** → **Create new key** → **JSON**
6. Download the JSON file
7. **Minify the JSON** (remove all newlines and extra spaces):
   ```bash
   # On Linux/Mac:
   cat service-account.json | jq -c

   # Or use an online JSON minifier
   ```
8. Copy the entire minified JSON string and paste it as the value

#### 4. Frontend Environment Variables
```
Variable name: VITE_GEMINI_API_KEY
Value: your_gemini_api_key_here

Variable name: VITE_GEMINI_MODEL_TEXT
Value: gemini-1.5-flash

Variable name: VITE_GEMINI_MODEL_IMAGES
Value: gemini-2.5-flash

Variable name: VITE_GEMINI_MODEL_IMAGE
Value: gemini-2.5-flash
```

### Optional Variables (if using Supabase)

```
Variable name: SUPABASE_URL
Value: your_supabase_project_url

Variable name: SUPABASE_KEY
Value: your_supabase_anon_key
```

## Step 3: Deploy

1. After configuring all environment variables, trigger a deploy:
   - **Option A**: Click "Deploy site" in the Netlify dashboard
   - **Option B**: Push a commit to your repository (auto-deploys)

2. Monitor the build logs for any errors

3. Once deployed, your site will be available at:
   ```
   https://your-site-name.netlify.app
   ```

## Step 4: Test Your Deployment

### Test Health Endpoint
```bash
curl https://your-site-name.netlify.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "apiKeyConfigured": true
}
```

### Test in Browser
1. Open your Netlify site URL
2. Try uploading an image
3. Try generating a storyboard
4. Check browser console for any errors

## Available API Endpoints

After deployment, these endpoints will be available:

- `POST /api/gemini/text` - Text generation with Gemini
- `POST /api/gemini/images` - Image analysis with Gemini
- `POST /api/storyboards/plan` - Generate storyboard plan
- `POST /api/storyboards/generate-frame` - Generate individual frame
- `POST /api/storyboards/edit` - Edit storyboard frame
- `POST /api/storyboards/extend` - Extend storyboard
- `GET /api/health` - Health check
- `GET /api/ping` - Simple ping test

## Troubleshooting

### Build Fails

**Check Node version:**
- Netlify.toml specifies Node 18
- Ensure your package.json is compatible

**Missing dependencies:**
```bash
npm install
npm run build
```

### Functions Not Working

**Check environment variables:**
1. Go to Site settings → Environment variables
2. Verify all required variables are set
3. Redeploy after adding/updating variables

**Check function logs:**
1. Go to your site dashboard
2. Click "Functions"
3. Click on a function to view logs

### CORS Errors

The functions are configured with CORS headers. If you still see CORS errors:
1. Check that the API calls use the correct endpoints
2. Verify the `Access-Control-Allow-Origin` headers in function responses

### Image Generation Fails

**Verify Vertex AI setup:**
1. Vertex AI API is enabled in Google Cloud
2. Service account has `Vertex AI User` role
3. `GOOGLE_APPLICATION_CREDENTIALS_JSON` is correctly formatted
4. `GOOGLE_PROJECT_ID` matches your Google Cloud project

## Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the instructions to configure DNS
4. Netlify provides free SSL certificates

## Performance Tips

1. **Enable caching:**
   - Netlify automatically caches static assets
   - Functions have built-in caching

2. **Monitor function usage:**
   - Free tier: 125k function invocations/month
   - Monitor usage in Site settings → Usage

3. **Optimize images:**
   - Consider using Netlify Image CDN
   - Enable automatic image optimization in Site settings

## Environment Variable Security

- Never commit `.env` files to git
- Use different API keys for development and production
- Rotate service account keys regularly
- Monitor API usage in Google Cloud Console

## Continuous Deployment

Netlify will automatically deploy when you:
1. Push to the main branch
2. Merge a pull request
3. Manually trigger a deploy

To disable auto-deployment:
- Site settings → Build & deploy → Continuous deployment → Stop auto publishing

## Cost Considerations

### Netlify Free Tier Includes:
- 100 GB bandwidth/month
- 125k serverless function requests/month
- 300 build minutes/month

### Google Cloud Costs:
- Gemini API: Pay per request (check current pricing)
- Vertex AI: Pay per image generation
- Monitor costs in Google Cloud Console

## Support

If you encounter issues:
1. Check Netlify function logs
2. Review the [Netlify documentation](https://docs.netlify.com/)
3. Check Google Cloud logs
4. Open an issue on the GitHub repository

## Next Steps

After successful deployment:
1. Set up custom domain
2. Configure form submissions (if needed)
3. Set up analytics
4. Monitor performance and costs
5. Set up alerts for errors

---

**Deployment Date:** $(date)
**Maintained by:** PromptsGenie Team
