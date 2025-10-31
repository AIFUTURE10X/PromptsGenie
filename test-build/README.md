# PromptsGenie Image Analyzer - Test Build

Modern test build for PromptsGenie image analysis using best practices and optimal tech stack.

## Tech Stack

- **Next.js 14** - React framework with App Router and server components
- **React 18** - Latest React with concurrent features
- **TypeScript 5.4** - Strict mode for maximum type safety
- **TanStack Query v5** - Powerful async state management
- **Zod** - Runtime type validation
- **Framer Motion** - Smooth animations
- **Tailwind CSS** - Utility-first styling
- **Vitest** - Fast unit testing
- **React Dropzone** - File upload handling
- **Sharp** - Image optimization

## Features

- **Three Analysis Modes**: Subject, Scene, and Style analysis
- **Dual Speed Modes**: Fast (concise) and Quality (detailed) analysis
- **Modern UI**: Beautiful, responsive design with animations
- **Type Safety**: Full TypeScript strict mode with Zod validation
- **Auto-Analysis**: Automatically re-analyzes when speed mode changes
- **Copy to Clipboard**: Easy copying of analysis results
- **Error Handling**: Comprehensive error handling and user feedback
- **Optimized Performance**: Code splitting, lazy loading, and image optimization

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Gemini API key from Google AI Studio

### Installation

1. Clone or navigate to the test-build directory:
   ```bash
   cd test-build
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Edit `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Building for Production

```bash
npm run build
npm start
```

### Testing

Run tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Project Structure

```
test-build/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── analyze/          # Image analysis endpoint
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── providers.tsx         # React Query provider
├── components/               # React components
│   ├── image-analyzer/       # Image analyzer components
│   │   ├── analyzer-card.tsx
│   │   ├── image-analyzer.tsx
│   │   └── image-upload.tsx
│   └── ui/                   # UI components
│       ├── button.tsx
│       └── card.tsx
├── hooks/                    # Custom React hooks
│   └── use-image-analysis.ts
├── lib/                      # Utility functions
│   ├── schemas.ts            # Zod schemas
│   └── utils.ts              # Helper functions
├── public/                   # Static assets
├── .env.local.example        # Environment variables template
├── .eslintrc.json            # ESLint configuration
├── .prettierrc               # Prettier configuration
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## API Routes

### POST `/api/analyze`

Analyzes an image using Google's Gemini API.

**Request Body:**
```typescript
{
  imageData: string;        // Base64 encoded image
  analyzerType: 'subject' | 'scene' | 'style';
  speedMode: 'Fast' | 'Quality';
}
```

**Response:**
```typescript
{
  success: boolean;
  prompt?: string;          // Analysis result
  error?: string;           // Error message if failed
  details?: {
    finishReason?: string;
    safetyRatings?: any[];
  };
}
```

## Configuration

### TypeScript Strict Mode

This project uses the strictest TypeScript configuration:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `exactOptionalPropertyTypes: true`

### Code Quality

- **ESLint**: Next.js recommended config with TypeScript support
- **Prettier**: Consistent code formatting with Tailwind plugin
- **Vitest**: Fast, Vite-native unit testing

### Performance Optimizations

- Automatic code splitting with manual chunks for React
- Image optimization with next/image and Sharp
- CSS optimization with Tailwind's JIT compiler
- Resource hints (preconnect, dns-prefetch)
- Disabled `poweredByHeader` for security
- Compression enabled by default

## Best Practices Implemented

1. **Type Safety**: Full TypeScript with strict mode and runtime validation using Zod
2. **Error Handling**: Comprehensive error handling at all levels (API, components, hooks)
3. **Performance**: Code splitting, lazy loading, optimized images
4. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
5. **Testing**: Configured for unit testing with Vitest
6. **Code Quality**: ESLint, Prettier, and TypeScript for consistent code
7. **Modern React**: Server components, App Router, React Query for state management
8. **Security**: No exposed API keys, secure headers, input validation
9. **UX**: Loading states, error messages, animations, responsive design
10. **Maintainability**: Clean architecture, modular components, clear separation of concerns

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `GEMINI_MODEL_TEXT` | Text model name | No | gemini-2.0-flash-exp |
| `GEMINI_MODEL_IMAGES` | Images model name | No | gemini-2.0-flash-exp |
| `GEMINI_MODEL_IMAGE` | Image model name | No | gemini-2.0-flash-exp |
| `NODE_ENV` | Environment mode | No | development |

## Troubleshooting

### API Key Issues
If you see "Gemini API key not configured", make sure:
1. `.env.local` exists in the test-build directory
2. `GEMINI_API_KEY` is set with your actual API key
3. The development server was restarted after adding the key

### Build Errors
If you encounter TypeScript errors, run:
```bash
npm run type-check
```

This will show all type errors that need to be fixed.

### Dependencies Issues
If dependencies fail to install, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

## License

MIT

## Author

Built with Claude Code using modern web development best practices.
