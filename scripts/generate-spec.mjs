#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Spec Generation Engine
 * Generates comprehensive specifications using templates and AI models
 */
class SpecGenerator {
  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates', 'spec-templates.json');
    this.schemaPath = path.join(__dirname, '..', 'schemas', 'spec-validation.json');
    this.outputDir = path.join(__dirname, '..', 'specs');
  }

  /**
   * Load templates and schemas
   */
  async loadTemplates() {
    try {
      const templatesContent = await fs.readFile(this.templatesPath, 'utf-8');
      const schemaContent = await fs.readFile(this.schemaPath, 'utf-8');
      
      this.templates = JSON.parse(templatesContent);
      this.schema = JSON.parse(schemaContent);
      
      console.log('✅ Templates and schemas loaded successfully');
    } catch (error) {
      console.error('❌ Error loading templates:', error.message);
      throw error;
    }
  }

  /**
   * Generate specification from feature request
   */
  async generateSpec(featureRequest, options = {}) {
    const {
      type = 'feature',
      priority = 'medium',
      author = 'AI Assistant',
      includeOptionalSections = true
    } = options;

    console.log(`🚀 Generating ${type} specification...`);

    // Get appropriate template
    const template = this.templates.templates[type];
    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }

    // Analyze feature request to extract key information
    const analysis = await this.analyzeFeatureRequest(featureRequest);
    
    // Generate specification content
    const spec = await this.buildSpecification(template, analysis, {
      type,
      priority,
      author,
      includeOptionalSections
    });

    // Validate specification
    const validation = await this.validateSpecification(spec);
    
    // Save specification
    const filename = await this.saveSpecification(spec, type);

    return {
      spec,
      validation,
      filename,
      analysis
    };
  }

  /**
   * Analyze feature request using AI
   */
  async analyzeFeatureRequest(featureRequest) {
    console.log('🔍 Analyzing feature request...');

    // Mock AI analysis - in real implementation, this would call Claude/Gemini
    const analysis = {
      title: this.extractTitle(featureRequest),
      type: this.detectType(featureRequest),
      complexity: this.assessComplexity(featureRequest),
      components: this.identifyComponents(featureRequest),
      apis: this.identifyAPIs(featureRequest),
      risks: this.identifyRisks(featureRequest),
      userStory: this.extractUserStory(featureRequest),
      acceptanceCriteria: this.generateAcceptanceCriteria(featureRequest),
      technicalRequirements: this.extractTechnicalRequirements(featureRequest)
    };

    console.log('✅ Feature request analysis completed');
    return analysis;
  }

  /**
   * Build specification from template and analysis
   */
  async buildSpecification(template, analysis, metadata) {
    console.log('📝 Building specification...');

    const spec = {
      metadata: {
        title: analysis.title,
        type: metadata.type,
        priority: metadata.priority,
        created_at: new Date().toISOString(),
        author: metadata.author,
        version: '1.0.0',
        tags: this.generateTags(analysis)
      },
      feature_overview: {
        summary: analysis.title,
        business_value: this.generateBusinessValue(analysis),
        success_metrics: this.generateSuccessMetrics(analysis)
      },
      user_story: analysis.userStory,
      acceptance_criteria: analysis.acceptanceCriteria,
      risk_assessment: {
        technical_risks: analysis.risks.technical,
        business_risks: analysis.risks.business,
        mitigation_strategies: this.generateMitigationStrategies(analysis.risks),
        rollback_plan: this.generateRollbackPlan(analysis)
      }
    };

    // Add optional sections based on analysis
    if (analysis.apis.length > 0) {
      spec.api_contract = this.generateAPIContract(analysis.apis);
    }

    if (analysis.components.length > 0) {
      spec.ui_design = this.generateUIDesign(analysis.components);
    }

    if (analysis.technicalRequirements.dataModel) {
      spec.data_model = this.generateDataModel(analysis.technicalRequirements.dataModel);
    }

    spec.non_functional_requirements = this.generateNonFunctionalRequirements(analysis);
    spec.implementation_plan = this.generateImplementationPlan(analysis);

    console.log('✅ Specification built successfully');
    return spec;
  }

  /**
   * Validate specification against schema
   */
  async validateSpecification(spec) {
    console.log('🔍 Validating specification...');

    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 0,
      completeness: {}
    };

    try {
      // Check required sections
      const requiredSections = this.schema.required;
      for (const section of requiredSections) {
        if (!spec[section]) {
          validation.errors.push(`Missing required section: ${section}`);
          validation.isValid = false;
        }
      }

      // Check user story format
      if (spec.user_story) {
        const userStory = spec.user_story;
        if (!userStory.as_a || !userStory.i_want || !userStory.so_that) {
          validation.errors.push('User story must include as_a, i_want, and so_that');
          validation.isValid = false;
        }
      }

      // Check acceptance criteria
      if (spec.acceptance_criteria) {
        const ac = spec.acceptance_criteria;
        if (!ac.scenarios || ac.scenarios.length === 0) {
          validation.warnings.push('No acceptance criteria scenarios defined');
        }
      }

      // Calculate completeness score
      validation.completeness = this.calculateCompletenessScore(spec);
      validation.score = validation.completeness.overall;

      if (validation.isValid) {
        console.log(`✅ Specification validation passed (Score: ${validation.score.toFixed(2)})`);
      } else {
        console.log(`❌ Specification validation failed (${validation.errors.length} errors)`);
      }

    } catch (error) {
      validation.errors.push(`Validation error: ${error.message}`);
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * Save specification to file
   */
  async saveSpecification(spec, type) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}-spec-${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);

    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Save specification
      await fs.writeFile(filepath, JSON.stringify(spec, null, 2));

      // Also save as markdown for readability
      const markdownContent = this.convertToMarkdown(spec);
      const markdownPath = filepath.replace('.json', '.md');
      await fs.writeFile(markdownPath, markdownContent);

      console.log(`✅ Specification saved to: ${filename}`);
      return filename;

    } catch (error) {
      console.error('❌ Error saving specification:', error.message);
      throw error;
    }
  }

  /**
   * Helper methods for analysis
   */
  extractTitle(featureRequest) {
    // Extract title from feature request
    const lines = featureRequest.split('\n');
    const firstLine = lines[0].trim();
    return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;
  }

  detectType(featureRequest) {
    const request = featureRequest.toLowerCase();
    if (request.includes('bug') || request.includes('fix') || request.includes('error')) {
      return 'bugfix';
    }
    if (request.includes('refactor') || request.includes('improve') || request.includes('optimize')) {
      return 'refactor';
    }
    if (request.includes('api') || request.includes('endpoint') || request.includes('service')) {
      return 'api';
    }
    return 'feature';
  }

  assessComplexity(featureRequest) {
    const request = featureRequest.toLowerCase();
    const complexityIndicators = {
      high: ['database', 'migration', 'breaking change', 'architecture', 'integration'],
      medium: ['component', 'api', 'validation', 'authentication', 'testing'],
      low: ['ui', 'styling', 'text', 'button', 'display']
    };

    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => request.includes(indicator))) {
        return level;
      }
    }
    return 'medium';
  }

  identifyComponents(featureRequest) {
    const componentPatterns = [
      /component/gi,
      /button/gi,
      /form/gi,
      /modal/gi,
      /dialog/gi,
      /table/gi,
      /list/gi,
      /card/gi,
      /header/gi,
      /footer/gi,
      /navigation/gi,
      /menu/gi
    ];

    const components = [];
    componentPatterns.forEach(pattern => {
      const matches = featureRequest.match(pattern);
      if (matches) {
        components.push(...matches.map(match => match.toLowerCase()));
      }
    });

    return [...new Set(components)];
  }

  identifyAPIs(featureRequest) {
    const apiPatterns = [
      /api/gi,
      /endpoint/gi,
      /service/gi,
      /GET|POST|PUT|DELETE|PATCH/gi,
      /\/[a-zA-Z0-9\/\-_]+/g
    ];

    const apis = [];
    apiPatterns.forEach(pattern => {
      const matches = featureRequest.match(pattern);
      if (matches) {
        apis.push(...matches);
      }
    });

    return [...new Set(apis)];
  }

  identifyRisks(featureRequest) {
    const request = featureRequest.toLowerCase();
    
    const technicalRisks = [];
    const businessRisks = [];

    // Technical risk indicators
    if (request.includes('database') || request.includes('migration')) {
      technicalRisks.push({
        risk: 'Database migration complexity',
        probability: 'medium',
        impact: 'high',
        severity: 'high'
      });
    }

    if (request.includes('breaking') || request.includes('api change')) {
      technicalRisks.push({
        risk: 'Breaking changes to existing API',
        probability: 'high',
        impact: 'high',
        severity: 'critical'
      });
    }

    if (request.includes('performance') || request.includes('scale')) {
      technicalRisks.push({
        risk: 'Performance impact on existing functionality',
        probability: 'medium',
        impact: 'medium',
        severity: 'medium'
      });
    }

    // Business risk indicators
    if (request.includes('user experience') || request.includes('ui')) {
      businessRisks.push({
        risk: 'User adoption challenges',
        probability: 'medium',
        impact: 'medium'
      });
    }

    // Default risks if none identified
    if (technicalRisks.length === 0) {
      technicalRisks.push({
        risk: 'Implementation complexity',
        probability: 'low',
        impact: 'medium',
        severity: 'medium'
      });
    }

    if (businessRisks.length === 0) {
      businessRisks.push({
        risk: 'Feature adoption risk',
        probability: 'low',
        impact: 'low'
      });
    }

    return { technical: technicalRisks, business: businessRisks };
  }

  extractUserStory(featureRequest) {
    // Try to extract or generate user story
    const asAMatch = featureRequest.match(/as a ([^,\n]+)/i);
    const iWantMatch = featureRequest.match(/i want ([^,\n]+)/i);
    const soThatMatch = featureRequest.match(/so that ([^,\n]+)/i);

    return {
      as_a: asAMatch ? asAMatch[1].trim() : 'user',
      i_want: iWantMatch ? iWantMatch[1].trim() : 'to use the new feature',
      so_that: soThatMatch ? soThatMatch[1].trim() : 'I can accomplish my goals more efficiently'
    };
  }

  generateAcceptanceCriteria(featureRequest) {
    return {
      functional_requirements: [
        'Feature must be accessible via the main interface',
        'Feature must provide clear feedback to users',
        'Feature must handle error cases gracefully'
      ],
      scenarios: [
        {
          name: 'Happy path scenario',
          given: 'the user is on the main page',
          when: 'they interact with the new feature',
          then: 'they should see the expected result'
        }
      ],
      edge_cases: [
        'Invalid input handling',
        'Network connectivity issues',
        'Concurrent user access'
      ]
    };
  }

  extractTechnicalRequirements(featureRequest) {
    return {
      dataModel: featureRequest.toLowerCase().includes('data') || featureRequest.toLowerCase().includes('database'),
      authentication: featureRequest.toLowerCase().includes('auth') || featureRequest.toLowerCase().includes('login'),
      realtime: featureRequest.toLowerCase().includes('realtime') || featureRequest.toLowerCase().includes('live'),
      external: featureRequest.toLowerCase().includes('api') || featureRequest.toLowerCase().includes('service')
    };
  }

  // Additional helper methods...
  generateTags(analysis) {
    const tags = [analysis.type, analysis.complexity];
    if (analysis.components.length > 0) tags.push('ui');
    if (analysis.apis.length > 0) tags.push('api');
    return tags;
  }

  generateBusinessValue(analysis) {
    return `This ${analysis.type} will improve user experience and system functionality.`;
  }

  generateSuccessMetrics(analysis) {
    return [
      {
        metric: 'User adoption rate',
        target: '80% of active users',
        measurement: 'Analytics tracking'
      },
      {
        metric: 'Feature usage',
        target: '50% increase in engagement',
        measurement: 'Usage analytics'
      }
    ];
  }

  generateMitigationStrategies(risks) {
    return [
      {
        strategy: 'Comprehensive testing strategy',
        effectiveness: 'high'
      },
      {
        strategy: 'Gradual rollout with feature flags',
        effectiveness: 'high'
      },
      {
        strategy: 'Monitoring and alerting',
        effectiveness: 'medium'
      }
    ];
  }

  generateRollbackPlan(analysis) {
    return {
      steps: [
        'Disable feature flag',
        'Revert database migrations if applicable',
        'Deploy previous version',
        'Verify system stability'
      ],
      time_estimate: '30 minutes',
      data_recovery: 'Database backups available for 30 days'
    };
  }

  generateAPIContract(apis) {
    return {
      endpoints: apis.map(api => ({
        method: 'GET',
        path: `/api/${api.toLowerCase()}`,
        description: `${api} endpoint`,
        request_schema: {},
        response_schema: {},
        error_responses: [
          { status: 400, description: 'Bad Request' },
          { status: 500, description: 'Internal Server Error' }
        ]
      }))
    };
  }

  generateUIDesign(components) {
    return {
      components: components.map(comp => ({
        name: comp,
        type: 'React Component',
        props: {}
      })),
      interaction_patterns: ['Click', 'Hover', 'Focus'],
      accessibility_requirements: ['WCAG 2.1 AA compliance', 'Screen reader support', 'Keyboard navigation']
    };
  }

  generateDataModel(hasDataModel) {
    if (!hasDataModel) return undefined;
    
    return {
      entities: [
        {
          name: 'FeatureData',
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'created_at', type: 'datetime', required: true },
            { name: 'updated_at', type: 'datetime', required: true }
          ]
        }
      ],
      migrations: [
        {
          type: 'create',
          description: 'Create feature data table',
          sql: 'CREATE TABLE feature_data (...)'
        }
      ]
    };
  }

  generateNonFunctionalRequirements(analysis) {
    return {
      performance: {
        response_time: '< 200ms',
        throughput: '1000 requests/second',
        load_capacity: '10,000 concurrent users'
      },
      security: {
        authentication: 'Required for sensitive operations',
        authorization: 'Role-based access control',
        data_protection: 'Encrypt sensitive data'
      },
      accessibility: {
        wcag_level: 'AA',
        screen_reader: true,
        keyboard_navigation: true
      }
    };
  }

  generateImplementationPlan(analysis) {
    return {
      phases: [
        {
          name: 'Planning',
          description: 'Detailed planning and design',
          deliverables: ['Technical design', 'API specification'],
          duration: '1 week'
        },
        {
          name: 'Implementation',
          description: 'Core feature development',
          deliverables: ['Feature implementation', 'Unit tests'],
          duration: '2 weeks'
        },
        {
          name: 'Testing',
          description: 'Comprehensive testing',
          deliverables: ['Test results', 'Bug fixes'],
          duration: '1 week'
        }
      ],
      dependencies: [
        {
          name: 'Design approval',
          type: 'business',
          description: 'UI/UX design must be approved'
        }
      ],
      testing_strategy: {
        unit_tests: ['Component tests', 'Function tests'],
        integration_tests: ['API integration tests'],
        e2e_tests: ['User workflow tests'],
        performance_tests: ['Load testing', 'Stress testing']
      }
    };
  }

  calculateCompletenessScore(spec) {
    const weights = {
      required_sections: 0.4,
      optional_sections: 0.2,
      quality_checks: 0.2,
      detail_level: 0.2
    };

    const scores = {
      required_sections: 0,
      optional_sections: 0,
      quality_checks: 0,
      detail_level: 0
    };

    // Calculate scores for each category
    const requiredSections = ['user_story', 'acceptance_criteria', 'risk_assessment'];
    const presentRequired = requiredSections.filter(section => spec[section]).length;
    scores.required_sections = presentRequired / requiredSections.length;

    const optionalSections = ['api_contract', 'ui_design', 'data_model', 'non_functional_requirements'];
    const presentOptional = optionalSections.filter(section => spec[section]).length;
    scores.optional_sections = presentOptional / optionalSections.length;

    // Quality checks (simplified)
    scores.quality_checks = 0.8; // Assume good quality for generated specs
    scores.detail_level = 0.7; // Assume good detail level

    // Calculate overall score
    const overall = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key] * weight);
    }, 0);

    return {
      ...scores,
      overall,
      grade: overall >= 0.9 ? 'excellent' : overall >= 0.7 ? 'good' : overall >= 0.5 ? 'acceptable' : 'poor'
    };
  }

  convertToMarkdown(spec) {
    let markdown = `# ${spec.metadata.title}\n\n`;
    markdown += `**Type:** ${spec.metadata.type}  \n`;
    markdown += `**Priority:** ${spec.metadata.priority}  \n`;
    markdown += `**Created:** ${spec.metadata.created_at}  \n`;
    markdown += `**Author:** ${spec.metadata.author}  \n\n`;

    if (spec.feature_overview) {
      markdown += `## Feature Overview\n\n${spec.feature_overview.summary}\n\n`;
      markdown += `**Business Value:** ${spec.feature_overview.business_value}\n\n`;
    }

    if (spec.user_story) {
      markdown += `## User Story\n\n`;
      markdown += `**As a** ${spec.user_story.as_a}  \n`;
      markdown += `**I want** ${spec.user_story.i_want}  \n`;
      markdown += `**So that** ${spec.user_story.so_that}\n\n`;
    }

    if (spec.acceptance_criteria) {
      markdown += `## Acceptance Criteria\n\n`;
      if (spec.acceptance_criteria.scenarios) {
        spec.acceptance_criteria.scenarios.forEach(scenario => {
          markdown += `### ${scenario.name}\n`;
          markdown += `**Given** ${scenario.given}  \n`;
          markdown += `**When** ${scenario.when}  \n`;
          markdown += `**Then** ${scenario.then}\n\n`;
        });
      }
    }

    if (spec.risk_assessment) {
      markdown += `## Risk Assessment\n\n`;
      if (spec.risk_assessment.technical_risks) {
        markdown += `### Technical Risks\n`;
        spec.risk_assessment.technical_risks.forEach(risk => {
          markdown += `- **${risk.risk}** (${risk.severity})\n`;
        });
        markdown += '\n';
      }
    }

    return markdown;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node generate-spec.mjs "<feature_request>" [options]');
    console.log('Options:');
    console.log('  --type <type>        Specification type (feature, bugfix, refactor, api)');
    console.log('  --priority <level>   Priority level (low, medium, high, critical)');
    console.log('  --author <name>      Author name');
    process.exit(1);
  }

  const featureRequest = args[0];
  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    switch (flag) {
      case '--type':
        options.type = value;
        break;
      case '--priority':
        options.priority = value;
        break;
      case '--author':
        options.author = value;
        break;
    }
  }

  try {
    const generator = new SpecGenerator();
    await generator.loadTemplates();
    
    const result = await generator.generateSpec(featureRequest, options);
    
    console.log('\n📊 Generation Summary:');
    console.log(`- Specification: ${result.filename}`);
    console.log(`- Validation Score: ${result.validation.score.toFixed(2)} (${result.validation.completeness.grade})`);
    console.log(`- Errors: ${result.validation.errors.length}`);
    console.log(`- Warnings: ${result.validation.warnings.length}`);
    
    if (result.validation.errors.length > 0) {
      console.log('\n❌ Validation Errors:');
      result.validation.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.validation.warnings.length > 0) {
      console.log('\n⚠️ Validation Warnings:');
      result.validation.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

  } catch (error) {
    console.error('❌ Error generating specification:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SpecGenerator };