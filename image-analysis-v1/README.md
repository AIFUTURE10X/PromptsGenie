# Image Analysis SDK v1

A standalone, lightweight SDK for image analysis using Google Gemini AI. This version provides specialized analysis functions for subject detection, scene analysis, and artistic style recognition.

## Features

- **Subject Analysis**: Focused detection and analysis of main subjects in images
- **Scene Analysis**: Environment and setting analysis with contextual understanding
- **Style Analysis**: Artistic style and aesthetic analysis for creative applications
- **General Analysis**: Comprehensive image analysis with detailed descriptions
- **Error Handling**: Robust error handling with specific error types and messages
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @promptsgenie/image-analysis-v1
```

## Quick Start

### Basic Usage

```typescript
import { imageAnalysisService } from '@promptsgenie/image-analysis-v1';

// Analyze an image file
const file = // ... your image file
const result = await imageAnalysisService.analyzeImage(file, {
  detail: 'medium',
  analysisType: 'general'
});

console.log(result.description);
```

### Specialized Analysis

```typescript
import { imageAnalysisService } from '@promptsgenie/image-analysis-v1';

// Subject analysis
const subjectResult = await imageAnalysisService.analyzeSubject(file, 'detailed');

// Scene analysis
const sceneResult = await imageAnalysisService.analyzeScene(file, 'medium');

// Style analysis
const styleResult = await imageAnalysisService.analyzeStyle(file, 'detailed');
```

### Using Individual Functions

```typescript
import { analyzeSubject, analyzeScene, analyzeStyle } from '@promptsgenie/image-analysis-v1';

const subjectAnalysis = await analyzeSubject(imageFile, 'detailed');
const sceneAnalysis = await analyzeScene(imageFile, 'medium');
const styleAnalysis = await analyzeStyle(imageFile, 'detailed');
```

## Configuration

Create a `.env` file in your project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-1.5-flash
```

## API Reference

### ImageAnalysisService

The main service class for image analysis operations.

#### Methods

##### `analyzeImage(image: File, options?: ImageAnalysisOptions): Promise<GeminiAnalysisResult>`

Analyze an image with specified options.

**Parameters:**
- `image`: The image file to analyze
- `options`: Analysis options (optional)
  - `detail`: 'low' | 'medium' | 'detailed' (default: 'medium')
  - `analysisType`: 'general' | 'subject' | 'scene' | 'style' (default: 'general')

##### `analyzeSubject(image: File, detail?: DetailLevel): Promise<GeminiAnalysisResult>`

Specialized subject analysis focusing on main subjects in the image.

##### `analyzeScene(image: File, detail?: DetailLevel): Promise<GeminiAnalysisResult>`

Specialized scene analysis focusing on environment and setting.

##### `analyzeStyle(image: File, detail?: DetailLevel): Promise<GeminiAnalysisResult>`

Specialized style analysis focusing on artistic style and aesthetics.

### Types

#### `GeminiAnalysisResult`

```typescript
interface GeminiAnalysisResult {
  description: string;
  colors?: string[];
  lighting?: string;
  composition?: string;
  mood?: string;
  style?: string;
  technical?: string;
  objects?: string[];
  scene?: string;
}
```

#### `ImageAnalysisOptions`

```typescript
interface ImageAnalysisOptions {
  detail?: 'low' | 'medium' | 'detailed';
  analysisType?: 'general' | 'subject' | 'scene' | 'style';
}
```

#### `ImageAnalysisError`

```typescript
interface ImageAnalysisError {
  type: 'rate_limit' | 'auth' | 'forbidden' | 'unknown';
  message: string;
  originalError?: any;
}
```

## React Integration

The SDK includes a React component for easy integration:

```typescript
import { ImageDropZone } from '@promptsgenie/image-analysis-v1';

function MyComponent() {
  const handleImageAnalysis = async (file: File) => {
    // Handle image analysis
  };

  return (
    <ImageDropZone
      onImageDrop={handleImageAnalysis}
      // ... other props
    />
  );
}
```

## Error Handling

The SDK provides comprehensive error handling:

```typescript
try {
  const result = await imageAnalysisService.analyzeImage(file);
} catch (error) {
  if (error.type === 'rate_limit') {
    console.log('Rate limit exceeded, please wait');
  } else if (error.type === 'auth') {
    console.log('Authentication error, check API key');
  } else if (error.type === 'forbidden') {
    console.log('Access forbidden, check permissions');
  } else {
    console.log('Unknown error:', error.message);
  }
}
```

## Detail Levels

- **low**: Fast analysis with basic information
- **medium**: Balanced analysis with good detail (default)
- **detailed**: Comprehensive analysis with maximum detail

## Analysis Types

- **general**: Comprehensive image analysis
- **subject**: Focus on main subjects and objects
- **scene**: Focus on environment and setting
- **style**: Focus on artistic style and aesthetics

## Requirements

- Node.js 16+
- Google Gemini API key
- React 18+ (for React components)

## License

MIT

## Support

For issues and questions, please refer to the main PromptsGenie repository.