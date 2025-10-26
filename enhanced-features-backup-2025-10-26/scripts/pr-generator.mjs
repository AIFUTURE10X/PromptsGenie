#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PR Generation System
 * Automatically creates pull request descriptions with validation results,
 * impact analysis, and comprehensive documentation
 */
class PRGenerator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.reportsDir = path.join(__dirname, '..', '.reports');
    this.templatesDir = path.join(__dirname, '..', 'templates');
    
    // PR templates for different types of changes
    this.prTemplates = {
      feature: {
        title: 'feat: {title}',
        sections: [
          'summary',
          'changes',
          'testing',
          'validation',
          'impact',
          'breaking_changes',
          'checklist'
        ]
      },
      bugfix: {
        title: 'fix: {title}',
        sections: [
          'summary',
          'problem',
          'solution',
          'testing',
          'validation',
          'impact',
          'checklist'
        ]
      },
      refactor: {
        title: 'refactor: {title}',
        sections: [
          'summary',
          'changes',
          'motivation',
          'testing',
          'validation',
          'impact',
          'checklist'
        ]
      },
      docs: {
        title: 'docs: {title}',
        sections: [
          'summary',
          'changes',
          'validation',
          'checklist'
        ]
      },
      chore: {
        title: 'chore: {title}',
        sections: [
          'summary',
          'changes',
          'validation',
          'checklist'
        ]
      }
    };

    // Standard checklist items
    this.standardChecklist = [
      '- [ ] Code follows project style guidelines',
      '- [ ] Self-review of code completed',
      '- [ ] Code is commented, particularly in hard-to-understand areas',
      '- [ ] Corresponding changes to documentation made',
      '- [ ] No new warnings introduced',
      '- [ ] Tests added that prove fix is effective or feature works',
      '- [ ] New and existing unit tests pass locally',
      '- [ ] Any dependent changes have been merged and published'
    ];
  }

  /**
   * Generate complete PR description
   */
  async generatePR(options = {}) {
    const {
      type = 'feature',
      title,
      description,
      specPath,
      planPath,
      validationResults,
      changedFiles = [],
      breakingChanges = [],
      author = 'AI Assistant',
      reviewers = [],
      labels = [],
      milestone,
      linkedIssues = []
    } = options;

    console.log('📝 Generating PR description...');

    try {
      // Load spec and plan if provided
      const spec = specPath ? await this.loadSpec(specPath) : null;
      const plan = planPath ? await this.loadPlan(planPath) : null;
      
      // Get validation results if not provided
      const validation = validationResults || await this.getLatestValidationResults();
      
      // Analyze changed files
      const fileAnalysis = await this.analyzeChangedFiles(changedFiles);
      
      // Generate impact analysis
      const impact = await this.generateImpactAnalysis(changedFiles, spec, plan);
      
      // Build PR data
      const prData = {
        type,
        title: title || this.extractTitleFromSpec(spec),
        description: description || this.extractDescriptionFromSpec(spec),
        spec,
        plan,
        validation,
        fileAnalysis,
        impact,
        breakingChanges,
        author,
        reviewers,
        labels: this.generateLabels(type, validation, impact, labels),
        milestone,
        linkedIssues,
        metadata: {
          generated_at: new Date().toISOString(),
          generator_version: '1.0.0',
          files_changed: changedFiles.length,
          validation_success: validation?.summary?.success || false
        }
      };

      // Generate PR description
      const prDescription = await this.buildPRDescription(prData);
      
      // Generate PR metadata
      const prMetadata = this.buildPRMetadata(prData);
      
      // Save PR files
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const prDir = path.join(this.reportsDir, 'prs');
      await fs.mkdir(prDir, { recursive: true });
      
      const prPath = path.join(prDir, `pr-${timestamp}.md`);
      const metadataPath = path.join(prDir, `pr-metadata-${timestamp}.json`);
      
      await fs.writeFile(prPath, prDescription);
      await fs.writeFile(metadataPath, JSON.stringify(prMetadata, null, 2));
      
      console.log('✅ PR description generated successfully');
      console.log(`📄 Description: ${prPath}`);
      console.log(`📊 Metadata: ${metadataPath}`);
      
      return {
        description: prDescription,
        metadata: prMetadata,
        files: {
          description: prPath,
          metadata: metadataPath
        }
      };

    } catch (error) {
      console.error('❌ Error generating PR:', error.message);
      throw error;
    }
  }

  /**
   * Load specification file
   */
  async loadSpec(specPath) {
    try {
      const content = await fs.readFile(specPath, 'utf-8');
      return specPath.endsWith('.json') ? JSON.parse(content) : { content };
    } catch (error) {
      console.warn(`⚠️ Could not load spec from ${specPath}:`, error.message);
      return null;
    }
  }

  /**
   * Load plan file
   */
  async loadPlan(planPath) {
    try {
      const content = await fs.readFile(planPath, 'utf-8');
      return planPath.endsWith('.json') ? JSON.parse(content) : { content };
    } catch (error) {
      console.warn(`⚠️ Could not load plan from ${planPath}:`, error.message);
      return null;
    }
  }

  /**
   * Get latest validation results
   */
  async getLatestValidationResults() {
    try {
      const summaryPath = path.join(this.reportsDir, 'validation-summary.json');
      const content = await fs.readFile(summaryPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️ No validation results found');
      return null;
    }
  }

  /**
   * Analyze changed files
   */
  async analyzeChangedFiles(changedFiles) {
    const analysis = {
      total: changedFiles.length,
      by_type: {},
      by_directory: {},
      complexity: 'low',
      risk_level: 'low'
    };

    for (const file of changedFiles) {
      // Analyze by file type
      const ext = path.extname(file);
      analysis.by_type[ext] = (analysis.by_type[ext] || 0) + 1;
      
      // Analyze by directory
      const dir = path.dirname(file);
      analysis.by_directory[dir] = (analysis.by_directory[dir] || 0) + 1;
    }

    // Determine complexity and risk
    if (changedFiles.length > 20) {
      analysis.complexity = 'high';
      analysis.risk_level = 'high';
    } else if (changedFiles.length > 10) {
      analysis.complexity = 'medium';
      analysis.risk_level = 'medium';
    }

    // Check for high-risk files
    const highRiskPatterns = [
      /package\.json$/,
      /tsconfig\.json$/,
      /\.env/,
      /database/,
      /migration/,
      /auth/,
      /security/
    ];

    const hasHighRiskFiles = changedFiles.some(file =>
      highRiskPatterns.some(pattern => pattern.test(file))
    );

    if (hasHighRiskFiles) {
      analysis.risk_level = analysis.risk_level === 'low' ? 'medium' : 'high';
    }

    return analysis;
  }

  /**
   * Generate impact analysis
   */
  async generateImpactAnalysis(changedFiles, spec, plan) {
    const impact = {
      scope: 'limited',
      affected_areas: [],
      user_facing: false,
      api_changes: false,
      database_changes: false,
      breaking_changes: false,
      performance_impact: 'none',
      security_impact: 'none'
    };

    // Analyze based on file patterns
    const patterns = {
      frontend: /\.(tsx?|jsx?|css|scss|html)$/,
      backend: /\.(ts|js)$.*(?:api|server|controller|service)/,
      database: /(?:migration|model|schema|database)/,
      config: /(?:config|env|json)$/,
      tests: /(?:test|spec)\./
    };

    for (const file of changedFiles) {
      if (patterns.frontend.test(file)) {
        impact.affected_areas.push('frontend');
        impact.user_facing = true;
      }
      if (patterns.backend.test(file)) {
        impact.affected_areas.push('backend');
        impact.api_changes = true;
      }
      if (patterns.database.test(file)) {
        impact.affected_areas.push('database');
        impact.database_changes = true;
      }
      if (patterns.config.test(file)) {
        impact.affected_areas.push('configuration');
      }
      if (patterns.tests.test(file)) {
        impact.affected_areas.push('testing');
      }
    }

    // Remove duplicates
    impact.affected_areas = [...new Set(impact.affected_areas)];

    // Determine scope
    if (impact.affected_areas.length > 3) {
      impact.scope = 'major';
    } else if (impact.affected_areas.length > 1) {
      impact.scope = 'moderate';
    }

    // Check for breaking changes from spec
    if (spec?.breaking_changes || plan?.breaking_changes) {
      impact.breaking_changes = true;
    }

    // Analyze performance impact
    if (changedFiles.some(f => /(?:performance|optimization|cache|index)/.test(f))) {
      impact.performance_impact = 'positive';
    } else if (changedFiles.some(f => /(?:query|database|api)/.test(f))) {
      impact.performance_impact = 'potential';
    }

    // Analyze security impact
    if (changedFiles.some(f => /(?:auth|security|permission|validation)/.test(f))) {
      impact.security_impact = 'high';
    } else if (changedFiles.some(f => /(?:api|endpoint|middleware)/.test(f))) {
      impact.security_impact = 'medium';
    }

    return impact;
  }

  /**
   * Extract title from spec
   */
  extractTitleFromSpec(spec) {
    if (!spec) return 'Update implementation';
    
    return spec.title || 
           spec.user_story?.title ||
           spec.metadata?.title ||
           'Update implementation';
  }

  /**
   * Extract description from spec
   */
  extractDescriptionFromSpec(spec) {
    if (!spec) return 'Implementation update';
    
    return spec.description ||
           spec.user_story?.description ||
           spec.summary ||
           'Implementation update';
  }

  /**
   * Generate appropriate labels
   */
  generateLabels(type, validation, impact, customLabels = []) {
    const labels = [...customLabels];
    
    // Add type label
    labels.push(type);
    
    // Add size labels
    if (impact?.scope === 'major') {
      labels.push('size/large');
    } else if (impact?.scope === 'moderate') {
      labels.push('size/medium');
    } else {
      labels.push('size/small');
    }
    
    // Add area labels
    if (impact?.affected_areas) {
      for (const area of impact.affected_areas) {
        labels.push(`area/${area}`);
      }
    }
    
    // Add risk labels
    if (impact?.risk_level === 'high') {
      labels.push('risk/high');
    } else if (impact?.risk_level === 'medium') {
      labels.push('risk/medium');
    }
    
    // Add validation labels
    if (validation?.summary?.success) {
      labels.push('validation/passed');
    } else {
      labels.push('validation/failed');
    }
    
    // Add breaking change label
    if (impact?.breaking_changes) {
      labels.push('breaking-change');
    }
    
    // Add security label
    if (impact?.security_impact === 'high') {
      labels.push('security');
    }
    
    return [...new Set(labels)];
  }

  /**
   * Build PR description
   */
  async buildPRDescription(prData) {
    const { type, title, description, spec, plan, validation, fileAnalysis, impact, breakingChanges } = prData;
    const template = this.prTemplates[type] || this.prTemplates.feature;
    
    let prDescription = `# ${template.title.replace('{title}', title)}\n\n`;
    
    // Add description
    prDescription += `${description}\n\n`;
    
    // Build sections based on template
    for (const section of template.sections) {
      switch (section) {
        case 'summary':
          prDescription += this.buildSummarySection(spec, plan);
          break;
        case 'changes':
          prDescription += this.buildChangesSection(fileAnalysis, plan);
          break;
        case 'problem':
          prDescription += this.buildProblemSection(spec);
          break;
        case 'solution':
          prDescription += this.buildSolutionSection(spec, plan);
          break;
        case 'motivation':
          prDescription += this.buildMotivationSection(spec);
          break;
        case 'testing':
          prDescription += this.buildTestingSection(plan, validation);
          break;
        case 'validation':
          prDescription += this.buildValidationSection(validation);
          break;
        case 'impact':
          prDescription += this.buildImpactSection(impact);
          break;
        case 'breaking_changes':
          prDescription += this.buildBreakingChangesSection(breakingChanges, impact);
          break;
        case 'checklist':
          prDescription += this.buildChecklistSection();
          break;
      }
    }
    
    // Add metadata footer
    prDescription += this.buildMetadataFooter(prData);
    
    return prDescription;
  }

  /**
   * Build summary section
   */
  buildSummarySection(spec, plan) {
    let section = '## 📋 Summary\n\n';
    
    if (spec?.user_story) {
      section += `**User Story:** ${spec.user_story.description}\n\n`;
    }
    
    if (spec?.acceptance_criteria) {
      section += '**Acceptance Criteria:**\n';
      for (const criteria of spec.acceptance_criteria) {
        section += `- ${criteria}\n`;
      }
      section += '\n';
    }
    
    if (plan?.summary) {
      section += `**Implementation Summary:** ${plan.summary}\n\n`;
    }
    
    return section;
  }

  /**
   * Build changes section
   */
  buildChangesSection(fileAnalysis, plan) {
    let section = '## 🔄 Changes Made\n\n';
    
    if (plan?.tasks) {
      section += '**Key Changes:**\n';
      for (const task of plan.tasks.slice(0, 10)) {
        section += `- ${task.description}\n`;
      }
      section += '\n';
    }
    
    section += '**Files Modified:**\n';
    section += `- Total files changed: ${fileAnalysis.total}\n`;
    
    if (Object.keys(fileAnalysis.by_type).length > 0) {
      section += '- By file type:\n';
      for (const [ext, count] of Object.entries(fileAnalysis.by_type)) {
        section += `  - ${ext || 'no extension'}: ${count} files\n`;
      }
    }
    
    section += '\n';
    return section;
  }

  /**
   * Build problem section
   */
  buildProblemSection(spec) {
    let section = '## 🐛 Problem\n\n';
    
    if (spec?.problem_statement) {
      section += `${spec.problem_statement}\n\n`;
    } else if (spec?.description) {
      section += `${spec.description}\n\n`;
    } else {
      section += 'Problem description not available.\n\n';
    }
    
    return section;
  }

  /**
   * Build solution section
   */
  buildSolutionSection(spec, plan) {
    let section = '## ✅ Solution\n\n';
    
    if (spec?.solution) {
      section += `${spec.solution}\n\n`;
    } else if (plan?.approach) {
      section += `${plan.approach}\n\n`;
    } else {
      section += 'Solution details available in implementation.\n\n';
    }
    
    return section;
  }

  /**
   * Build motivation section
   */
  buildMotivationSection(spec) {
    let section = '## 💡 Motivation\n\n';
    
    if (spec?.motivation) {
      section += `${spec.motivation}\n\n`;
    } else if (spec?.rationale) {
      section += `${spec.rationale}\n\n`;
    } else {
      section += 'Refactoring to improve code quality and maintainability.\n\n';
    }
    
    return section;
  }

  /**
   * Build testing section
   */
  buildTestingSection(plan, validation) {
    let section = '## 🧪 Testing\n\n';
    
    if (plan?.test_plan) {
      section += '**Test Plan:**\n';
      for (const test of plan.test_plan) {
        section += `- ${test}\n`;
      }
      section += '\n';
    }
    
    if (validation?.summary) {
      section += '**Test Results:**\n';
      section += `- Total tests: ${validation.summary.total_gates}\n`;
      section += `- Passed: ${validation.summary.passed}\n`;
      section += `- Failed: ${validation.summary.failed}\n`;
      section += `- Duration: ${Math.round(validation.summary.duration / 1000)}s\n\n`;
    }
    
    return section;
  }

  /**
   * Build validation section
   */
  buildValidationSection(validation) {
    let section = '## ✅ Validation Results\n\n';
    
    if (!validation) {
      section += '⚠️ No validation results available.\n\n';
      return section;
    }
    
    const { summary } = validation;
    const status = summary.success ? '✅ PASSED' : '❌ FAILED';
    
    section += `**Overall Status:** ${status}\n\n`;
    
    section += '| Gate Category | Total | Passed | Failed | Skipped |\n';
    section += '|---------------|-------|--------|--------|---------|\n';
    
    const categories = ['required', 'optional', 'security', 'visual'];
    for (const category of categories) {
      const gates = validation.gates?.[category] || [];
      const passed = gates.filter(g => g.passed).length;
      const failed = gates.filter(g => !g.passed && !g.skipped).length;
      const skipped = gates.filter(g => g.skipped).length;
      
      section += `| ${category.charAt(0).toUpperCase() + category.slice(1)} | ${gates.length} | ${passed} | ${failed} | ${skipped} |\n`;
    }
    
    section += '\n';
    
    // Add failed gates details
    const allGates = Object.values(validation.gates || {}).flat();
    const failedGates = allGates.filter(g => !g.passed && !g.skipped);
    
    if (failedGates.length > 0) {
      section += '**Failed Gates:**\n';
      for (const gate of failedGates) {
        section += `- ❌ ${gate.name}: ${gate.error || 'Failed validation'}\n`;
      }
      section += '\n';
    }
    
    return section;
  }

  /**
   * Build impact section
   */
  buildImpactSection(impact) {
    let section = '## 📊 Impact Analysis\n\n';
    
    section += `**Scope:** ${impact.scope}\n`;
    section += `**Risk Level:** ${impact.risk_level}\n`;
    section += `**Affected Areas:** ${impact.affected_areas.join(', ') || 'None'}\n\n`;
    
    section += '**Impact Details:**\n';
    section += `- User-facing changes: ${impact.user_facing ? '✅ Yes' : '❌ No'}\n`;
    section += `- API changes: ${impact.api_changes ? '✅ Yes' : '❌ No'}\n`;
    section += `- Database changes: ${impact.database_changes ? '✅ Yes' : '❌ No'}\n`;
    section += `- Breaking changes: ${impact.breaking_changes ? '⚠️ Yes' : '❌ No'}\n`;
    section += `- Performance impact: ${impact.performance_impact}\n`;
    section += `- Security impact: ${impact.security_impact}\n\n`;
    
    return section;
  }

  /**
   * Build breaking changes section
   */
  buildBreakingChangesSection(breakingChanges, impact) {
    let section = '## ⚠️ Breaking Changes\n\n';
    
    if (!impact.breaking_changes && breakingChanges.length === 0) {
      section += 'No breaking changes in this PR.\n\n';
      return section;
    }
    
    if (breakingChanges.length > 0) {
      section += '**Breaking Changes:**\n';
      for (const change of breakingChanges) {
        section += `- ${change}\n`;
      }
      section += '\n';
    }
    
    section += '**Migration Guide:**\n';
    section += '- Review the changes carefully before merging\n';
    section += '- Update dependent code and tests\n';
    section += '- Consider versioning strategy\n';
    section += '- Update documentation\n\n';
    
    return section;
  }

  /**
   * Build checklist section
   */
  buildChecklistSection() {
    let section = '## ✅ Checklist\n\n';
    
    for (const item of this.standardChecklist) {
      section += `${item}\n`;
    }
    
    section += '\n';
    return section;
  }

  /**
   * Build metadata footer
   */
  buildMetadataFooter(prData) {
    let footer = '---\n\n';
    footer += '## 🤖 Generated by Spec-to-Code Autopilot\n\n';
    footer += `- **Generated at:** ${prData.metadata.generated_at}\n`;
    footer += `- **Generator version:** ${prData.metadata.generator_version}\n`;
    footer += `- **Files changed:** ${prData.metadata.files_changed}\n`;
    footer += `- **Validation status:** ${prData.metadata.validation_success ? '✅ Passed' : '❌ Failed'}\n`;
    
    if (prData.linkedIssues.length > 0) {
      footer += `- **Linked issues:** ${prData.linkedIssues.join(', ')}\n`;
    }
    
    footer += '\n';
    return footer;
  }

  /**
   * Build PR metadata
   */
  buildPRMetadata(prData) {
    return {
      title: prData.title,
      type: prData.type,
      labels: prData.labels,
      reviewers: prData.reviewers,
      milestone: prData.milestone,
      linked_issues: prData.linkedIssues,
      validation_status: prData.validation?.summary?.success || false,
      impact: prData.impact,
      file_analysis: prData.fileAnalysis,
      metadata: prData.metadata,
      breaking_changes: prData.breakingChanges.length > 0,
      auto_merge_eligible: this.isAutoMergeEligible(prData)
    };
  }

  /**
   * Check if PR is eligible for auto-merge
   */
  isAutoMergeEligible(prData) {
    const { validation, impact, breakingChanges } = prData;
    
    // Must pass validation
    if (!validation?.summary?.success) return false;
    
    // No breaking changes
    if (breakingChanges.length > 0 || impact.breaking_changes) return false;
    
    // Low risk only
    if (impact.risk_level === 'high') return false;
    
    // Limited scope
    if (impact.scope === 'major') return false;
    
    return true;
  }

  /**
   * Create GitHub PR via API (if configured)
   */
  async createGitHubPR(prData, options = {}) {
    const { dryRun = true, branch = 'main', baseBranch = 'main' } = options;
    
    if (dryRun) {
      console.log('🔍 Dry run mode - PR would be created with:');
      console.log(`- Title: ${prData.title}`);
      console.log(`- Labels: ${prData.labels.join(', ')}`);
      console.log(`- Reviewers: ${prData.reviewers.join(', ')}`);
      return { url: 'dry-run-mode', number: 0 };
    }
    
    // TODO: Implement GitHub API integration
    console.log('🚧 GitHub API integration not yet implemented');
    return null;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    type: 'feature',
    title: '',
    description: '',
    specPath: '',
    planPath: '',
    changedFiles: [],
    breakingChanges: [],
    author: 'AI Assistant',
    reviewers: [],
    labels: [],
    milestone: '',
    linkedIssues: []
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const value = args[i + 1];
    
    switch (flag) {
      case '--type':
        options.type = value;
        i++;
        break;
      case '--title':
        options.title = value;
        i++;
        break;
      case '--description':
        options.description = value;
        i++;
        break;
      case '--spec':
        options.specPath = value;
        i++;
        break;
      case '--plan':
        options.planPath = value;
        i++;
        break;
      case '--files':
        options.changedFiles = value.split(',');
        i++;
        break;
      case '--breaking':
        options.breakingChanges = value.split(',');
        i++;
        break;
      case '--author':
        options.author = value;
        i++;
        break;
      case '--reviewers':
        options.reviewers = value.split(',');
        i++;
        break;
      case '--labels':
        options.labels = value.split(',');
        i++;
        break;
      case '--milestone':
        options.milestone = value;
        i++;
        break;
      case '--issues':
        options.linkedIssues = value.split(',');
        i++;
        break;
      case '--help':
        console.log('Usage: node pr-generator.mjs [options]');
        console.log('Options:');
        console.log('  --type <type>           PR type (feature, bugfix, refactor, docs, chore)');
        console.log('  --title <title>         PR title');
        console.log('  --description <desc>    PR description');
        console.log('  --spec <path>           Path to specification file');
        console.log('  --plan <path>           Path to plan file');
        console.log('  --files <files>         Comma-separated list of changed files');
        console.log('  --breaking <changes>    Comma-separated list of breaking changes');
        console.log('  --author <author>       PR author');
        console.log('  --reviewers <reviewers> Comma-separated list of reviewers');
        console.log('  --labels <labels>       Comma-separated list of labels');
        console.log('  --milestone <milestone> Milestone name');
        console.log('  --issues <issues>       Comma-separated list of linked issues');
        process.exit(0);
    }
  }

  try {
    const generator = new PRGenerator();
    const result = await generator.generatePR(options);
    
    console.log('\n📝 PR Generation Summary:');
    console.log(`- Title: ${result.metadata.title}`);
    console.log(`- Type: ${result.metadata.type}`);
    console.log(`- Labels: ${result.metadata.labels.join(', ')}`);
    console.log(`- Validation: ${result.metadata.validation_status ? '✅ Passed' : '❌ Failed'}`);
    console.log(`- Auto-merge eligible: ${result.metadata.auto_merge_eligible ? '✅ Yes' : '❌ No'}`);
    console.log(`- Files: ${result.files.description}`);

  } catch (error) {
    console.error('❌ PR generation error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PRGenerator };