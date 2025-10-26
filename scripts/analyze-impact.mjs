#!/usr/bin/env node

/**
 * Impact Analyzer
 * 
 * Analyzes code changes impact on existing functionality
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

class ImpactAnalyzer {
  constructor(plan) {
    this.plan = typeof plan === 'string' ? JSON.parse(plan) : plan;
    this.analysis = {
      riskLevel: 'low',
      impactedFiles: [],
      dependencies: [],
      testCoverage: {},
      breakingChanges: [],
      recommendations: []
    };
  }

  async analyze() {
    console.log('🔍 Analyzing implementation impact...');
    
    await this.analyzeFileChanges();
    await this.analyzeDependencies();
    await this.analyzeTestCoverage();
    await this.analyzeBreakingChanges();
    await this.generateRecommendations();
    
    return this.analysis;
  }

  async analyzeFileChanges() {
    console.log('  📁 Analyzing file changes...');
    
    const filesToChange = this.extractFilesFromPlan();
    
    for (const file of filesToChange) {
      const impact = await this.analyzeFileImpact(file);
      this.analysis.impactedFiles.push(impact);
    }
    
    // Determine overall risk level
    const highRiskFiles = this.analysis.impactedFiles.filter(f => f.risk === 'high').length;
    const mediumRiskFiles = this.analysis.impactedFiles.filter(f => f.risk === 'medium').length;
    
    if (highRiskFiles > 0) {
      this.analysis.riskLevel = 'high';
    } else if (mediumRiskFiles > 2) {
      this.analysis.riskLevel = 'medium';
    }
  }

  async analyzeFileImpact(filePath) {
    const impact = {
      path: filePath,
      exists: existsSync(join(projectRoot, filePath)),
      risk: 'low',
      reasons: [],
      dependents: []
    };
    
    // Check if file exists and analyze its importance
    if (impact.exists) {
      const content = readFileSync(join(projectRoot, filePath), 'utf8');
      
      // High-risk indicators
      if (content.includes('export default') || content.includes('export {')) {
        impact.risk = 'medium';
        impact.reasons.push('File exports public API');
      }
      
      if (filePath.includes('config') || filePath.includes('types') || filePath.includes('constants')) {
        impact.risk = 'high';
        impact.reasons.push('Core configuration or type definitions');
      }
      
      if (content.includes('process.env') || content.includes('API_KEY')) {
        impact.risk = 'medium';
        impact.reasons.push('Contains environment configuration');
      }
      
      // Find dependents using grep
      try {
        const grepResult = execSync(`grep -r "from.*${filePath.replace('.tsx', '').replace('.ts', '')}" src/`, {
          cwd: projectRoot,
          encoding: 'utf8'
        });
        
        impact.dependents = grepResult.split('\n')
          .filter(line => line.trim())
          .map(line => line.split(':')[0])
          .filter((file, index, arr) => arr.indexOf(file) === index);
          
        if (impact.dependents.length > 5) {
          impact.risk = 'high';
          impact.reasons.push(`High coupling: ${impact.dependents.length} dependents`);
        }
      } catch (error) {
        // Grep failed, file might not have dependents
      }
    }
    
    return impact;
  }

  async analyzeDependencies() {
    console.log('  📦 Analyzing dependencies...');
    
    try {
      // Check package.json changes
      const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
      
      // Analyze if new dependencies are being added
      const planText = JSON.stringify(this.plan);
      const dependencyKeywords = ['npm install', 'yarn add', 'dependencies', 'devDependencies'];
      
      for (const keyword of dependencyKeywords) {
        if (planText.toLowerCase().includes(keyword)) {
          this.analysis.dependencies.push({
            type: 'new_dependency',
            risk: 'medium',
            reason: 'Plan includes new dependencies'
          });
          break;
        }
      }
      
      // Check for version updates
      if (planText.includes('update') && planText.includes('version')) {
        this.analysis.dependencies.push({
          type: 'version_update',
          risk: 'medium',
          reason: 'Plan includes version updates'
        });
      }
      
    } catch (error) {
      console.warn('  ⚠️  Could not analyze dependencies:', error.message);
    }
  }

  async analyzeTestCoverage() {
    console.log('  🧪 Analyzing test coverage...');
    
    try {
      // Run jest to get current coverage
      const coverageResult = execSync('npx jest --coverage --silent --passWithNoTests', {
        cwd: projectRoot,
        encoding: 'utf8'
      });
      
      // Parse coverage from output (simplified)
      const coverageMatch = coverageResult.match(/All files\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        this.analysis.testCoverage.current = parseFloat(coverageMatch[1]);
        
        if (this.analysis.testCoverage.current < 80) {
          this.analysis.recommendations.push('Increase test coverage before implementing changes');
        }
      }
      
    } catch (error) {
      console.warn('  ⚠️  Could not analyze test coverage:', error.message);
      this.analysis.testCoverage.current = 0;
    }
  }

  async analyzeBreakingChanges() {
    console.log('  💥 Analyzing breaking changes...');
    
    const planText = JSON.stringify(this.plan).toLowerCase();
    const breakingIndicators = [
      'remove',
      'delete',
      'breaking',
      'incompatible',
      'major version',
      'api change',
      'schema change'
    ];
    
    for (const indicator of breakingIndicators) {
      if (planText.includes(indicator)) {
        this.analysis.breakingChanges.push({
          type: indicator,
          severity: 'high',
          recommendation: 'Generate ADR and migration guide'
        });
      }
    }
    
    // Check for API contract changes
    if (planText.includes('openapi') || planText.includes('graphql') || planText.includes('api')) {
      this.analysis.breakingChanges.push({
        type: 'api_contract',
        severity: 'medium',
        recommendation: 'Validate API contract compatibility'
      });
    }
  }

  async generateRecommendations() {
    console.log('  💡 Generating recommendations...');
    
    // Risk-based recommendations
    if (this.analysis.riskLevel === 'high') {
      this.analysis.recommendations.push('Consider feature flags for gradual rollout');
      this.analysis.recommendations.push('Implement comprehensive monitoring');
      this.analysis.recommendations.push('Prepare detailed rollback plan');
    }
    
    // File-based recommendations
    const highRiskFiles = this.analysis.impactedFiles.filter(f => f.risk === 'high');
    if (highRiskFiles.length > 0) {
      this.analysis.recommendations.push('Add extra test coverage for high-risk files');
      this.analysis.recommendations.push('Consider pair programming for critical changes');
    }
    
    // Dependency recommendations
    if (this.analysis.dependencies.length > 0) {
      this.analysis.recommendations.push('Review security implications of new dependencies');
      this.analysis.recommendations.push('Update dependency documentation');
    }
    
    // Breaking change recommendations
    if (this.analysis.breakingChanges.length > 0) {
      this.analysis.recommendations.push('Generate Architecture Decision Record (ADR)');
      this.analysis.recommendations.push('Create migration guide for users');
      this.analysis.recommendations.push('Plan communication strategy for breaking changes');
    }
  }

  extractFilesFromPlan() {
    const files = [];
    const planText = JSON.stringify(this.plan);
    
    // Extract file paths from plan (simplified pattern matching)
    const filePatterns = [
      /src\/[^"'\s]+\.(ts|tsx|js|jsx)/g,
      /components\/[^"'\s]+\.(ts|tsx)/g,
      /pages\/[^"'\s]+\.(ts|tsx)/g,
      /hooks\/[^"'\s]+\.(ts|tsx)/g,
      /utils\/[^"'\s]+\.(ts|tsx)/g
    ];
    
    for (const pattern of filePatterns) {
      const matches = planText.match(pattern) || [];
      files.push(...matches);
    }
    
    // Remove duplicates
    return [...new Set(files)];
  }
}

// CLI Interface
async function main() {
  let plan;
  
  // Read plan from stdin or file
  if (process.argv[2]) {
    plan = readFileSync(process.argv[2], 'utf8');
  } else {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    plan = Buffer.concat(chunks).toString();
  }
  
  if (!plan.trim()) {
    console.error('❌ Plan data required');
    console.log('Usage: node analyze-impact.mjs [plan-file.json]');
    console.log('   or: echo "plan-json" | node analyze-impact.mjs');
    process.exit(1);
  }
  
  try {
    const analyzer = new ImpactAnalyzer(plan);
    const analysis = await analyzer.analyze();
    
    // Output results
    console.log('\n📊 Impact Analysis Results:');
    console.log(`  Risk Level: ${analysis.riskLevel.toUpperCase()}`);
    console.log(`  Files Impacted: ${analysis.impactedFiles.length}`);
    console.log(`  Breaking Changes: ${analysis.breakingChanges.length}`);
    console.log(`  Recommendations: ${analysis.recommendations.length}`);
    
    // Output JSON if requested
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(analysis, null, 2));
    } else {
      // Human-readable output
      if (analysis.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        analysis.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
    }
    
    // Save analysis report
    const reportPath = join(projectRoot, '.reports', 'impact-analysis.json');
    writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Impact analysis failed:', error.message);
    process.exit(1);
  }
}

// Export for testing
export { ImpactAnalyzer };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}