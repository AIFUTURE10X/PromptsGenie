import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ComposeParts {
  userText: string;
  style?: string;
  scene?: string;
  contentSummary?: string;
  useStyle?: boolean;
  useScene?: boolean;
}

export function composePrompt(parts: ComposeParts): string {
  const { userText, style, scene, contentSummary, useStyle = true, useScene = true } = parts;
  const sections: string[] = [];
  const body = userText?.trim() || "";
  
  // Add subject/content summary first (this is the main subject)
  if (contentSummary && contentSummary.trim()) {
    sections.push(contentSummary.trim());
  }
  
  // Add scene information naturally integrated
  if (useScene && scene && scene.trim()) {
    const cleanScene = scene.trim().replace(/^Scene:\s*/i, '');
    sections.push(cleanScene);
  }
  
  // Add style information naturally integrated
  if (useStyle && style && style.trim()) {
    const cleanStyle = style.trim().replace(/^Style:\s*/i, '');
    sections.push(cleanStyle);
  }
  
  // Create a natural, flowing prompt by joining sections with commas and proper formatting
  if (sections.length === 0) {
    return body;
  }
  
  // If we have a user text body, append the analysis sections
  if (body) {
    return `${body}, ${sections.join(', ')}`;
  }
  
  // If no user text, create a natural sentence from the analysis sections
  return sections.join(', ');
}