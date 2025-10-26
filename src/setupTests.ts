// Jest setup file for DOM testing
import '@testing-library/jest-dom';

// Mock import.meta for Vite environment variables
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_GEMINI_API_KEY: 'test-api-key',
        GOOGLE_API_KEY: 'test-google-key',
        VITE_GEMINI_MODEL_TEXT: 'gemini-1.5-flash',
        VITE_GEMINI_MODEL_IMAGES: 'gemini-1.5-flash',
        VITE_GEMINI_MODEL_IMAGE: 'gemini-1.5-flash',
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_REPLICATE_API_TOKEN: 'test-replicate-token',
        BASE_URL: '/',
        DEV: true,
        PROD: false,
        VITE_GOOGLE_API_KEY: 'test-google-key',
        VITE_GEMINI_MODEL: 'gemini-2.5-flash',
        VITE_GEMINI_PRIMARY: 'flash',
        VITE_GEMINI_FALLBACK: 'pro',
        VITE_PREFERRED_MAJOR: '2.5',
        VITE_ROUTE_POLICY: 'latency',
        VITE_AB_RATIO: '0.2',
        VITE_SHADOW_MODE: 'false',
        VITE_TIMEOUT_MS_FAST: '8000',
        VITE_TIMEOUT_MS_QUALITY: '12000',
        VITE_MAX_IMAGE_BYTES: '8000000',
        VITE_LOG_LEVEL: 'info',
        VITE_PORT: '3001',
        VITE_TEST_MODE: 'true',
        VITE_SUPABASE_STATUS_PING: 'false',
      },
      url: 'file:///test/path',
    },
  },
});

// Mock environment variables for tests
process.env.GOOGLE_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));