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
  if (contentSummary && contentSummary.trim()) {
    sections.push(`Subject: ${contentSummary.trim()}`);
  }
  if (useScene && scene && scene.trim()) {
    sections.push(`Scene: ${scene.trim()}`);
  }
  if (useStyle && style && style.trim()) {
    sections.push(`Style: ${style.trim()}`);
  }
  // If any sections exist, append them beneath the user text; otherwise return user text only
  return sections.length ? `${body}\n${sections.join("\n")}` : body;
}