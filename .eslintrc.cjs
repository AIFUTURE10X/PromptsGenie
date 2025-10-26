/* eslint config for ESLint 8.57.1 + TS 5.9.3 + @typescript-eslint 6.21.0 */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    // Enable type-aware rules by pointing to your tsconfig
    project: ["./tsconfig.json"], // remove if performance is an issue
    tsconfigRootDir: __dirname,
    ecmaFeatures: { jsx: true }
  },
  settings: {
    react: { version: "detect" },
    "import/resolver": {
      // For TS path aliases like @/*
      typescript: {
        alwaysTryTypes: true,
        project: "./"
      },
      node: { extensions: [".js", ".jsx", ".ts", ".tsx"] }
    }
  },
  plugins: ["@typescript-eslint", "import", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    // Type-aware rules for stricter checking - COMMENTED OUT for production use
    // "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
    // "prettier" // if you use Prettier; otherwise remove
  ],
  rules: {
    // TS strictness
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
    "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }],
    "@typescript-eslint/explicit-function-return-type": "off", // too strict for most projects initially
    
    // Type-aware rules for better type safety - COMMENTED OUT for production use
    // "@typescript-eslint/no-unsafe-assignment": "warn",
    // "@typescript-eslint/no-unsafe-call": "warn",
    // "@typescript-eslint/no-unsafe-member-access": "warn",
    // "@typescript-eslint/no-misused-promises": "warn",

    // Imports hygiene
    "import/order": [
      "warn",
      {
        groups: [["builtin", "external"], ["internal"], ["parent", "sibling", "index"]],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true }
      }
    ],
    "import/no-unresolved": "off", // handled by TS
    "import/no-extraneous-dependencies": ["warn", { devDependencies: ["**/*.test.*", "**/tests/**", "**/scripts/**"] }],

    // React specifics
    "react/react-in-jsx-scope": "off", // not needed with new JSX transform
    "react/prop-types": "off" // not needed with TypeScript
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
      rules: {
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-assignment": "off"
      }
    }
  ]
};