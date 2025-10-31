import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Enhanced error filtering for browser extensions and geolocation services
const originalError = console.error;
const originalWarn = console.warn;

// List of patterns to filter out
const errorFilters = [
  // Browser extensions
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  
  // Geolocation services
  'geoip.maxmind.com',
  'ipapi.co',
  'ip-api.com',
  'freegeoip.app',
  
  // Network errors
  'ERR_TUNNEL_CONNECTION_FAILED',
  'ERR_NETWORK_CHANGED',
  'ERR_INTERNET_DISCONNECTED',
  'ERR_NAME_NOT_RESOLVED',
  
  // Geolocation specific errors
  'Failed to get geolocation data',
  'GfAdunit',
  'Geolocation request failed',
  'Position unavailable',
  
  // Ad blockers and privacy extensions
  'uBlock',
  'AdBlock',
  'Privacy Badger',
  'Ghostery',
  
  // Common extension errors
  'Extension context invalidated',
  'Could not establish connection'
];

// Function to check if error should be filtered
const shouldFilterError = (message: string): boolean => {
  return errorFilters.some(filter => 
    message.toLowerCase().includes(filter.toLowerCase())
  );
};

// Override console.error
console.error = (...args) => {
  const errorString = args.join(' ');
  if (shouldFilterError(errorString)) {
    return; // Skip logging filtered errors
  }
  originalError.apply(console, args);
};

// Override console.warn for warnings
console.warn = (...args) => {
  const warnString = args.join(' ');
  if (shouldFilterError(warnString)) {
    return; // Skip logging filtered warnings
  }
  originalWarn.apply(console, args);
};

// Filter unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.toString() || '';
  if (shouldFilterError(errorMessage)) {
    event.preventDefault(); // Prevent the error from being logged
  }
});

// Filter global errors
window.addEventListener('error', (event) => {
  if (event.message && shouldFilterError(event.message)) {
    event.preventDefault();
    return false;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);