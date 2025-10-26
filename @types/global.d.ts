// Global type definitions for missing modules

declare module 'mime' {
  export function getType(path: string): string | null;
  export function getExtension(type: string): string | null;
  export function define(mimes: { [key: string]: string[] }): void;
  export const charsets: { [key: string]: string };
}

declare module 'babel_core' {
  const babel: any;
  export = babel;
}

declare module 'babel_generator' {
  const generator: any;
  export = generator;
}

declare module 'babel_template' {
  const template: any;
  export = template;
}

declare module 'babel_traverse' {
  const traverse: any;
  export = traverse;
}

declare module 'body-parser' {
  const bodyParser: any;
  export = bodyParser;
}

declare module 'estree' {
  const estree: any;
  export = estree;
}

declare module 'json-schema' {
  const jsonSchema: any;
  export = jsonSchema;
}

declare module '*.mdx' {
  const MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}

declare module 'pino' {
  const pino: any;
  export = pino;
}

declare module 'replicate' {
  const Replicate: any;
  export = Replicate;
}