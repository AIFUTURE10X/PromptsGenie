# Vercel Deployment Guide

Complete guide for deploying PromptsGenie to Vercel (works with free tier).

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free)
3. **Google Cloud Account** - For Gemini API access
4. **API Keys** - Gemini API key and service account credentials

## Step 1: Get Your API Keys

### Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key (starts with something like `A1za...`)

### Google Cloud Service Account (for Storyboard Image Generation)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Vertex AI API** for your project
4. Go to **IAM & Admin** > **Service Accounts**
5. Click **Create Service Account**
   - Name: `promptsgenie-vercel`
   - Role: **Vertex AI User**
6. Click **Create and Download JSON Key**
7. Save this JSON file securely

## Step 2: Prepare Your Service Account JSON

The service account JSON needs to be converted to a single-line string for Vercel:

**Original JSON:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  ...
}
```

**Convert to single line:**
- Remove ALL newlines (including those in the private_key)
- Keep it as valid JSON
- Result should look like: `{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----",...}`

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Connect GitHub**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables**

   Click "Environment Variables" and add:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `GOOGLE_API_KEY` | Your Gemini API key | Backend API calls |
   | `GOOGLE_PROJECT_ID` | Your GCP project ID | For Vertex AI |
   | `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Single-line JSON from Step 2 | Service account credentials |
   | `VITE_GEMINI_API_KEY` | Your Gemini API key | Frontend API calls |
   | `VITE_GEMINI_MODEL_TEXT` | `gemini-1.5-flash` | Text generation model |
   | `VITE_GEMINI_MODEL_IMAGES` | `gemini-2.5-flash` | Image analysis model |
   | `VITE_GEMINI_MODEL_IMAGE` | `gemini-2.5-flash` | Image model |

   **Important:** Make sure to add these for both "Production" and "Preview" environments.

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Step 4: Configure Environment Variables via CLI (Alternative)

If you prefer CLI for environment variables:

```bash
# Backend variables (serverless functions)
vercel env add GOOGLE_API_KEY
vercel env add GOOGLE_PROJECT_ID
vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON

# Frontend variables (embedded in build)
vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_GEMINI_MODEL_TEXT
vercel env add VITE_GEMINI_MODEL_IMAGES
vercel env add VITE_GEMINI_MODEL_IMAGE
```

## Step 5: Test Your Deployment

1. **Health Check**
   - Visit: `https://your-project.vercel.app/api/health`
   - Should return: `{"status":"ok","timestamp":"...","apiKeyConfigured":true}`

2. **Test Prompt Generation**
   - Open your app: `https://your-project.vercel.app`
   - Try generating a prompt
   - Check browser console for any errors

3. **Test Storyboard Generation** (if configured)
   - Create a storyboard plan
   - Generate frames
   - Note: On free tier, frames generate one at a time

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Check that all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "Environment variable not found"**
- Check spelling of environment variables in Vercel dashboard
- Make sure they're set for the correct environment (Production/Preview)

### API Errors

**Error: "API key not configured"**
- Verify `GOOGLE_API_KEY` is set in Vercel environment variables
- Redeploy after adding variables

**Error: "Could not get access token"**
- Check `GOOGLE_APPLICATION_CREDENTIALS_JSON` is valid single-line JSON
- Verify service account has "Vertex AI User" role
- Confirm Vertex AI API is enabled in your GCP project

**Error: "403 Forbidden"**
- Your service account may not have correct permissions
- Go to IAM & Admin in GCP and verify the role

### Storyboard Generation Issues

**Frames not generating**
- Check browser console for errors
- Verify `GOOGLE_PROJECT_ID` is correct
- Ensure Vertex AI API is enabled
- Check service account credentials are correct

**Timeout on free tier**
- Free tier has 10-second function limit
- Our implementation generates frames one at a time to avoid this
- If you're still hitting limits, consider upgrading to Vercel Pro

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Push to main branch** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

## Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Click "Settings" > "Domains"
3. Add your custom domain
4. Update DNS records as shown
5. SSL certificate is automatically provisioned

## Monitoring & Logs

- **View Logs**: Vercel Dashboard > Your Project > Deployments > Click deployment > Logs
- **Function Logs**: Check serverless function executions under "Functions" tab
- **Analytics**: Available in Project Settings (some features require Pro tier)

## Cost Considerations

### Free Tier Includes:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ 1000 serverless function invocations/day
- ✅ 10-second function timeout
- ✅ Automatic HTTPS

### When to Upgrade to Pro ($20/month):
- Need more than 100 GB bandwidth
- Need 60-second function timeout (for complex storyboards)
- Want advanced analytics
- Need team collaboration features

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use environment variables** - Never hardcode API keys
3. **Rotate keys regularly** - Update in Vercel dashboard
4. **Monitor usage** - Check Google Cloud Console for API usage
5. **Set up billing alerts** - In Google Cloud Console

## Next Steps

- ✅ Monitor your deployment logs
- ✅ Test all features thoroughly
- ✅ Set up custom domain (optional)
- ✅ Enable Vercel Analytics (optional)
- ✅ Set up GitHub branch protection rules

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Gemini API Docs**: [ai.google.dev](https://ai.google.dev)
- **Issues**: Open an issue in your GitHub repo

---

**Deployed Successfully?** 🎉

Your PromptsGenie app should now be live and accessible worldwide!
