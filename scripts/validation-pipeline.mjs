#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive Validation Pipeline
 * Integrates all quality gates and ensures code meets project standards
 */
class ValidationPipeline {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.reportsDir = path.join(__dirname, '..', '.reports');
    this.configPath = path.join(__dirname, '..', 'package.json');
    
    // Quality gates configuration
    this.qualityGates = {
      required: [
        {
          name: 'TypeScript Compilation',
          command: 'npm run type-check',
          description: 'TypeScript must compile without errors',
          timeout: 60000,
          critical: true
        },
        {
          name: 'ESLint',
          command: 'npm run lint',
          description: 'Code must pass linting rules',
          timeout: 30000,
          critical: true
        },
        {
          name: 'Unit Tests',
          command: 'npm run test:unit',
          description: 'All unit tests must pass',
          timeout: 120000,
          critical: true
        },
        {
          name: 'Integration Tests',
          command: 'npm run test:integration',
          description: 'All integration tests must pass',
          timeout: 180000,
          critical: true
        }
      ],
      optional: [
        {
          name: 'Code Coverage',
          command: 'npm run test:coverage',
          description: 'Code coverage should meet threshold',
          timeout: 120000,
          threshold: 80,
          critical: false
        },
        {
          name: 'Performance Tests',
          command: 'npm run test:performance',
          description: 'Performance benchmarks should be met',
          timeout: 180000,
          critical: false
        },
        {
          name: 'Accessibility Tests',
          command: 'npm run test:a11y',
          description: 'Accessibility standards should be met',
          timeout: 120000,
          critical: false
        },
        {
          name: 'Bundle Analysis',
          command: 'npm run analyze:bundle',
          description: 'Bundle size should be within limits',
          timeout: 60000,
          critical: false
        }
      ],
      security: [
        {
          name: 'NPM Audit',
          command: 'npm audit --audit-level=high',
          description: 'No high or critical security vulnerabilities',
          timeout: 60000,
          critical: true
        },
        {
          name: 'Secret Scanning',
          command: 'npm run security:scan',
          description: 'No secrets or sensitive data in code',
          timeout: 30000,
          critical: true
        },
        {
          name: 'Dependency Check',
          command: 'npm run security:deps',
          description: 'Dependencies should be secure and up-to-date',
          timeout: 60000,
          critical: false
        }
      ],
      visual: [
        {
          name: 'Storybook Build',
          command: 'npm run storybook:build',
          description: 'Storybook should build successfully',
          timeout: 120000,
          critical: false
        },
        {
          name: 'Visual Regression Tests',
          command: 'npm run visual:test',
          description: 'Visual components should match baselines',
          timeout: 300000,
          critical: false
        },
        {
          name: 'Chromatic Tests',
          command: 'npm run chromatic',
          description: 'Chromatic visual tests should pass',
          timeout: 300000,
          critical: false
        }
      ]
    };
  }

  /**
   * Run complete validation pipeline
   */
  async runValidation(options = {}) {
    const {
      skipOptional = false,
      skipSecurity = false,
      skipVisual = false,
      failFast = false,
      parallel = true,
      generateReport = true
    } = options;

    console.log('🔍 Starting comprehensive validation pipeline...');

    // Ensure reports directory exists
    await fs.mkdir(this.reportsDir, { recursive: true });

    const startTime = Date.now();
    const results = {
      summary: {
        total_gates: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        warnings: 0,
        duration: 0,
        success: false
      },
      gates: {
        required: [],
        optional: [],
        security: [],
        visual: []
      },
      recommendations: [],
      next_steps: []
    };

    try {
      // Run required gates (always run these)
      console.log('🚨 Running required quality gates...');
      results.gates.required = await this.runGateCategory(
        this.qualityGates.required, 
        { failFast, parallel }
      );

      // Check if required gates passed
      const requiredFailed = results.gates.required.filter(g => !g.passed && g.critical);
      if (requiredFailed.length > 0 && failFast) {
        console.log('❌ Required gates failed, stopping validation');
        results.summary.success = false;
        return this.finalizeResults(results, startTime, generateReport);
      }

      // Run optional gates
      if (!skipOptional) {
        console.log('⚡ Running optional quality gates...');
        results.gates.optional = await this.runGateCategory(
          this.qualityGates.optional, 
          { failFast: false, parallel }
        );
      }

      // Run security gates
      if (!skipSecurity) {
        console.log('🔒 Running security gates...');
        results.gates.security = await this.runGateCategory(
          this.qualityGates.security, 
          { failFast, parallel }
        );
      }

      // Run visual gates
      if (!skipVisual) {
        console.log('👁️ Running visual quality gates...');
        results.gates.visual = await this.runGateCategory(
          this.qualityGates.visual, 
          { failFast: false, parallel }
        );
      }

      // Calculate final results
      const allGates = [
        ...results.gates.required,
        ...results.gates.optional,
        ...results.gates.security,
        ...results.gates.visual
      ];

      results.summary.total_gates = allGates.length;
      results.summary.passed = allGates.filter(g => g.passed).length;
      results.summary.failed = allGates.filter(g => !g.passed && !g.skipped).length;
      results.summary.skipped = allGates.filter(g => g.skipped).length;
      results.summary.warnings = allGates.filter(g => g.warnings > 0).length;

      // Determine overall success
      const criticalFailures = allGates.filter(g => !g.passed && g.critical && !g.skipped);
      results.summary.success = criticalFailures.length === 0;

      // Generate recommendations
      results.recommendations = this.generateRecommendations(allGates);
      results.next_steps = this.generateNextSteps(allGates, results.summary.success);

      console.log(results.summary.success ? '✅ Validation pipeline completed successfully' : '❌ Validation pipeline failed');

    } catch (error) {
      console.error('💥 Validation pipeline error:', error.message);
      results.summary.success = false;
      results.error = error.message;
    }

    return this.finalizeResults(results, startTime, generateReport);
  }

  /**
   * Run a category of quality gates
   */
  async runGateCategory(gates, options = {}) {
    const { failFast = false, parallel = true } = options;
    const results = [];

    if (parallel && gates.length > 1) {
      // Run gates in parallel
      const promises = gates.map(gate => this.runSingleGate(gate));
      const gateResults = await Promise.allSettled(promises);
      
      gateResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            ...gates[index],
            passed: false,
            error: result.reason.message,
            duration: 0,
            output: '',
            skipped: false
          });
        }
      });
    } else {
      // Run gates sequentially
      for (const gate of gates) {
        const result = await this.runSingleGate(gate);
        results.push(result);
        
        if (failFast && !result.passed && result.critical) {
          console.log(`🛑 Failing fast due to critical gate failure: ${gate.name}`);
          break;
        }
      }
    }

    return results;
  }

  /**
   * Run a single quality gate
   */
  async runSingleGate(gate) {
    console.log(`🔄 Running: ${gate.name}`);
    
    const startTime = Date.now();
    const result = {
      ...gate,
      passed: false,
      duration: 0,
      output: '',
      error: null,
      warnings: 0,
      skipped: false,
      metrics: {}
    };

    try {
      // Check if command exists in package.json
      const packageJson = JSON.parse(await fs.readFile(this.configPath, 'utf-8'));
      const scriptName = gate.command.replace('npm run ', '');
      
      if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
        console.log(`⏭️ Skipping ${gate.name}: script not found`);
        result.skipped = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Run the command
      const { stdout, stderr, exitCode } = await this.executeCommand(gate.command, gate.timeout);
      
      result.duration = Date.now() - startTime;
      result.output = stdout + stderr;
      result.passed = exitCode === 0;

      // Parse specific metrics based on gate type
      result.metrics = this.parseGateMetrics(gate, result.output);

      // Check thresholds for optional gates
      if (gate.threshold && result.metrics.value !== undefined) {
        result.passed = result.metrics.value >= gate.threshold;
        if (!result.passed && !gate.critical) {
          result.warnings++;
        }
      }

      // Count warnings in output
      result.warnings += this.countWarnings(result.output);

      if (result.passed) {
        console.log(`✅ ${gate.name} passed (${result.duration}ms)`);
      } else {
        console.log(`❌ ${gate.name} failed (${result.duration}ms)`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error.message;
      result.passed = false;
      console.log(`💥 ${gate.name} error: ${error.message}`);
    }

    return result;
  }

  /**
   * Execute a command with timeout
   */
  executeCommand(command, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        cwd: this.projectRoot,
        shell: true,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve({
          stdout,
          stderr,
          exitCode: code
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Parse metrics from gate output
   */
  parseGateMetrics(gate, output) {
    const metrics = {};

    try {
      switch (gate.name) {
        case 'Code Coverage':
          const coverageMatch = output.match(/All files[^|]*\|\s*(\d+\.?\d*)/);
          if (coverageMatch) {
            metrics.value = parseFloat(coverageMatch[1]);
            metrics.unit = '%';
            metrics.threshold = gate.threshold;
          }
          break;

        case 'Bundle Analysis':
          const sizeMatch = output.match(/(\d+\.?\d*)\s*(KB|MB)/i);
          if (sizeMatch) {
            metrics.value = parseFloat(sizeMatch[1]);
            metrics.unit = sizeMatch[2];
          }
          break;

        case 'Performance Tests':
          const perfMatch = output.match(/(\d+)ms/);
          if (perfMatch) {
            metrics.value = parseInt(perfMatch[1]);
            metrics.unit = 'ms';
          }
          break;

        case 'NPM Audit':
          const vulnMatch = output.match(/(\d+)\s+vulnerabilities/);
          if (vulnMatch) {
            metrics.vulnerabilities = parseInt(vulnMatch[1]);
          }
          break;

        case 'ESLint':
          const errorMatch = output.match(/(\d+)\s+error/);
          const warningMatch = output.match(/(\d+)\s+warning/);
          if (errorMatch) metrics.errors = parseInt(errorMatch[1]);
          if (warningMatch) metrics.warnings = parseInt(warningMatch[1]);
          break;

        case 'TypeScript Compilation':
          const tsErrorMatch = output.match(/Found (\d+) error/);
          if (tsErrorMatch) {
            metrics.errors = parseInt(tsErrorMatch[1]);
          }
          break;
      }
    } catch (error) {
      console.warn(`⚠️ Could not parse metrics for ${gate.name}:`, error.message);
    }

    return metrics;
  }

  /**
   * Count warnings in output
   */
  countWarnings(output) {
    const warningPatterns = [
      /warning/gi,
      /warn/gi,
      /deprecated/gi,
      /⚠️/g
    ];

    let count = 0;
    for (const pattern of warningPatterns) {
      const matches = output.match(pattern);
      if (matches) count += matches.length;
    }

    return count;
  }

  /**
   * Generate recommendations based on gate results
   */
  generateRecommendations(gates) {
    const recommendations = [];

    // Failed critical gates
    const criticalFailures = gates.filter(g => !g.passed && g.critical && !g.skipped);
    if (criticalFailures.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Fix Critical Issues',
        description: 'The following critical quality gates failed and must be fixed before proceeding',
        items: criticalFailures.map(g => `${g.name}: ${g.error || 'Failed validation'}`),
        priority: 'high'
      });
    }

    // High warning count
    const highWarningGates = gates.filter(g => g.warnings > 5);
    if (highWarningGates.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Address Warnings',
        description: 'Several gates have high warning counts that should be addressed',
        items: highWarningGates.map(g => `${g.name}: ${g.warnings} warnings`),
        priority: 'medium'
      });
    }

    // Coverage below threshold
    const coverageGate = gates.find(g => g.name === 'Code Coverage');
    if (coverageGate && coverageGate.metrics.value < coverageGate.threshold) {
      recommendations.push({
        type: 'coverage',
        title: 'Improve Test Coverage',
        description: `Code coverage is ${coverageGate.metrics.value}%, below the ${coverageGate.threshold}% threshold`,
        items: ['Add unit tests for uncovered code', 'Add integration tests for critical paths'],
        priority: 'medium'
      });
    }

    // Security vulnerabilities
    const securityGate = gates.find(g => g.name === 'NPM Audit');
    if (securityGate && securityGate.metrics.vulnerabilities > 0) {
      recommendations.push({
        type: 'security',
        title: 'Fix Security Vulnerabilities',
        description: `Found ${securityGate.metrics.vulnerabilities} security vulnerabilities`,
        items: ['Run npm audit fix', 'Update vulnerable dependencies', 'Review security advisories'],
        priority: 'high'
      });
    }

    // Performance issues
    const perfGate = gates.find(g => g.name === 'Performance Tests');
    if (perfGate && !perfGate.passed) {
      recommendations.push({
        type: 'performance',
        title: 'Optimize Performance',
        description: 'Performance tests indicate potential issues',
        items: ['Profile slow operations', 'Optimize database queries', 'Review bundle size'],
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Generate next steps based on validation results
   */
  generateNextSteps(gates, success) {
    const steps = [];

    if (success) {
      steps.push('✅ All critical quality gates passed');
      steps.push('🚀 Ready to create pull request');
      steps.push('📝 Generate PR description with validation results');
      steps.push('🔄 Set up CI/CD pipeline to run these gates automatically');
    } else {
      steps.push('❌ Fix failing critical quality gates');
      steps.push('🔍 Review detailed error messages and logs');
      steps.push('🛠️ Make necessary code changes');
      steps.push('🔄 Re-run validation pipeline');
      steps.push('📚 Update documentation if needed');
    }

    // Add specific steps based on gate results
    const failedGates = gates.filter(g => !g.passed && !g.skipped);
    if (failedGates.some(g => g.name === 'TypeScript Compilation')) {
      steps.push('🔧 Fix TypeScript compilation errors');
    }
    if (failedGates.some(g => g.name === 'ESLint')) {
      steps.push('🧹 Fix linting errors and warnings');
    }
    if (failedGates.some(g => g.name.includes('Tests'))) {
      steps.push('🧪 Fix failing tests and add missing test coverage');
    }

    return steps;
  }

  /**
   * Finalize results and generate report
   */
  async finalizeResults(results, startTime, generateReport) {
    results.summary.duration = Date.now() - startTime;

    if (generateReport) {
      await this.generateValidationReport(results);
    }

    return results;
  }

  /**
   * Generate comprehensive validation report
   */
  async generateValidationReport(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.reportsDir, `validation-report-${timestamp}.json`);
    const htmlReportPath = path.join(this.reportsDir, `validation-report-${timestamp}.html`);

    try {
      // Save JSON report
      await fs.writeFile(reportPath, JSON.stringify(results, null, 2));

      // Generate HTML report
      const htmlContent = this.generateHTMLReport(results);
      await fs.writeFile(htmlReportPath, htmlContent);

      // Generate summary report
      const summaryPath = path.join(this.reportsDir, 'validation-summary.json');
      const summary = {
        timestamp: new Date().toISOString(),
        success: results.summary.success,
        duration: results.summary.duration,
        gates: {
          total: results.summary.total_gates,
          passed: results.summary.passed,
          failed: results.summary.failed,
          skipped: results.summary.skipped
        },
        recommendations_count: results.recommendations.length,
        report_files: {
          json: reportPath,
          html: htmlReportPath
        }
      };
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

      console.log(`📊 Validation report generated: ${reportPath}`);
      console.log(`🌐 HTML report generated: ${htmlReportPath}`);

    } catch (error) {
      console.error('❌ Error generating validation report:', error.message);
    }
  }

  /**
   * Generate HTML validation report
   */
  generateHTMLReport(results) {
    const { summary, gates, recommendations, next_steps } = results;
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Pipeline Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: ${summary.success ? '#10b981' : '#ef4444'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #1f2937; }
        .metric-label { color: #6b7280; font-size: 0.9em; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .gate { background: #f8fafc; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #d1d5db; }
        .gate.passed { border-left-color: #10b981; }
        .gate.failed { border-left-color: #ef4444; }
        .gate.skipped { border-left-color: #f59e0b; }
        .gate-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
        .gate-name { font-weight: bold; }
        .gate-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-passed { background: #d1fae5; color: #065f46; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        .status-skipped { background: #fef3c7; color: #92400e; }
        .recommendation { background: #fef7ff; border: 1px solid #e879f9; border-radius: 6px; padding: 15px; margin: 10px 0; }
        .recommendation.critical { background: #fef2f2; border-color: #fca5a5; }
        .recommendation.warning { background: #fffbeb; border-color: #fcd34d; }
        .next-steps { background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 6px; padding: 15px; }
        .next-steps ul { margin: 0; padding-left: 20px; }
        .metrics { font-size: 0.9em; color: #6b7280; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Validation Pipeline Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Status: ${summary.success ? '✅ PASSED' : '❌ FAILED'}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="metric">
                    <div class="metric-value">${summary.total_gates}</div>
                    <div class="metric-label">Total Gates</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: #10b981">${summary.passed}</div>
                    <div class="metric-label">Passed</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: #ef4444">${summary.failed}</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: #f59e0b">${summary.skipped}</div>
                    <div class="metric-label">Skipped</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Math.round(summary.duration / 1000)}s</div>
                    <div class="metric-label">Duration</div>
                </div>
            </div>
    `;

    // Add gate sections
    const gateCategories = [
      { name: 'Required Gates', gates: gates.required, icon: '🚨' },
      { name: 'Optional Gates', gates: gates.optional, icon: '⚡' },
      { name: 'Security Gates', gates: gates.security, icon: '🔒' },
      { name: 'Visual Gates', gates: gates.visual, icon: '👁️' }
    ];

    for (const category of gateCategories) {
      if (category.gates.length > 0) {
        html += `
            <div class="section">
                <h2>${category.icon} ${category.name}</h2>
        `;

        for (const gate of category.gates) {
          const status = gate.skipped ? 'skipped' : (gate.passed ? 'passed' : 'failed');
          const statusClass = gate.skipped ? 'status-skipped' : (gate.passed ? 'status-passed' : 'status-failed');
          
          html += `
                <div class="gate ${status}">
                    <div class="gate-header">
                        <span class="gate-name">${gate.name}</span>
                        <span class="gate-status ${statusClass}">${status.toUpperCase()}</span>
                    </div>
                    <div>${gate.description}</div>
                    <div class="metrics">
                        Duration: ${gate.duration}ms
                        ${gate.warnings > 0 ? `| Warnings: ${gate.warnings}` : ''}
                        ${gate.metrics.value !== undefined ? `| Value: ${gate.metrics.value}${gate.metrics.unit || ''}` : ''}
                        ${gate.error ? `| Error: ${gate.error}` : ''}
                    </div>
                </div>
          `;
        }

        html += '</div>';
      }
    }

    // Add recommendations
    if (recommendations.length > 0) {
      html += `
            <div class="section">
                <h2>💡 Recommendations</h2>
      `;

      for (const rec of recommendations) {
        html += `
                <div class="recommendation ${rec.type}">
                    <h3>${rec.title}</h3>
                    <p>${rec.description}</p>
                    <ul>
        `;
        for (const item of rec.items) {
          html += `<li>${item}</li>`;
        }
        html += `
                    </ul>
                </div>
        `;
      }

      html += '</div>';
    }

    // Add next steps
    if (next_steps.length > 0) {
      html += `
            <div class="section">
                <h2>📋 Next Steps</h2>
                <div class="next-steps">
                    <ul>
      `;
      for (const step of next_steps) {
        html += `<li>${step}</li>`;
      }
      html += `
                    </ul>
                </div>
            </div>
      `;
    }

    html += `
        </div>
    </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Get validation summary for external use
   */
  async getValidationSummary() {
    try {
      const summaryPath = path.join(this.reportsDir, 'validation-summary.json');
      const content = await fs.readFile(summaryPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if validation is required for given files
   */
  async isValidationRequired(changedFiles = []) {
    // Always require validation for certain file types
    const criticalPatterns = [
      /\.tsx?$/,
      /\.jsx?$/,
      /package\.json$/,
      /tsconfig\.json$/,
      /\.env/
    ];

    return changedFiles.some(file => 
      criticalPatterns.some(pattern => pattern.test(file))
    );
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    skipOptional: false,
    skipSecurity: false,
    skipVisual: false,
    failFast: false,
    parallel: true,
    generateReport: true
  };

  // Parse options
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    
    switch (flag) {
      case '--skip-optional':
        options.skipOptional = true;
        break;
      case '--skip-security':
        options.skipSecurity = true;
        break;
      case '--skip-visual':
        options.skipVisual = true;
        break;
      case '--fail-fast':
        options.failFast = true;
        break;
      case '--no-parallel':
        options.parallel = false;
        break;
      case '--no-report':
        options.generateReport = false;
        break;
      case '--help':
        console.log('Usage: node validation-pipeline.mjs [options]');
        console.log('Options:');
        console.log('  --skip-optional    Skip optional quality gates');
        console.log('  --skip-security    Skip security gates');
        console.log('  --skip-visual      Skip visual gates');
        console.log('  --fail-fast        Stop on first critical failure');
        console.log('  --no-parallel      Run gates sequentially');
        console.log('  --no-report        Skip report generation');
        process.exit(0);
    }
  }

  try {
    const pipeline = new ValidationPipeline();
    const results = await pipeline.runValidation(options);
    
    console.log('\n📊 Validation Summary:');
    console.log(`- Success: ${results.summary.success ? '✅' : '❌'}`);
    console.log(`- Total Gates: ${results.summary.total_gates}`);
    console.log(`- Passed: ${results.summary.passed}`);
    console.log(`- Failed: ${results.summary.failed}`);
    console.log(`- Skipped: ${results.summary.skipped}`);
    console.log(`- Duration: ${Math.round(results.summary.duration / 1000)}s`);
    
    if (results.recommendations.length > 0) {
      console.log(`- Recommendations: ${results.recommendations.length}`);
    }

    // Exit with appropriate code
    process.exit(results.summary.success ? 0 : 1);

  } catch (error) {
    console.error('❌ Validation pipeline error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ValidationPipeline };