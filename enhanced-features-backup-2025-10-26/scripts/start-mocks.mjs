#!/usr/bin/env node

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import fs from 'fs/promises';
import path from 'path';

const MOCK_PORT = 3002;
const FIXTURES_DIR = 'scripts/fixtures';

// Mock data fixtures
const mockFixtures = {
  geminiTextResponse: {
    candidates: [{
      content: {
        parts: [{
          text: "This is a mock response from Gemini API for text generation. The actual API would provide more sophisticated responses based on the input prompt."
        }],
        role: "model"
      },
      finishReason: "STOP",
      index: 0,
      safetyRatings: [
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", probability: "NEGLIGIBLE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", probability: "NEGLIGIBLE" },
        { category: "HARM_CATEGORY_HARASSMENT", probability: "NEGLIGIBLE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", probability: "NEGLIGIBLE" }
      ]
    }],
    usageMetadata: {
      promptTokenCount: 10,
      candidatesTokenCount: 25,
      totalTokenCount: 35
    }
  },
  
  geminiImageResponse: {
    candidates: [{
      content: {
        parts: [{
          text: "This image appears to show a digital interface or application. I can see various UI elements including buttons, text fields, and navigation components. The design follows modern web application patterns with clean typography and structured layout. This is a mock analysis - the actual Gemini Vision API would provide detailed visual analysis of the uploaded image."
        }],
        role: "model"
      },
      finishReason: "STOP",
      index: 0
    }],
    usageMetadata: {
      promptTokenCount: 15,
      candidatesTokenCount: 45,
      totalTokenCount: 60
    }
  },
  
  promptGenerationResponse: {
    prompt: "Create a detailed, engaging prompt for an AI image generator that captures the essence of the user's request while incorporating artistic style elements and technical specifications for optimal results.",
    metadata: {
      style: "detailed",
      length: "medium",
      creativity: "high",
      technical_specs: true
    },
    suggestions: [
      "Consider adding lighting specifications",
      "Include composition guidelines",
      "Specify artistic medium or style"
    ]
  }
};

// Create MSW handlers
const handlers = [
  // Mock Gemini API text generation
  http.post('https://generativelanguage.googleapis.com/v1beta/models/*/generateContent', async ({ request }) => {
    console.log('🤖 Mock: Gemini text generation request intercepted');
    
    const body = await request.json();
    console.log('📝 Request prompt:', body.contents?.[0]?.parts?.[0]?.text?.substring(0, 100) + '...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    return HttpResponse.json(mockFixtures.geminiTextResponse);
  }),
  
  // Mock local server endpoints
  http.post('http://localhost:3001/api/gemini/text', async ({ request }) => {
    console.log('🔄 Mock: Local Gemini text endpoint intercepted');
    
    const body = await request.json();
    console.log('📝 Local request:', body.prompt?.substring(0, 100) + '...');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return HttpResponse.json({
      success: true,
      result: mockFixtures.geminiTextResponse.candidates[0].content.parts[0].text,
      usage: mockFixtures.geminiTextResponse.usageMetadata
    });
  }),
  
  http.post('http://localhost:3001/api/gemini/images', async ({ request }) => {
    console.log('🖼️ Mock: Local Gemini image analysis intercepted');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return HttpResponse.json({
      success: true,
      analysis: mockFixtures.geminiImageResponse.candidates[0].content.parts[0].text,
      usage: mockFixtures.geminiImageResponse.usageMetadata
    });
  }),
  
  // Mock Supabase endpoints (if used)
  http.post('https://*.supabase.co/rest/v1/*', async ({ request }) => {
    console.log('🗄️ Mock: Supabase request intercepted');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return HttpResponse.json({
      data: [],
      status: 200,
      statusText: 'OK'
    });
  }),
  
  // Mock external APIs that might be used
  http.get('https://api.github.com/*', async () => {
    console.log('🐙 Mock: GitHub API request intercepted');
    
    return HttpResponse.json({
      message: 'Mock GitHub API response',
      status: 'success'
    });
  }),
  
  // Health check endpoint
  http.get('http://localhost:3002/health', () => {
    return HttpResponse.json({
      status: 'ok',
      service: 'MSW Mock Server',
      timestamp: new Date().toISOString(),
      mocks: {
        gemini: 'active',
        local_api: 'active',
        supabase: 'active',
        github: 'active'
      }
    });
  })
];

// Create and configure the server
const server = setupServer(...handlers);

async function startMockServer() {
  console.log('🚀 Starting MSW Mock Server...');
  
  try {
    // Ensure fixtures directory exists
    await fs.mkdir(FIXTURES_DIR, { recursive: true });
    
    // Save fixtures to files for reference
    await fs.writeFile(
      path.join(FIXTURES_DIR, 'gemini-responses.json'),
      JSON.stringify(mockFixtures, null, 2)
    );
    
    // Start the server
    server.listen({
      onUnhandledRequest: (request) => {
        console.log(`⚠️  Unhandled ${request.method} request to ${request.url}`);
      }
    });
    
    console.log('✅ MSW Mock Server started successfully');
    console.log('🔧 Mock endpoints active:');
    console.log('   • Gemini API (text generation)');
    console.log('   • Gemini API (image analysis)');
    console.log('   • Local server endpoints');
    console.log('   • Supabase API');
    console.log('   • GitHub API');
    console.log(`   • Health check: http://localhost:3002/health`);
    console.log('');
    console.log('💡 To use mocks in your app:');
    console.log('   • Set MOCK_GEMINI_API=true in your .env');
    console.log('   • Restart your development server');
    console.log('   • All API calls will be intercepted by MSW');
    console.log('');
    console.log('🛑 Press Ctrl+C to stop the mock server');
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\\n🛑 Stopping MSW Mock Server...');
      server.close();
      console.log('✅ Mock server stopped');
      process.exit(0);
    });
    
    // Prevent the process from exiting
    setInterval(() => {
      // Keep alive
    }, 1000);
    
  } catch (error) {
    console.error('❌ Failed to start mock server:', error.message);
    process.exit(1);
  }
}

// Enhanced logging for development
server.events.on('request:start', ({ request }) => {
  const url = new URL(request.url);
  if (!url.pathname.includes('health')) {
    console.log(`📡 ${request.method} ${url.pathname}`);
  }
});

server.events.on('request:match', ({ request }) => {
  const url = new URL(request.url);
  if (!url.pathname.includes('health')) {
    console.log(`✅ Mock matched: ${request.method} ${url.pathname}`);
  }
});

server.events.on('request:unhandled', ({ request }) => {
  console.log(`⚠️  Unhandled: ${request.method} ${request.url}`);
});

// Export for testing
export { server, handlers, mockFixtures };

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMockServer();
}