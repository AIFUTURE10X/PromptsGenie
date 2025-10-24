# Build and Deployment Guide

## Environment Setup

### Development
1. Copy `.env.example` to `.env`
2. Fill in your Gemini API key and other required variables
3. Run `npm run dev` for development

### Production Build
1. Copy `.env.production` to `.env.local` for local production testing
2. Set your production environment variables
3. Run build commands

## Build Scripts

### Available Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build with production mode explicitly
- `npm run preview` - Preview the built application
- `npm run preview:build` - Build and preview in one command
- `npm run clean` - Clean the dist directory
- `npm run build:clean` - Clean and build

### Environment Variables

#### Required Variables
- `VITE_GEMINI_API_KEY` - Your Gemini API key (starts with AIza)
- `VITE_GEMINI_MODEL_TEXT` - Text model (recommended: gemini-1.5-flash)
- `VITE_GEMINI_MODEL_IMAGES` - Image model (recommended: gemini-1.5-flash)

#### Optional Variables
- `API_BASE_URL` - Base URL for API calls
- `PORT` - Server port (default: 8085)
- `VITE_ENABLE_IMAGE_ANALYSIS` - Enable/disable image analysis features
- `VITE_SUPABASE_URL` - Supabase URL (if using Supabase)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SUPABASE_STATUS_PING` - Enable Supabase status ping

## Build Configuration

The application is configured with:
- **Vite** for fast builds and development
- **Environment variable injection** for build mode
- **Code splitting** for optimized loading
- **Manual chunks** for vendor and UI libraries

## Deployment

### Static Hosting (Netlify, Vercel, etc.)
1. Set environment variables in your hosting platform
2. Run `npm run build`
3. Deploy the `dist` folder

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8085
CMD ["npm", "run", "preview"]
```

### Environment Variable Security
- Never commit `.env` files to version control
- Use `.env.local` for local production testing
- Set environment variables in your deployment platform
- Ensure API keys are properly secured

## Troubleshooting

### Build Issues
- Ensure all environment variables are set
- Check that API keys are valid
- Verify model names are correct (use gemini-1.5-flash for stability)

### Runtime Issues
- Check browser console for API errors
- Verify environment variables are loaded correctly
- Test API connectivity with the built-in test function

## Performance Optimizations

The build includes:
- Code splitting for vendor libraries
- Optimized chunk sizes
- Tree shaking for unused code
- Minification and compression
- Source map generation (disabled in production)