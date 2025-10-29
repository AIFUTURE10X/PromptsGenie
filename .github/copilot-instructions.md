# PromptsGenie - AI Coding Agent Instructions

## Project Overview
PromptsGenie is a React + TypeScript app for AI-powered prompt generation and image analysis. It uses Google Gemini API for text/image processing and supports storyboard generation via Vertex AI.

## Architecture

### Dual-Runtime Model
- **Frontend**: React SPA built with Vite (TypeScript), runs on port 5173
- **Backend**: Express server on port 3000 (local dev) OR Netlify serverless functions (production)
- **API Communication**: Vite proxy (`/api` → `http://localhost:3000`) in dev; direct serverless in production

### Key Dependencies
- **Google Gemini**: Both Classic API (`generativelanguage.googleapis.com`) and Vertex AI (`aiplatform.googleapis.com`)
- **Supabase**: Optional database integration for prompt storage
- **Radix UI**: Headless components (`@radix-ui/react-*`)
- **Tailwind CSS**: Utility-first styling with custom animations

## Critical Environment Variables

### Development (`.env`)
```bash
VITE_GEMINI_API_KEY=AIza...              # Client-side API key
VITE_GEMINI_MODEL_TEXT=gemini-2.5-flash  # Text model
VITE_GEMINI_MODEL_IMAGES=gemini-2.5-flash # Image model
API_BASE_URL=http://localhost:5173
```

### Server (`.env.server`)
```bash
GOOGLE_API_KEY=AIza...                   # Server-side key
GOOGLE_PROJECT_ID=your-project-id        # For Vertex AI
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Production (Netlify Environment Variables)
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Service account as minified JSON string
- Never commit `.env` files; use `.env.example` templates

## Development Workflows

### Starting the App
```bash
npm run dev              # Frontend only (port 5173)
npm run server           # Backend only (port 3000)
npm run start            # Both concurrently (recommended)
```

### Building
```bash
npm run build            # Production build → dist/
npm run preview          # Preview built app (port 8085)
npm run test             # Run vitest tests
```

### Testing Storyboards
- Start server first (`npm run start`)
- Access `http://localhost:5173` for UI
- Tests require server running: `npm test` (expects port 8085)

## Code Patterns & Conventions

### State Management
- **Heavy state in `App.tsx`**: All major states (prompt, images, analysis results) live in root component
- **Prop drilling is normal**: Components receive callbacks and state as props
- **Example**: `DM2PromptEditor` receives `onPromptChange`, `currentPrompt`, `onRewriteStyleChange` etc.

### API Service Layer
**Frontend services** (`src/services/`):
- `promptApi.ts`: Main Gemini text generation with fallback logic (flash → pro, 2.5 → 1.5)
- `gemini.ts`: Exported to `gemini.ts.backup` (backup copy), use `promptApi.ts`
- `imageToPrompt.ts`, `analyzeImage.ts`: Image analysis workflows

**Helpers** (`src/helpers/`):
- `gemini.ts`: `generateWithImagesREST()` - direct REST API wrapper for image analysis

**Backend** (`server.js` + `netlify/functions/`):
- `callGeminiClassic()`: Text-only generation
- `callGeminiWithImages()`: Multi-modal (text + images)
- Storyboard endpoints use Vertex AI with `GoogleAuth` for OAuth2

### Error Handling Pattern
```typescript
// Fallback hierarchy: 2.5-flash → 2.5-pro → 1.5-flash → 1.5-pro
if (!res.ok) {
  if (allowFallback && (res.status === 403 || res.status === 404)) {
    let fallbackModel = model;
    if (fallbackModel.includes('2.5')) fallbackModel = fallbackModel.replace('2.5', '1.5');
    if (fallbackModel.includes('flash')) fallbackModel = fallbackModel.replace('flash', 'pro');
    return generateWithGemini(inputText, fallbackModel, false);
  }
}
```

### Image Optimization
- **All uploaded images** go through `fileToOptimizedDataUrl()` in `App.tsx`
- Resize to max 1024px, JPEG quality 0.7, convert to base64 data URLs
- Reduces payload for Gemini API calls

### Component Structure
```
src/components/
├── ui/              # Shadcn-style primitives (button, textarea, etc.)
├── BackgroundCanvas # Animated canvas background
├── DM2PromptEditor  # Main prompt editing UI
├── ImageDropZone    # Drag-and-drop with auto-analysis
├── StoryboardPanel  # Storyboard generator UI
└── CurrentPromptPanel # Display/copy prompt results
```

### TypeScript Patterns
- **Loose typing in API responses**: Use `any` for Gemini response parsing, then extract text
- **Strict Props**: Components use explicit interface definitions
- **Example**:
  ```typescript
  interface DM2PromptEditorProps {
    currentPrompt: string;
    onPromptChange: (prompt: string) => void;
    rewriteStyle: RewriteStyle;
    // ...
  }
  ```

## Known Issues & Quirks

### Storyboard Frame 7 Failure
- **Issue**: 7th frame intermittently fails to generate
- **Debugging done**: Extensive logging, retry logic, delay strategies
- **Suspected cause**: Vertex AI API rate limiting or environment issue
- **Workaround**: Retry mechanism in `storyboards-generate.js`

### Model Fallback Logic
- Always use `allowFallback: true` for text generation
- Flash models are faster but may return empty for complex prompts
- Pro models are more reliable but slower

### Console Logging
- Heavy use of emoji-prefixed logs: `🔧` (config), `❌` (errors), `🔄` (state changes)
- **Keep logging** for production debugging in serverless functions

## File Locations Reference

### Configuration
- `vite.config.ts` - Build config, proxy setup, env variable injection
- `tailwind.config.ts` - Theme, animations, custom utilities
- `netlify.toml` - Serverless redirects, build settings
- `tsconfig.json` - Frontend TypeScript config
- `tsconfig.server.json` - Server TypeScript config

### Prompt Engineering
- `src/lib/geminiPrompts.ts` - System prompts for image analysis
- `src/lib/systemPrompts.ts` - Storyboard generation prompts
- `src/lib/utils.ts` - `applyRewriteStyle()`, `formatAnalysisText()`, text transformations

### API Endpoints (Netlify Functions)
```
/api/gemini/text           → netlify/functions/gemini-text.js
/api/gemini/images         → netlify/functions/gemini-images.js
/api/storyboards/plan      → netlify/functions/storyboards-plan.js
/api/storyboards/generate  → netlify/functions/storyboards-generate.js
```

## Deployment Notes

### Netlify Production
1. Set env vars in dashboard (including `GOOGLE_APPLICATION_CREDENTIALS_JSON`)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Functions directory: `netlify/functions`

### Local Production Testing
```bash
npm run build:prod
npm run preview  # Serves from dist/ on port 8085
```

## When Making Changes

### Adding New Gemini Features
1. Add to `src/services/promptApi.ts` for client-side OR
2. Add to `netlify/functions/` for serverless
3. Update `src/config.ts` if new env vars needed
4. Follow existing fallback patterns (flash → pro, 2.5 → 1.5)

### Adding UI Components
1. Use Radix UI primitives from `src/components/ui/`
2. Add to main `App.tsx` state if needed globally
3. Use `cn()` from `lib/utils.ts` for className merging
4. Follow Tailwind convention (no custom CSS files)

### Modifying Storyboard Logic
- Server logic: `server.js` (local) OR `netlify/functions/storyboards-*.js` (production)
- Utility functions: `netlify/functions/utils/storyboard.js`
- Client UI: `src/components/StoryboardPanel.tsx`

### Testing
- Unit tests: `vitest` (run with `npm test`)
- API tests: `tests/storyboard-api.test.js` (requires server running)
- Manual testing: Check browser console for emoji logs

## Common Tasks

### Debug API Issues
```bash
# Check env vars loaded
console.log('GOOGLE_API_KEY length:', process.env.GOOGLE_API_KEY?.length);

# Test Gemini directly
node debug-gemini-response.js
node direct-gemini-test.js
```

### Add New Environment Variable
1. Add to `.env.example` and `.env.production.example`
2. Update `src/config.ts` if client-side
3. Update Vite `define` in `vite.config.ts` for client injection
4. Add to Netlify dashboard for production

### Fix Type Errors
- Check `src/types/api.ts` and `src/types/gemini.ts` for interfaces
- Frontend uses `import.meta.env.VITE_*` not `process.env`
- Backend (server.js, Netlify functions) uses `process.env`
