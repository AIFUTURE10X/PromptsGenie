# PromptsGenie UI Design 🧞‍♂️

A beautiful, modern React application for AI-powered prompt generation and image analysis. This repository contains the complete UI design and frontend architecture.

## ✨ Features

### 🎨 Modern UI Design
- **Responsive Design**: Beautiful interface that works on all devices
- **Animated Background**: Dynamic canvas background with interactive elements
- **Modern Components**: Clean, accessible UI components built with React
- **Tailwind CSS**: Utility-first CSS framework for rapid styling

### 🖼️ Image Analysis Interface
- **Drag & Drop**: Intuitive image upload with drag-and-drop functionality
- **Progressive Loading**: Smooth image loading with progressive enhancement
- **Analysis Tools**: UI for Subject, Scene, and Style analysis
- **Real-time Preview**: Live preview of analysis results

### 📝 Prompt Generation
- **Dynamic Editor**: Advanced prompt editing interface
- **Template System**: Pre-built prompt templates and patterns
- **Export Options**: Multiple export formats for generated prompts
- **History Management**: Track and manage prompt generation history

## 🚀 Getting Started

### Deployment Options

**Option 1: Deploy to Netlify (Recommended)**
- ✅ Zero server management
- ✅ Serverless functions for API
- ✅ Automatic HTTPS & CDN
- ✅ Free tier available
- 📖 See [NETLIFY-DEPLOYMENT.md](./NETLIFY-DEPLOYMENT.md) for complete guide

**Option 2: Deploy to Vercel**
- ✅ Alternative serverless platform
- 📖 See [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md) for guide

**Option 3: Local Development**

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/promptsgenie-ui-design.git
   cd promptsgenie-ui-design
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GEMINI_MODEL_TEXT=gemini-1.5-flash
   VITE_GEMINI_MODEL_IMAGES=gemini-1.5-flash
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8085`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BackgroundCanvas.tsx    # Animated background
│   ├── BrandHeader.tsx         # Application header
│   ├── CurrentPromptPanel.tsx  # Prompt display panel
│   ├── DM2PromptEditor.tsx     # Advanced prompt editor
│   ├── ImageDropZone.tsx       # Image upload interface
│   ├── ProgressiveImage.tsx    # Progressive image loading
│   └── ui/                     # Base UI components
├── hooks/               # Custom React hooks
│   ├── useApiCache.ts          # API caching logic
│   ├── useDebounce.ts          # Debouncing utility
│   └── useImageProcessor.ts    # Image processing
├── lib/                 # Utility libraries
│   ├── geminiPrompts.ts        # Prompt templates
│   └── utils.ts                # General utilities
├── services/            # API services
│   ├── promptApi.ts            # Prompt generation API
│   └── supabasePrompt.ts       # Database integration
├── types/               # TypeScript definitions
└── workers/             # Web workers for heavy tasks
```

## 🎨 Design System

### Color Palette
- **Primary**: Modern gradient backgrounds
- **Secondary**: Subtle accent colors
- **Text**: High contrast for accessibility
- **Interactive**: Hover and focus states

### Typography
- **Headers**: Clean, modern font stack
- **Body**: Readable typography with proper spacing
- **Code**: Monospace fonts for technical content

### Components
- **Buttons**: Multiple variants with consistent styling
- **Forms**: Accessible form controls with validation
- **Cards**: Content containers with subtle shadows
- **Modals**: Overlay components for focused interactions

## 🔧 Configuration

### Environment Variables
- `VITE_GEMINI_API_KEY`: Google Gemini API key
- `VITE_GEMINI_MODEL_TEXT`: Text generation model
- `VITE_GEMINI_MODEL_IMAGES`: Image analysis model
- `API_BASE_URL`: Backend API URL
- `PORT`: Development server port

### Build Configuration
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety and better DX
- **Tailwind CSS**: Utility-first styling
- **PostCSS**: CSS processing and optimization

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured interface with all tools
- **Tablet**: Adapted layout for touch interactions
- **Mobile**: Streamlined interface for small screens

## 🎯 Future Enhancements

This UI design is ready for:
- **API Integration**: Connect to AI services
- **Authentication**: User accounts and preferences
- **Cloud Storage**: Save and sync prompts
- **Collaboration**: Share and collaborate on prompts
- **Advanced Analytics**: Usage insights and optimization

## Storyboard Generator

This project includes a storyboard generator that uses the Vertex AI API to generate images from a given plan. The generator is functional, but there is a known issue where the seventh frame fails to generate intermittently. This issue has been extensively debugged, and it is believed to be caused by an underlying issue with the environment or the Vertex AI API.

### Features

*   Generates a 7-frame storyboard from a given plan.
*   Uses the Vertex AI API to generate images.
*   Includes a retry mechanism to handle intermittent API failures.

### Known Issues

*   The seventh frame fails to generate intermittently.

## 🤝 Contributing

This is a UI design showcase. For functionality implementation:
1. Fork this repository
2. Add your API integrations
3. Implement backend services
4. Submit pull requests

## 📄 License

MIT License - feel free to use this design in your projects!

## 🙏 Acknowledgments

- Built with React and modern web technologies
- Designed for AI-powered applications
- Optimized for developer experience

---

**Note**: This repository contains the UI design and frontend architecture. API functionality can be added by implementing the service layer interfaces provided.
