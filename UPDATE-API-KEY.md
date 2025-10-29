# How to Update Your API Key

## Step 1: Generate New API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key" or "Get API Key"
3. Copy the new key (starts with `AIza...`)

## Step 2: Update in Netlify

Run these commands in your terminal (in the PromptsGenie folder):

```powershell
npx netlify env:set GOOGLE_API_KEY "AIzaSyDixIwjpAsWCTqcMtx429wdlzRCTLamW9I" --force
npx netlify env:set VITE_GEMINI_API_KEY "AIzaSyCrj4NFfVxRpGSA0dOYifPnBECnb12h_I4" --force
```

## Step 3: Redeploy

```powershell
npx netlify deploy --prod
```

## Step 4: Update Local .env Files

Edit `.env` and `.env.server` files and replace the old key with the new one.

## Troubleshooting

If the key still doesn't work:

1. **Check API restrictions**: In Google Cloud Console, make sure the key isn't restricted to specific IPs or referrers
2. **Enable APIs**: Make sure "Generative Language API" is enabled in your Google Cloud project
3. **Check quota**: Ensure you haven't exceeded your API quota

## Quick Check

Test your API key with this curl command (replace YOUR_KEY):

```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_KEY"
```

If it returns a list of models, your key is valid!
