import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import React from 'react';

import App from './App';

// Mock the Gemini service to avoid API calls during tests
jest.mock('./services/gemini', () => ({
  analyzeImage: jest.fn(),
  textToPrompt: jest.fn(),
  refinePrompt: jest.fn(),
}));

// Mock the Gemini helper
jest.mock('./helpers/gemini', () => ({
  generateWithImagesREST: jest.fn(),
}));

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    // Check if the main app container is rendered
    expect(document.body).toBeInTheDocument();
  });

  test('renders brand header', () => {
    render(<App />);
    // The BrandHeader component should be present with the correct title
    const brandElements = screen.getAllByText('PROMPTS geni');
    expect(brandElements.length).toBeGreaterThan(0);
    expect(brandElements[0]).toBeInTheDocument();
  });

  test('renders image drop zone', () => {
    render(<App />);
    // Look for specific drop zone text
    const dropZoneElement = screen.getByText('Drop subject images here');
    expect(dropZoneElement).toBeInTheDocument();
  });
});