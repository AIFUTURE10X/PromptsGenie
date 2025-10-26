#!/usr/bin/env node

/**
 * Specification Validator
 * 
 * Validates generated specifications against project standards
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const REQUIRED_SECTIONS = [
  'User Story',
  'Acceptance Criteria', 
  'API Contract',
  'Data Model',
  'Non-functional Requirements',
  'Risk Assessment'
];

const VALIDATION_RULES = {
  userStory: {
    pattern: /As a .+ I want .+ so that .+/i,
    message: 'User story must follow "As a [user] I want [goal] so that [benefit]" format'
  },
  acceptanceCriteria: {
    pattern: /Given .+ When .+ Then .+/i,
    message: 'Acceptance criteria should include Given-When-Then scenarios'
  },
  apiContract: {
    keywords: ['endpoint', 'method', 'request', 'response', 'schema'],
    message: 'API contract must specify endpoints, methods, and schemas'
  },
  riskAssessment: {
    keywords: ['risk', 'mitigation', 'rollback', 'impact'],
    message: 'Risk assessment must include risks, mitigation, and rollback strategy'
  }
};

class SpecValidator {
  constructor(specPath) {
    this.specPath = specPath;
    this.content = readFileSync(specPath, 'utf8');
    this.errors = [];
    this.warnings = [];
  }

  validate() {
    console.log(`🔍 Validating specification: ${this.specPath}`);
    
    this.validateStructure();
    this.validateContent();
    this.validateQuality();
    
    return this.generateReport();
  }

  validateStructure() {
    console.log('  📋 Checking structure...');
    
    // Check for required sections
    for (const section of REQUIRED_SECTIONS) {
      const sectionRegex = new RegExp(`#{1,3}\\s*${section}`, 'i');
      if (!sectionRegex.test(this.content)) {
        this.errors.push(`Missing required section: ${section}`);
      }
    }
    
    // Check for proper markdown formatting
    const headingCount = (this.content.match(/^#{1,6}\s/gm) || []).length;
    if (headingCount < 3) {
      this.warnings.push('Specification should have more structured sections');
    }
  }

  validateContent() {
    console.log('  📝 Checking content quality...');
    
    // Validate user story format
    if (!VALIDATION_RULES.userStory.pattern.test(this.content)) {
      this.errors.push(VALIDATION_RULES.userStory.message);
    }
    
    // Check for acceptance criteria
    if (!VALIDATION_RULES.acceptanceCriteria.pattern.test(this.content)) {
      this.warnings.push(VALIDATION_RULES.acceptanceCriteria.message);
    }
    
    // Validate API contract details
    const hasApiKeywords = VALIDATION_RULES.apiContract.keywords.some(keyword => 
      this.content.toLowerCase().includes(keyword)
    );
    if (!hasApiKeywords) {
      this.errors.push(VALIDATION_RULES.apiContract.message);
    }
    
    // Check risk assessment
    const hasRiskKeywords = VALIDATION_RULES.riskAssessment.keywords.some(keyword => 
      this.content.toLowerCase().includes(keyword)
    );
    if (!hasRiskKeywords) {
      this.errors.push(VALIDATION_RULES.riskAssessment.message);
    }
  }

  validateQuality() {
    console.log('  ⭐ Checking quality metrics...');
    
    const wordCount = this.content.split(/\s+/).length;
    const lineCount = this.content.split('\n').length;
    
    // Quality checks
    if (wordCount < 200) {
      this.warnings.push('Specification may be too brief (< 200 words)');
    }
    
    if (wordCount > 2000) {
      this.warnings.push('Specification may be too verbose (> 2000 words)');
    }
    
    if (lineCount < 20) {
      this.warnings.push('Specification may lack detail (< 20 lines)');
    }
    
    // Check for code examples
    const codeBlocks = (this.content.match(/```/g) || []).length / 2;
    if (codeBlocks === 0) {
      this.warnings.push('Consider adding code examples for API contracts');
    }
    
    // Check for links/references
    const linkCount = (this.content.match(/\[.*\]\(.*\)/g) || []).length;
    if (linkCount === 0) {
      this.warnings.push('Consider adding references to related documentation');
    }
  }

  generateReport() {
    const report = {
      specPath: this.specPath,
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'valid' : 'invalid',
      errors: this.errors,
      warnings: this.warnings,
      metrics: {
        wordCount: this.content.split(/\s+/).length,
        lineCount: this.content.split('\n').length,
        sectionCount: (this.content.match(/^#{1,6}\s/gm) || []).length,
        codeBlocks: (this.content.match(/```/g) || []).length / 2
      }
    };
    
    // Output results
    if (this.errors.length === 0) {
      console.log('  ✅ Specification is valid');
    } else {
      console.log('  ❌ Specification has errors:');
      this.errors.forEach(error => console.log(`    - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('  ⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`    - ${warning}`));
    }
    
    return report;
  }
}

// CLI Interface
async function main() {
  const specPath = process.argv[2];
  
  if (!specPath) {
    console.error('❌ Specification file path required');
    console.log('Usage: node validate-spec.mjs <spec-file.md>');
    process.exit(1);
  }
  
  try {
    const validator = new SpecValidator(specPath);
    const report = validator.validate();
    
    // Output JSON report if requested
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(report, null, 2));
    }
    
    // Exit with error code if validation failed
    process.exit(report.status === 'valid' ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Validation failed:', error.message);
    process.exit(1);
  }
}

// Export for testing
export { SpecValidator, REQUIRED_SECTIONS, VALIDATION_RULES };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}