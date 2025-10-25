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
  
  // Add subject/content summary with heading
  if (contentSummary && contentSummary.trim()) {
    sections.push(`Subject: ${contentSummary.trim()}`);
  }
  
  // Add scene information with heading
  if (useScene && scene && scene.trim()) {
    const cleanScene = scene.trim().replace(/^Scene:\s*/i, '');
    sections.push(`Scene: ${cleanScene}`);
  }
  
  // Add style information with heading
  if (useStyle && style && style.trim()) {
    const cleanStyle = style.trim().replace(/^Style:\s*/i, '');
    sections.push(`Style: ${cleanStyle}`);
  }
  
  // Create a clean prompt with each category on a new line
  if (sections.length === 0) {
    return body;
  }
  
  // If we have a user text body, append the analysis sections on new lines
  if (body) {
    return `${body}\n${sections.join('\n')}`;
  }
  
  // If no user text, create a structured prompt with each category on a new line
  return sections.join('\n');
}