# Google API Setup Guide

This guide will help you configure Google APIs for the PromptsGenie application, including Gemini API for text/image generation and Vertex AI for advanced image generation.

## Overview

PromptsGenie uses three Google services:
1. **Gemini API** - For text generation and image analysis (via REST API)
2. **Vertex AI** - For advanced image generation (requires service account)
3. **Google Cloud Platform** - For authentication and project management

## Prerequisites

- Google Cloud Platform account
- Google AI Studio account (for Gemini API keys)
- Node.js and npm installed

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with something like `A1za...`)

## Step 2: Set Up Google Cloud Project for Vertex AI

### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID (e.g., `my-project-12345`)

### Enable Required APIs

1. In Google Cloud Console, go to **APIs & Services > Library**
2. Search for and enable:
   - **Vertex AI API**
   - **Cloud Resource Manager API**

### Create a Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Fill in the details:
   - Name: `promptsgenie-service-account`
   - Description: `Service account for PromptsGenie Vertex AI access`
4. Click **Create and Continue**
5. Grant the following role:
   - **Vertex AI User** (`roles/aiplatform.user`)
6. Click **Continue** then **Done**

### Download Service Account Key

1. In the Service Accounts list, click on your newly created service account
2. Go to the **Keys** tab
3. Click **Add Key > Create new key**
4. Choose **JSON** format
5. Click **Create** - the JSON file will download
6. Save this file securely (e.g., `google-credentials.json`)

**IMPORTANT**: Never commit this JSON file to version control!

## Step 3: Configure Environment Variables

### For Local Development (Express Server)

Create a `.env.server` file in the project root:

```bash
# Google API Key for Gemini API
GOOGLE_API_KEY=A1za...your_actual_api_key_here

# Google Cloud Project ID
GOOGLE_PROJECT_ID=your-project-id-12345

# Path to your service account JSON file
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/google-credentials.json

# Server Port (optional)
PORT=3000
```

### For Local Development (Vite Frontend)

Create a `.env` file in the project root:

```bash
# Frontend Gemini API Key (embedded in client build)
VITE_GEMINI_API_KEY=A1za...your_actual_api_key_here

# Gemini Models
VITE_GEMINI_MODEL_TEXT=gemini-1.5-flash
VITE_GEMINI_MODEL_IMAGES=gemini-2.5-flash
VITE_GEMINI_MODEL_IMAGE=gemini-2.5-flash

# API Base URL
API_BASE_URL=http://localhost:5173

# Server Port
PORT=5173

# Supabase (optional)
SUPABASE_URL=
SUPABASE_KEY=

# Image Analysis Settings
IMAGE_ANALYSIS_ENABLED=true
IMAGE_ANALYSIS_MAX_SIZE_MB=4
IMAGE_ANALYSIS_TIMEOUT_MS=30000
```

### For Production (Netlify)

In your Netlify dashboard, go to **Site settings > Environment variables** and add:

1. **GOOGLE_API_KEY**: Your Gemini API key
2. **GOOGLE_PROJECT_ID**: Your Google Cloud Project ID
3. **GOOGLE_APPLICATION_CREDENTIALS_JSON**: The entire JSON content as a single-line string

To convert your JSON file to a single line:
```bash
# On Linux/Mac:
cat google-credentials.json | jq -c

# Or use this online tool: https://jsonformatter.org/json-minify
```

Example minified JSON structure (replace placeholders with your actual values):
```
{"type":"service_account","project_id":"your-project-id","private_key_id":"your-key-id","private_key":"YOUR_PRIVATE_KEY_HERE","client_email":"your-service-account@project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
```

Also add the frontend environment variables:
- **VITE_GEMINI_API_KEY**: Your Gemini API key
- **VITE_GEMINI_MODEL_TEXT**: `gemini-1.5-flash`
- **VITE_GEMINI_MODEL_IMAGES**: `gemini-2.5-flash`
- **VITE_GEMINI_MODEL_IMAGE**: `gemini-2.5-flash`

## Step 4: Verify Configuration

### Test Express Server Locally

```bash
# Start the Express server
npm run server

# The server will check for GOOGLE_API_KEY on startup
# Look for these log messages:
# 🔧 Server Startup Diagnostics:
# GOOGLE_API_KEY length: 39
# GOOGLE_API_KEY last4: xyz1

# Test the API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/test
```

### Test Frontend Locally

```bash
# Start the development server
npm run dev

# Open http://localhost:5173 in your browser
# Try generating a prompt to test the API connection
```

### Full Stack Test

```bash
# Run both server and frontend
npm run start

# This runs both the Express server and Vite dev server concurrently
```

## Security Best Practices

1. **Never commit credentials to Git**:
   - The `.gitignore` file already excludes `.env*` files and JSON credentials
   - Double-check before committing

2. **Restrict API Key Permissions**:
   - In Google AI Studio, restrict your API key to specific domains
   - For Netlify deployment, add your Netlify domain

3. **Use Different Keys for Different Environments**:
   - Use separate API keys for development and production
   - This helps with debugging and cost tracking

4. **Rotate Keys Regularly**:
   - Create new API keys and service accounts periodically
   - Revoke old keys after migration

5. **Monitor Usage**:
   - Check [Google Cloud Console](https://console.cloud.google.com/apis/dashboard) for API usage
   - Set up billing alerts to avoid unexpected charges

## Troubleshooting

### Error: "GOOGLE_API_KEY is not configured"

- Check that `.env.server` file exists and contains `GOOGLE_API_KEY`
- Verify the key has no leading/trailing spaces
- Restart the server after updating environment variables

### Error: "Could not get access token"

- Verify `GOOGLE_APPLICATION_CREDENTIALS` points to a valid JSON file
- Check that the service account has the correct permissions
- Ensure the Vertex AI API is enabled in your Google Cloud project

### Error: "GOOGLE_APPLICATION_CREDENTIALS_JSON is not configured" (Netlify)

- Make sure you've added the environment variable in Netlify dashboard
- Verify the JSON is minified to a single line with no line breaks
- Check that all special characters are properly escaped

### API Rate Limiting

- Gemini API has rate limits per minute/day
- Consider implementing caching for repeated requests
- Use exponential backoff for retries

## Cost Considerations

### Gemini API Pricing (as of 2024)

- **gemini-1.5-flash**: Free tier available, then pay-per-use
- **gemini-2.5-flash**: Check current pricing at [Google AI Pricing](https://ai.google.dev/pricing)

### Vertex AI Pricing

- Image generation costs vary by model and region
- Check [Vertex AI Pricing](https://cloud.google.com/vertex-ai/pricing) for current rates
- Set up budget alerts in Google Cloud Console

## Additional Resources

- [Google AI Studio Documentation](https://ai.google.dev/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Google Auth Library for Node.js](https://github.com/googleapis/google-auth-library-nodejs)
- [PromptsGenie GitHub Repository](https://github.com/AIFUTURE10X/PromptsGenie)

## Support

If you encounter issues:
1. Check the logs in your browser console and server terminal
2. Verify all environment variables are set correctly
3. Review the troubleshooting section above
4. Open an issue on GitHub with error details
