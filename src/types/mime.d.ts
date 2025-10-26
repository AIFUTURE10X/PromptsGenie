declare module 'mime' {
  export function getType(path: string): string | null;
  export function getExtension(type: string): string | null;
  export function define(typeMap: { [key: string]: string[] }, force?: boolean): void;
  
  export const charsets: {
    lookup(type: string, fallback?: string): string | false;
  };
}