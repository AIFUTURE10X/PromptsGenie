# Image → Prompt Generator

A local web application that generates concise, high-quality prompts from images using Google's Gemini 2.0 Flash model.

## Prerequisites

- Node.js v18 or higher (tested with Node v22)
- Google API key with access to Gemini API

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```
4. Add your Google API key to `.env`:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```

## Running the Application

Start the server:
```bash
npm run start
```

Then open http://localhost:3001/index.html in your browser.

## API Usage

### Health Check
```bash
curl http://localhost:3001/health
```

### Generate Prompt from Image
```bash
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/your/image.jpg"
```

## Troubleshooting

### 401/403 Errors
- Verify your Google API key is correctly set in `.env`
- Ensure your API key has access to Gemini API
- Check if you've exceeded your API quota

### 404 Model Not Found
- Verify the model name in `.env` is exactly `gemini-2.0-flash`
- Check if the model is available in your region

### CORS Issues
- The server is configured to allow all origins in development
- If deploying, update CORS configuration in `server/index.js`

### Other Issues
- Check server logs for detailed error messages
- Ensure image file is under 5MB
- Verify your Node.js version is 18 or higher