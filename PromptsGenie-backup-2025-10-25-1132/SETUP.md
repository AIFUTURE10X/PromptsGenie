# Setup Guide

## Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure API Key
```bash
cp .env.example .env
```

Edit `.env` and add your Google AI API key:
```env
GOOGLE_API_KEY=AIzaSy...your_actual_key_here
```

Get your API key: https://aistudio.google.com/app/apikey

### Step 3: Run Diagnostics
```bash
node scripts/diagnose_fetch_errors.js
```

Expected output:
```
✅ API key found
✅ Can reach Google AI endpoint
✅ Text generation works
✅ Image analysis works
✅ All diagnostics passed!
```

### Step 4: Start Server
```bash
npm run dev
```

Server starts on http://localhost:8085

### Step 5: Test Endpoints
```bash
# Health check
curl http://localhost:8085/health

# Analyze image
curl -X POST http://localhost:8085/analyze-image \
  -H "Content-Type: application/json" \
  -d '{
    "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAF/gL9w5gCpgAAAABJRU5ErkJggg==",
    "mimeType": "image/png"
  }'
```

## Troubleshooting "Failed to fetch"

Run the diagnostic script:
```bash
node scripts/diagnose_fetch_errors.js
```

This will check:
- ✅ API key presence and format
- ✅ Network connectivity to Google AI
- ✅ SDK installation
- ✅ Text generation
- ✅ Image analysis with base64
- ✅ Timeout handling

## Common Issues & Fixes

### Issue: "GOOGLE_API_KEY not found"

**Fix:**
```bash
export GOOGLE_API_KEY=your_key_here
# or add to .env file
```

### Issue: "Failed to fetch" with base64 images

**Cause:** Base64 data has `data:image/...;base64,` prefix

**Fix:** Remove the prefix
```javascript
// ❌ Wrong
"base64": "data:image/png;base64,iVBORw0KG..."

// ✅ Correct
"base64": "iVBORw0KG..."
```

The service automatically strips this prefix, but if you're calling the Gemini API directly, you must remove it.

### Issue: "API_KEY_INVALID"

**Fix:** Get a new API key from https://aistudio.google.com/app/apikey

### Issue: Timeout errors

**Fix:** Increase timeout in `.env`:
```env
TIMEOUT_MS_FAST=12000
TIMEOUT_MS_QUALITY=20000
```

### Issue: "Image size exceeds limit"

**Fix:** Reduce image size or increase limit:
```env
MAX_IMAGE_BYTES=16000000  # 16MB
```

### Issue: Network/firewall blocking

**Fix:** Ensure outbound HTTPS to `generativelanguage.googleapis.com` is allowed

## Development

### Run in development mode (auto-reload):
```bash
npm run dev
```

### Build for production:
```bash
npm run build
```

### Run production build:
```bash
npm start
```

### Run tests:
```bash
npm test
```

### Run sanity test:
```bash
npm run sanity
```

## Docker

### Build:
```bash
docker build -t gemini-service .
```

### Run:
```bash
docker run -p 8085:8085 --env-file .env gemini-service
```

## Environment Variables

See `.env.example` for all available options.

### Required:
- `GOOGLE_API_KEY` - Your Google AI API key

### Optional:
- `GEMINI_PRIMARY` - Primary model tier (flash/pro)
- `GEMINI_FALLBACK` - Fallback model tier
- `PREFERRED_MAJOR` - Preferred model version (2.5/2.0/1.5)
- `AB_RATIO` - A/B test ratio (0.0-1.0)
- `SHADOW_MODE` - Enable shadow mode (true/false)
- `TIMEOUT_MS_FAST` - Fast mode timeout
- `TIMEOUT_MS_QUALITY` - Quality mode timeout
- `MAX_IMAGE_BYTES` - Max image size
- `PORT` - Server port
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

## Next Steps

- ✅ Run diagnostics: `node scripts/diagnose_fetch_errors.js`
- ✅ Start server: `npm run dev`
- ✅ Test endpoints with curl (see README.md)
- ✅ Check metrics: `curl http://localhost:8085/metrics`
- ✅ Review logs for any issues
- ✅ Run integration tests: `npm test`

## Support

If you encounter issues:

1. Run `node scripts/diagnose_fetch_errors.js`
2. Check logs (set `LOG_LEVEL=debug`)
3. Review error messages in console
4. Check `/metrics` endpoint for patterns
5. Verify API key is valid and has quota

## API Documentation

See `openapi.yaml` for full API specification.

View in Swagger Editor: https://editor.swagger.io/