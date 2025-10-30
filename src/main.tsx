import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Filter out noisy browser extension and geolocation errors from console
const originalError = console.error;
console.error = (...args) => {
  const errorString = args.join(' ');
  // Ignore known browser extension and geolocation errors
  if (
    errorString.includes('chrome-extension://') ||
    errorString.includes('geoip.maxmind.com') ||
    errorString.includes('ERR_TUNNEL_CONNECTION_FAILED') ||
    errorString.includes('Failed to get geolocation data')
  ) {
    return; // Skip logging these errors
  }
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);