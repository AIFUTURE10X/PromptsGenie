#!/usr/bin/env node

/**
 * Spec-to-Code Autopilot
 * 
 * Dual-model orchestrated feature development from natural language spec to PR
 * Uses Claude Sonnet for planning/review and Gemini Pro for implementation
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Configuration
const CONFIG = {
  models: {
    planner: 'claude-3-5-sonnet-20241022',
    implementer: 'gemini-2.5-pro', 
    reviewer: 'claude-3-5-sonnet-20241022'
  },
  gates: {
    required: ['tsc-check', 'eslint', 'jest-runner', 'openapi-check'],
    optional: ['lighthouse', 'axe-a11y', 'chromatic-visual'],
    security: ['gitleaks', 'npm-audit'],
    coverage: { minimum: 80, delta: 5 }
  },
  outputs: {
    specs: join(projectRoot, '.reports/specs'),
    plans: join(projectRoot, '.reports/plans'),
    adrs: join(projectRoot, 'docs/adrs')
  }
};

class SpecToCodeAutopilot {
  constructor(featureRequest) {
    this.featureRequest = featureRequest;
    this.sessionId = `autopilot-${Date.now()}`;
    this.context = {
      spec: null,
      plan: null,
      implementation: null,
      validation: null,
      pr: null
    };
    
    // Ensure output directories exist
    Object.values(CONFIG.outputs).forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  async execute() {
    console.log(`🚀 Starting Spec-to-Code Autopilot for session: ${this.sessionId}`);
    console.log(`📝 Feature Request: ${this.featureRequest}`);
    
    try {
      // Phase 1: Spec Generation (Claude Sonnet)
      await this.generateSpec();
      
      // Phase 2: Task Planning (Claude Sonnet)
      await this.generateTaskPlan();
      
      // Phase 3: Impact Analysis
      await this.analyzeImpact();
      
      // Phase 4: Code Implementation (Gemini Pro)
      await this.implementCode();
      
      // Phase 5: Test Generation (Gemini Pro)
      await this.generateTests();
      
      // Phase 6: Validation Gates
      await this.runValidationGates();
      
      // Phase 7: PR Preparation (Claude Sonnet)
      await this.preparePR();
      
      console.log(`✅ Autopilot completed successfully!`);
      console.log(`📊 Session Report: ${join(CONFIG.outputs.specs, `${this.sessionId}-report.json`)}`);
      
      return this.context;
      
    } catch (error) {
      console.error(`❌ Autopilot failed:`, error.message);
      await this.generateFailureReport(error);
      throw error;
    }
  }

  async generateSpec() {
    console.log(`\n📋 Phase 1: Generating Specification (${CONFIG.models.planner})`);
    
    const specPrompt = this.buildSpecPrompt();
    const spec = await this.callModel(CONFIG.models.planner, specPrompt);
    
    this.context.spec = spec;
    
    // Save spec to file
    const specPath = join(CONFIG.outputs.specs, `${this.sessionId}-spec.md`);
    writeFileSync(specPath, spec);
    
    // Validate spec
    await this.validateSpec(specPath);
    
    console.log(`✅ Specification generated and validated: ${specPath}`);
  }

  async generateTaskPlan() {
    console.log(`\n🗺️  Phase 2: Generating Task Plan (${CONFIG.models.planner})`);
    
    const planPrompt = this.buildPlanPrompt();
    const plan = await this.callModel(CONFIG.models.planner, planPrompt);
    
    this.context.plan = plan;
    
    // Save plan to file
    const planPath = join(CONFIG.outputs.plans, `${this.sessionId}-plan.json`);
    writeFileSync(planPath, JSON.stringify(plan, null, 2));
    
    console.log(`✅ Task plan generated: ${planPath}`);
  }

  async analyzeImpact() {
    console.log(`\n🔍 Phase 3: Analyzing Impact`);
    
    try {
      const result = execSync('node scripts/analyze-impact.mjs', {
        cwd: projectRoot,
        encoding: 'utf8',
        input: JSON.stringify(this.context.plan)
      });
      
      this.context.impact = JSON.parse(result);
      console.log(`✅ Impact analysis completed`);
      
    } catch (error) {
      console.warn(`⚠️  Impact analysis failed: ${error.message}`);
      this.context.impact = { risk: 'unknown', files: [] };
    }
  }

  async implementCode() {
    console.log(`\n⚡ Phase 4: Implementing Code (${CONFIG.models.implementer})`);
    
    const implementPrompt = this.buildImplementPrompt();
    const implementation = await this.callModel(CONFIG.models.implementer, implementPrompt);
    
    this.context.implementation = implementation;
    
    // Apply code changes
    await this.applyCodeChanges(implementation);
    
    console.log(`✅ Code implementation completed`);
  }

  async generateTests() {
    console.log(`\n🧪 Phase 5: Generating Tests (${CONFIG.models.implementer})`);
    
    const testPrompt = this.buildTestPrompt();
    const tests = await this.callModel(CONFIG.models.implementer, testPrompt);
    
    // Apply test changes
    await this.applyTestChanges(tests);
    
    console.log(`✅ Test generation completed`);
  }

  async runValidationGates() {
    console.log(`\n🚪 Phase 6: Running Validation Gates`);
    
    const results = {};
    
    // Required gates
    for (const gate of CONFIG.gates.required) {
      console.log(`  Running ${gate}...`);
      try {
        const result = await this.runGate(gate);
        results[gate] = { status: 'passed', result };
      } catch (error) {
        results[gate] = { status: 'failed', error: error.message };
        throw new Error(`Required gate ${gate} failed: ${error.message}`);
      }
    }
    
    // Security gates
    for (const gate of CONFIG.gates.security) {
      console.log(`  Running ${gate}...`);
      try {
        const result = await this.runGate(gate);
        results[gate] = { status: 'passed', result };
      } catch (error) {
        results[gate] = { status: 'failed', error: error.message };
        console.warn(`⚠️  Security gate ${gate} failed: ${error.message}`);
      }
    }
    
    // Optional gates
    for (const gate of CONFIG.gates.optional) {
      console.log(`  Running ${gate}...`);
      try {
        const result = await this.runGate(gate);
        results[gate] = { status: 'passed', result };
      } catch (error) {
        results[gate] = { status: 'failed', error: error.message };
        console.warn(`⚠️  Optional gate ${gate} failed: ${error.message}`);
      }
    }
    
    this.context.validation = results;
    console.log(`✅ Validation gates completed`);
  }

  async preparePR() {
    console.log(`\n📝 Phase 7: Preparing PR (${CONFIG.models.reviewer})`);
    
    const prPrompt = this.buildPRPrompt();
    const pr = await this.callModel(CONFIG.models.reviewer, prPrompt);
    
    this.context.pr = pr;
    
    // Generate PR description file
    const prPath = join(CONFIG.outputs.specs, `${this.sessionId}-pr.md`);
    writeFileSync(prPath, pr.description);
    
    console.log(`✅ PR prepared: ${prPath}`);
    console.log(`📋 PR Title: ${pr.title}`);
  }

  // Model interaction methods
  async callModel(model, prompt) {
    // This would integrate with actual AI model APIs
    // For now, return structured mock responses
    
    if (model.includes('claude')) {
      return await this.callClaude(prompt);
    } else if (model.includes('gemini')) {
      return await this.callGemini(prompt);
    }
    
    throw new Error(`Unsupported model: ${model}`);
  }

  async callClaude(prompt) {
    // Mock Claude response - in real implementation, use Anthropic API
    console.log(`🤖 Calling Claude Sonnet...`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      model: 'claude-3-5-sonnet',
      response: 'Mock Claude response for: ' + prompt.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    };
  }

  async callGemini(prompt) {
    // Mock Gemini response - in real implementation, use Google AI API
    console.log(`🤖 Calling Gemini Pro...`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      model: 'gemini-2.5-pro',
      response: 'Mock Gemini response for: ' + prompt.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    };
  }

  // Prompt building methods
  buildSpecPrompt() {
    return `
You are the AI architect for PromptsGenie. Generate a comprehensive specification for this feature request:

"${this.featureRequest}"

Provide:
1. User Story & Acceptance Criteria
2. API/UI Contract Changes (OpenAPI/GraphQL/Component Props)
3. Data Model Changes & Migration Notes
4. Non-functional Requirements (Performance, Security, A11y)
5. Risk Assessment & Rollback Strategy

Format as structured markdown with clear sections.
    `.trim();
  }

  buildPlanPrompt() {
    return `
Based on this specification:

${this.context.spec?.response || 'No spec available'}

Generate a detailed implementation plan with:
1. Files to create/modify (with rationale)
2. Test plan (unit, integration, UI test cases)
3. Implementation order and dependencies
4. Risk mitigation strategies

Return as JSON with structured tasks.
    `.trim();
  }

  buildImplementPrompt() {
    return `
Implement the following plan for PromptsGenie:

SPEC: ${this.context.spec?.response || 'No spec'}
PLAN: ${JSON.stringify(this.context.plan, null, 2)}

Follow these patterns:
- TypeScript strict mode
- React functional components with hooks
- Tailwind CSS for styling
- Jest for testing
- Follow existing code patterns in the project

Generate complete, production-ready code.
    `.trim();
  }

  buildTestPrompt() {
    return `
Generate comprehensive tests for the implemented code:

IMPLEMENTATION: ${JSON.stringify(this.context.implementation, null, 2)}

Include:
- Unit tests for all functions/components
- Integration tests for API endpoints
- UI tests for user interactions
- Edge cases and error scenarios

Use Jest and React Testing Library patterns.
    `.trim();
  }

  buildPRPrompt() {
    return `
Generate a PR description for this implementation:

SPEC: ${this.context.spec?.response || 'No spec'}
VALIDATION: ${JSON.stringify(this.context.validation, null, 2)}

Include:
- Clear title with conventional commit format
- Summary of changes and contracts modified
- Test coverage and validation results
- Breaking changes and migration notes
- Deployment considerations

Format as GitHub PR template.
    `.trim();
  }

  // Utility methods
  async validateSpec(specPath) {
    try {
      execSync(`node scripts/validate-spec.mjs "${specPath}"`, {
        cwd: projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      throw new Error(`Spec validation failed: ${error.message}`);
    }
  }

  async runGate(gateName) {
    const gateCommands = {
      'tsc-check': 'npx tsc --noEmit',
      'eslint': 'npx eslint src --format json --max-warnings=0',
      'jest-runner': 'npx jest --coverage --passWithNoTests',
      'openapi-check': 'node scripts/openapi-validate.mjs',
      'lighthouse': 'npx lighthouse http://localhost:8085 --output=json --quiet --chrome-flags=--headless',
      'axe-a11y': 'node scripts/run-axe.mjs',
      'chromatic-visual': 'npx chromatic --exit-zero-on-changes',
      'gitleaks': 'npx gitleaks detect --report-format json',
      'npm-audit': 'npm audit --audit-level moderate'
    };

    const command = gateCommands[gateName];
    if (!command) {
      throw new Error(`Unknown gate: ${gateName}`);
    }

    return execSync(command, {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 300000 // 5 minutes
    });
  }

  async applyCodeChanges(implementation) {
    // Mock implementation - would apply actual file changes
    console.log(`📝 Applying code changes...`);
    
    // In real implementation, parse the implementation response
    // and apply file changes using filesystem operations
  }

  async applyTestChanges(tests) {
    // Mock implementation - would apply actual test file changes
    console.log(`🧪 Applying test changes...`);
  }

  async generateFailureReport(error) {
    const report = {
      sessionId: this.sessionId,
      featureRequest: this.featureRequest,
      error: error.message,
      context: this.context,
      timestamp: new Date().toISOString()
    };

    const reportPath = join(CONFIG.outputs.specs, `${this.sessionId}-failure.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Failure report generated: ${reportPath}`);
  }
}

// CLI Interface
async function main() {
  const featureRequest = process.argv[2] || process.env.FEATURE_REQUEST;
  
  if (!featureRequest) {
    console.error('❌ Feature request required');
    console.log('Usage: node spec-to-code-autopilot.mjs "feature description"');
    console.log('   or: FEATURE_REQUEST="feature description" node spec-to-code-autopilot.mjs');
    process.exit(1);
  }

  const autopilot = new SpecToCodeAutopilot(featureRequest);
  
  try {
    const result = await autopilot.execute();
    console.log('\n🎉 Autopilot completed successfully!');
    console.log('📋 Next steps:');
    console.log('  1. Review generated PR description');
    console.log('  2. Create GitHub PR with the generated content');
    console.log('  3. Monitor CI pipeline execution');
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Autopilot failed:', error.message);
    process.exit(1);
  }
}

// Export for testing
export { SpecToCodeAutopilot, CONFIG };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}