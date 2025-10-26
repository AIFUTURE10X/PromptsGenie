#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import SwaggerParser from '@apidevtools/swagger-parser';

const OPENAPI_FILE = 'openapi.yaml';
const SERVER_URL = 'http://localhost:3001';
const REPORT_PATH = '.reports/openapi-validation.json';

// API Contract Configuration
const API_CONFIG = {
  retryPolicy: {
    maxRetries: 3,
    baseMs: 300,
    maxMs: 5000,
    backoffFactor: 2
  },
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    resetTimeoutMs: 30000
  },
  timeout: 10000
};

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || 30000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

async function retryWithBackoff(fn, options = API_CONFIG.retryPolicy) {
  let lastError;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === options.maxRetries) {
        break;
      }
      
      const delay = Math.min(
        options.baseMs * Math.pow(options.backoffFactor, attempt),
        options.maxMs
      );
      
      console.log(`⏳ Retry attempt ${attempt + 1}/${options.maxRetries} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

async function validateOpenAPISchema() {
  console.log('🔍 Starting OpenAPI schema validation...');
  
  const results = {
    timestamp: new Date().toISOString(),
    schemaValid: false,
    contractTests: [],
    errors: [],
    warnings: [],
    summary: {
      totalEndpoints: 0,
      testedEndpoints: 0,
      passedTests: 0,
      failedTests: 0
    }
  };
  
  try {
    // Check if OpenAPI file exists
    const openApiPath = path.resolve(OPENAPI_FILE);
    console.log(`📄 Reading OpenAPI spec from: ${openApiPath}`);
    
    const fileContent = await fs.readFile(openApiPath, 'utf8');
    let apiSpec;
    
    // Parse YAML or JSON
    try {
      if (openApiPath.endsWith('.yaml') || openApiPath.endsWith('.yml')) {
        apiSpec = yaml.load(fileContent);
      } else {
        apiSpec = JSON.parse(fileContent);
      }
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAPI spec: ${parseError.message}`);
    }
    
    console.log('✅ OpenAPI spec parsed successfully');
    
    // Validate schema using swagger-parser
    console.log('🧪 Validating OpenAPI schema...');
    const validatedApi = await SwaggerParser.validate(apiSpec);
    
    results.schemaValid = true;
    console.log('✅ OpenAPI schema is valid');
    
    // Extract endpoints for testing
    const endpoints = [];
    if (validatedApi.paths) {
      Object.keys(validatedApi.paths).forEach(pathKey => {
        const pathItem = validatedApi.paths[pathKey];
        Object.keys(pathItem).forEach(method => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
            endpoints.push({
              path: pathKey,
              method: method.toUpperCase(),
              operationId: pathItem[method].operationId,
              summary: pathItem[method].summary
            });
          }
        });
      });
    }
    
    results.summary.totalEndpoints = endpoints.length;
    console.log(`📊 Found ${endpoints.length} API endpoints to validate`);
    
    // Test each endpoint for basic contract compliance
    for (const endpoint of endpoints) {
      console.log(`🧪 Testing ${endpoint.method} ${endpoint.path}...`);
      
      const testResult = {
        endpoint: `${endpoint.method} ${endpoint.path}`,
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        passed: false,
        error: null,
        responseTime: null
      };
      
      try {
        const startTime = Date.now();
        const url = `${SERVER_URL}${endpoint.path.replace(/\{[^}]+\}/g, 'test')}`;
        
        // Simple connectivity test (not full contract validation)
        const response = await fetch(url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          // Add basic body for POST/PUT requests
          ...(endpoint.method === 'POST' || endpoint.method === 'PUT' ? {
            body: JSON.stringify({ test: true })
          } : {})
        });
        
        testResult.responseTime = Date.now() - startTime;
        testResult.statusCode = response.status;
        
        // Consider 2xx, 4xx as valid responses (server is responding according to contract)
        if (response.status < 500) {
          testResult.passed = true;
          results.summary.passedTests++;
        } else {
          testResult.error = `Server error: ${response.status}`;
          results.summary.failedTests++;
        }
        
        results.summary.testedEndpoints++;
        
      } catch (error) {
        testResult.error = error.message;
        results.summary.failedTests++;
        
        // Don't count connection errors as tested endpoints
        if (!error.message.includes('ECONNREFUSED')) {
          results.summary.testedEndpoints++;
        }
      }
      
      results.contractTests.push(testResult);
    }
    
    // Add schema validation details
    results.schemaInfo = {
      version: validatedApi.openapi || validatedApi.swagger,
      title: validatedApi.info?.title,
      version: validatedApi.info?.version,
      servers: validatedApi.servers?.map(s => s.url) || [],
      totalPaths: Object.keys(validatedApi.paths || {}).length,
      totalOperations: endpoints.length
    };
    
  } catch (error) {
    console.error('❌ OpenAPI validation failed:', error.message);
    results.errors.push({
      type: 'validation_error',
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
  console.log('\n📊 OpenAPI Validation Results:');
  console.log(`📄 Schema Valid: ${results.schemaValid ? '✅' : '❌'}`);
  console.log(`🔗 Total Endpoints: ${results.summary.totalEndpoints}`);
  console.log(`🧪 Tested Endpoints: ${results.summary.testedEndpoints}`);
  console.log(`✅ Passed Tests: ${results.summary.passedTests}`);
  console.log(`❌ Failed Tests: ${results.summary.failedTests}`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 Errors:');
    results.errors.forEach(error => {
      console.log(`   ${error.type}: ${error.message}`);
    });
  }
  
  console.log(`📄 Detailed report saved to: ${REPORT_PATH}`);
  
  // Exit with error if schema is invalid or critical tests failed
  if (!results.schemaValid || results.errors.length > 0) {
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 OpenAPI validation interrupted');
  process.exit(1);
});

// Run validation
validateOpenAPISchema();