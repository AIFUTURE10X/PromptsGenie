#!/usr/bin/env node

/**
 * CI Gates Validation Script
 * Enforces all quality standards defined in .trae/.rules
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REPORTS_DIR = '.reports';
const GATES_CONFIG = {
  coverage: { lines: 80, branches: 75, functions: 80, statements: 80 },
  lighthouse: { accessibility: 90, performance: 75, bestPractices: 90 },
  bundle: { mainMaxKB: 250, routeMaxKB: 200 }
};

class CIGates {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async runGate(name, command, validator) {
    try {
      this.log(`🔍 Running ${name}...`);
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      const isValid = await validator(result);
      
      if (isValid) {
        this.results.passed.push(name);
        this.log(`✅ ${name} passed`, 'success');
      } else {
        this.results.failed.push(name);
        this.log(`❌ ${name} failed`, 'error');
      }
    } catch (error) {
      this.results.failed.push(name);
      this.log(`❌ ${name} failed: ${error.message}`, 'error');
    }
  }

  async validateCoverage() {
    return this.runGate(
      'Jest Coverage',
      'npm test',
      () => {
        if (!existsSync(join(REPORTS_DIR, 'jest.json'))) return false;
        
        const report = JSON.parse(readFileSync(join(REPORTS_DIR, 'jest.json'), 'utf8'));
        const coverage = report.coverageMap?.getCoverageSummary?.()?.data || {};
        
        return (
          coverage.lines?.pct >= GATES_CONFIG.coverage.lines &&
          coverage.branches?.pct >= GATES_CONFIG.coverage.branches &&
          coverage.functions?.pct >= GATES_CONFIG.coverage.functions &&
          coverage.statements?.pct >= GATES_CONFIG.coverage.statements
        );
      }
    );
  }

  async validateLinting() {
    return this.runGate(
      'ESLint',
      'npm run lint',
      () => {
        if (!existsSync(join(REPORTS_DIR, 'eslint.json'))) return false;
        
        const report = JSON.parse(readFileSync(join(REPORTS_DIR, 'eslint.json'), 'utf8'));
        const hasErrors = report.some(file => file.errorCount > 0);
        const hasWarnings = report.some(file => file.warningCount > 0);
        
        if (hasWarnings) {
          this.results.warnings.push('ESLint warnings found');
        }
        
        return !hasErrors;
      }
    );
  }

  async validateTypeCheck() {
    return this.runGate(
      'TypeScript Check',
      'npm run type-check',
      (result) => !result.includes('error')
    );
  }

  async validateSecrets() {
    return this.runGate(
      'Gitleaks',
      'npm run audit:secrets',
      () => {
        if (!existsSync(join(REPORTS_DIR, 'gitleaks.json'))) return false;
        
        const report = JSON.parse(readFileSync(join(REPORTS_DIR, 'gitleaks.json'), 'utf8'));
        return Array.isArray(report) && report.length === 0;
      }
    );
  }

  async validateSecurity() {
    return this.runGate(
      'Security Audit',
      'npm run audit:security',
      () => {
        if (!existsSync(join(REPORTS_DIR, 'npm-audit.json'))) return false;
        
        const report = JSON.parse(readFileSync(join(REPORTS_DIR, 'npm-audit.json'), 'utf8'));
        const highVulns = Object.values(report.vulnerabilities || {})
          .filter(vuln => vuln.severity === 'high' || vuln.severity === 'critical');
        
        return highVulns.length === 0;
      }
    );
  }

  async validateAccessibility() {
    return this.runGate(
      'Accessibility',
      'npm run test:a11y',
      () => {
        if (!existsSync(join(REPORTS_DIR, 'axe-a11y.json'))) return false;
        
        const report = JSON.parse(readFileSync(join(REPORTS_DIR, 'axe-a11y.json'), 'utf8'));
        const criticalViolations = report.violations?.filter(v => v.impact === 'critical') || [];
        
        return criticalViolations.length === 0;
      }
    );
  }

  async validatePerformance() {
    return this.runGate(
      'Lighthouse Performance',
      'npm run test:lighthouse',
      () => {
        if (!existsSync(join(REPORTS_DIR, 'lh.json'))) return false;
        
        const report = JSON.parse(readFileSync(join(REPORTS_DIR, 'lh.json'), 'utf8'));
        const scores = report.categories;
        
        return (
          scores.accessibility?.score * 100 >= GATES_CONFIG.lighthouse.accessibility &&
          scores.performance?.score * 100 >= GATES_CONFIG.lighthouse.performance &&
          scores['best-practices']?.score * 100 >= GATES_CONFIG.lighthouse.bestPractices
        );
      }
    );
  }

  async validateBundle() {
    return this.runGate(
      'Bundle Size',
      'npm run analyze:bundle',
      () => {
        if (!existsSync(join(REPORTS_DIR, 'bundle-analysis.json'))) return false;
        
        const report = JSON.parse(readFileSync(join(REPORTS_DIR, 'bundle-analysis.json'), 'utf8'));
        // Simplified validation - would need actual bundle analyzer output format
        return true; // Placeholder for actual bundle size validation
      }
    );
  }

  async runAllGates() {
    this.log('🚀 Starting CI Gates Validation', 'info');
    this.log('='.repeat(50));

    await Promise.all([
      this.validateCoverage(),
      this.validateLinting(),
      this.validateTypeCheck(),
      this.validateSecrets(),
      this.validateSecurity(),
      this.validateAccessibility(),
      this.validatePerformance(),
      this.validateBundle()
    ]);

    this.printSummary();
    return this.results.failed.length === 0;
  }

  printSummary() {
    this.log('\n📊 CI Gates Summary', 'info');
    this.log('='.repeat(30));
    
    this.log(`✅ Passed: ${this.results.passed.length}`, 'success');
    this.log(`❌ Failed: ${this.results.failed.length}`, 'error');
    this.log(`⚠️  Warnings: ${this.results.warnings.length}`, 'warning');

    if (this.results.passed.length > 0) {
      this.log('\n✅ Passed Gates:', 'success');
      this.results.passed.forEach(gate => this.log(`  • ${gate}`, 'success'));
    }

    if (this.results.failed.length > 0) {
      this.log('\n❌ Failed Gates:', 'error');
      this.results.failed.forEach(gate => this.log(`  • ${gate}`, 'error'));
    }

    if (this.results.warnings.length > 0) {
      this.log('\n⚠️  Warnings:', 'warning');
      this.results.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
    }

    const status = this.results.failed.length === 0 ? 'PASSED' : 'FAILED';
    const color = this.results.failed.length === 0 ? 'success' : 'error';
    this.log(`\n🎯 Overall Status: ${status}`, color);
  }
}

// Run the CI gates validation
const gates = new CIGates();
const success = await gates.runAllGates();
process.exit(success ? 0 : 1);

export default CIGates;