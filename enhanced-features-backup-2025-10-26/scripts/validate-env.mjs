#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config();

// Environment schema definition
const envSchema = z.object({
  // Required environment variables
  VITE_GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  GOOGLE_API_KEY: z.string().min(1, 'Google AI Studio API key is required'),
  VITE_GEMINI_MODEL_IMAGES: z.string().optional().default('gemini-2.5-flash'),
  VITE_GEMINI_MODEL_TEXT: z.string().optional().default('gemini-2.5-flash'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional environment variables with defaults
  PORT: z.string().regex(/^\d+$/, 'Port must be a number').optional().default('8085'),
  API_BASE_URL: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  
  // Optional external service configurations
  VITE_SUPABASE_URL: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  VITE_ENABLE_IMAGE_ANALYSIS: z.string().optional(),
  VITE_SUPABASE_STATUS_PING: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  GITHUB_PERSONAL_ACCESS_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  
  // Image analysis configuration
  IMAGE_ANALYZER_BACKEND: z.enum(['gemini', 'openai', 'anthropic']).optional().default('gemini'),
  IMAGE_ANALYZER_TIMEOUT_MS: z.string().regex(/^\d+$/, 'Timeout must be a number in milliseconds').optional().default('20000'),
  
  // Development/testing flags
  MOCK_GEMINI_API: z.enum(['true', 'false']).default('false'),
  ENABLE_DEBUG_LOGS: z.enum(['true', 'false']).default('false'),
  SKIP_API_VALIDATION: z.enum(['true', 'false']).default('false'),
});

const REPORT_PATH = '.reports/env-validation.json';

async function validateEnvironment() {
  console.log('🔍 Starting environment validation...');
  
  const results = {
    timestamp: new Date().toISOString(),
    valid: false,
    errors: [],
    warnings: [],
    envFiles: [],
    variables: {
      required: [],
      optional: [],
      missing: [],
      invalid: []
    },
    summary: {
      totalChecked: 0,
      requiredMissing: 0,
      optionalMissing: 0,
      invalidValues: 0
    }
  };
  
  try {
    // Check for environment files
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
    
    for (const envFile of envFiles) {
      try {
        await fs.access(envFile);
        results.envFiles.push({
          file: envFile,
          exists: true,
          readable: true
        });
        console.log(`✅ Found environment file: ${envFile}`);
      } catch {
        results.envFiles.push({
          file: envFile,
          exists: false,
          readable: false
        });
      }
    }
    
    // Load environment variables
    const env = process.env;
    console.log('🧪 Validating environment variables...');
    
    // Validate against schema
    const validation = envSchema.safeParse(env);
    
    if (validation.success) {
      results.valid = true;
      console.log('✅ All environment variables are valid');
      
      // Categorize variables
      Object.keys(envSchema.shape).forEach(key => {
        const value = env[key];
        const schemaField = envSchema.shape[key];
        
        results.summary.totalChecked++;
        
        if (value !== undefined) {
          if (schemaField.isOptional && schemaField.isOptional()) {
            results.variables.optional.push({
              name: key,
              value: key.includes('KEY') || key.includes('TOKEN') ? '[REDACTED]' : value,
              type: 'optional'
            });
          } else {
            results.variables.required.push({
              name: key,
              value: key.includes('KEY') || key.includes('TOKEN') ? '[REDACTED]' : value,
              type: 'required'
            });
          }
        }
      });
      
    } else {
      console.log('❌ Environment validation failed');
      
      validation.error.errors.forEach(error => {
        const field = error.path[0];
        const message = error.message;
        
        results.errors.push({
          field,
          message,
          code: error.code,
          type: 'validation_error'
        });
        
        // Check if it's a missing required field
        if (error.code === 'invalid_type' && error.received === 'undefined') {
          results.variables.missing.push({
            name: field,
            required: true,
            message
          });
          results.summary.requiredMissing++;
        } else {
          results.variables.invalid.push({
            name: field,
            value: env[field],
            message
          });
          results.summary.invalidValues++;
        }
        
        results.summary.totalChecked++;
      });
    }
    
    // Check for potentially sensitive values in environment
    const sensitivePatterns = [
      { pattern: /^[A-Za-z0-9+/]{40,}={0,2}$/, name: 'Base64 encoded secret' },
      { pattern: /^[a-f0-9]{32,}$/, name: 'Hex encoded secret' },
      { pattern: /^sk-[a-zA-Z0-9]{48,}$/, name: 'OpenAI API key pattern' },
      { pattern: /^AIza[0-9A-Za-z-_]{35}$/, name: 'Google API key pattern' }
    ];
    
    Object.entries(env).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        sensitivePatterns.forEach(({ pattern, name }) => {
          if (pattern.test(value) && !key.includes('KEY') && !key.includes('TOKEN')) {
            results.warnings.push({
              type: 'potential_secret',
              field: key,
              message: `Variable "${key}" appears to contain a ${name} but is not marked as sensitive`,
              suggestion: `Consider renaming to include "KEY" or "TOKEN" in the variable name`
            });
          }
        });
      }
    });
    
    // Check for example file
    try {
      const exampleContent = await fs.readFile('.env.example', 'utf8');
      const exampleVars = exampleContent
        .split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=')[0].trim());
      
      // Check if all example vars are documented
      const currentVars = Object.keys(env);
      const undocumented = currentVars.filter(key => 
        !exampleVars.includes(key) && 
        !key.startsWith('npm_') && 
        !key.startsWith('NODE_') &&
        key !== 'PATH'
      );
      
      if (undocumented.length > 0) {
        results.warnings.push({
          type: 'undocumented_vars',
          message: `Variables not in .env.example: ${undocumented.join(', ')}`,
          suggestion: 'Consider adding these to .env.example for documentation'
        });
      }
      
    } catch {
      results.warnings.push({
        type: 'missing_example',
        message: '.env.example file not found',
        suggestion: 'Create .env.example to document required environment variables'
      });
    }
    
  } catch (error) {
    console.error('❌ Environment validation error:', error.message);
    results.errors.push({
      type: 'system_error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Save results
  try {
    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, JSON.stringify(results, null, 2));
  } catch (writeError) {
    console.error('Failed to write report:', writeError.message);
  }
  
  // Console summary
  console.log('\n📊 Environment Validation Results:');
  console.log(`✅ Valid: ${results.valid ? 'Yes' : 'No'}`);
  console.log(`📄 Environment Files: ${results.envFiles.filter(f => f.exists).length}/${results.envFiles.length}`);
  console.log(`🔧 Required Variables: ${results.variables.required.length}`);
  console.log(`⚙️  Optional Variables: ${results.variables.optional.length}`);
  console.log(`❌ Missing Required: ${results.summary.requiredMissing}`);
  console.log(`⚠️  Invalid Values: ${results.summary.invalidValues}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 Errors:');
    results.errors.forEach(error => {
      console.log(`   ${error.field || 'System'}: ${error.message}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => {
      console.log(`   ${warning.type}: ${warning.message}`);
      if (warning.suggestion) {
        console.log(`      💡 ${warning.suggestion}`);
      }
    });
  }
  
  console.log(`📄 Detailed report saved to: ${REPORT_PATH}`);
  
  // Exit with error if validation failed
  if (!results.valid || results.summary.requiredMissing > 0) {
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Environment validation interrupted');
  process.exit(1);
});

// Run validation
validateEnvironment();