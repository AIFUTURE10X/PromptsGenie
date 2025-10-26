#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Task Planning Engine
 * Analyzes specifications and generates detailed implementation plans
 */
class TaskPlanner {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.outputDir = path.join(__dirname, '..', 'plans');
    this.patternsPath = path.join(__dirname, '..', '.rules');
  }

  /**
   * Generate implementation plan from specification
   */
  async generatePlan(spec, options = {}) {
    const {
      includeTests = true,
      includeDocs = false,
      riskLevel = 'medium'
    } = options;

    console.log('🎯 Generating implementation plan...');

    // Analyze specification
    const analysis = await this.analyzeSpecification(spec);
    
    // Generate file impact analysis
    const fileImpact = await this.analyzeFileImpact(analysis);
    
    // Create task breakdown
    const tasks = await this.createTaskBreakdown(analysis, fileImpact, options);
    
    // Generate dependency graph
    const dependencies = await this.analyzeDependencies(tasks);
    
    // Create execution plan
    const executionPlan = await this.createExecutionPlan(tasks, dependencies);
    
    // Generate risk assessment
    const riskAssessment = await this.assessImplementationRisks(analysis, fileImpact);

    const plan = {
      metadata: {
        spec_title: spec.metadata?.title || 'Unknown',
        spec_type: spec.metadata?.type || 'feature',
        created_at: new Date().toISOString(),
        estimated_effort: this.calculateEffort(tasks),
        risk_level: riskLevel
      },
      analysis,
      file_impact: fileImpact,
      tasks,
      dependencies,
      execution_plan: executionPlan,
      risk_assessment: riskAssessment,
      quality_gates: this.defineQualityGates(analysis)
    };

    // Save plan
    const filename = await this.savePlan(plan);

    return {
      plan,
      filename,
      summary: this.generatePlanSummary(plan)
    };
  }

  /**
   * Analyze specification to extract implementation requirements
   */
  async analyzeSpecification(spec) {
    console.log('🔍 Analyzing specification...');

    const analysis = {
      type: spec.metadata?.type || 'feature',
      complexity: this.assessComplexity(spec),
      components: this.extractComponents(spec),
      apis: this.extractAPIs(spec),
      database: this.extractDatabaseChanges(spec),
      ui_changes: this.extractUIChanges(spec),
      testing_requirements: this.extractTestingRequirements(spec),
      security_requirements: this.extractSecurityRequirements(spec),
      performance_requirements: this.extractPerformanceRequirements(spec),
      breaking_changes: this.identifyBreakingChanges(spec)
    };

    console.log(`✅ Analysis completed - Complexity: ${analysis.complexity}`);
    return analysis;
  }

  /**
   * Analyze impact on existing files
   */
  async analyzeFileImpact(analysis) {
    console.log('📁 Analyzing file impact...');

    const impact = {
      new_files: [],
      modified_files: [],
      deleted_files: [],
      test_files: [],
      config_files: [],
      documentation_files: []
    };

    // Analyze component impact
    for (const component of analysis.components) {
      const componentPath = await this.findComponentPath(component);
      if (componentPath) {
        impact.modified_files.push({
          path: componentPath,
          reason: `Update ${component} component`,
          risk: 'medium',
          estimated_changes: this.estimateChanges(component, 'component')
        });
      } else {
        impact.new_files.push({
          path: this.suggestComponentPath(component),
          reason: `Create new ${component} component`,
          risk: 'low',
          estimated_lines: this.estimateComponentSize(component)
        });
      }

      // Add corresponding test files
      const testPath = this.getTestPath(componentPath || this.suggestComponentPath(component));
      impact.test_files.push({
        path: testPath,
        reason: `Tests for ${component} component`,
        risk: 'low',
        test_types: ['unit', 'integration']
      });
    }

    // Analyze API impact
    for (const api of analysis.apis) {
      const apiPath = await this.findAPIPath(api);
      if (apiPath) {
        impact.modified_files.push({
          path: apiPath,
          reason: `Update ${api} API`,
          risk: 'high',
          estimated_changes: this.estimateChanges(api, 'api')
        });
      } else {
        impact.new_files.push({
          path: this.suggestAPIPath(api),
          reason: `Create new ${api} API`,
          risk: 'medium',
          estimated_lines: this.estimateAPISize(api)
        });
      }

      // Add API test files
      const apiTestPath = this.getAPITestPath(apiPath || this.suggestAPIPath(api));
      impact.test_files.push({
        path: apiTestPath,
        reason: `API tests for ${api}`,
        risk: 'low',
        test_types: ['unit', 'integration', 'contract']
      });
    }

    // Analyze database impact
    if (analysis.database.has_changes) {
      impact.new_files.push({
        path: this.suggestMigrationPath(),
        reason: 'Database migration',
        risk: 'high',
        estimated_lines: 50
      });
    }

    // Analyze configuration impact
    if (analysis.breaking_changes.length > 0) {
      impact.config_files.push({
        path: 'package.json',
        reason: 'Version bump for breaking changes',
        risk: 'medium'
      });
    }

    console.log(`✅ File impact analysis completed - ${impact.new_files.length} new, ${impact.modified_files.length} modified`);
    return impact;
  }

  /**
   * Create detailed task breakdown
   */
  async createTaskBreakdown(analysis, fileImpact, options) {
    console.log('📋 Creating task breakdown...');

    const tasks = [];
    let taskId = 1;

    // Planning tasks
    tasks.push({
      id: `task-${taskId++}`,
      name: 'Technical Design Review',
      description: 'Review and finalize technical design',
      type: 'planning',
      priority: 'high',
      estimated_hours: 2,
      dependencies: [],
      deliverables: ['Technical design document', 'API contracts'],
      acceptance_criteria: ['Design approved by tech lead', 'API contracts validated']
    });

    // Database tasks
    if (analysis.database.has_changes) {
      tasks.push({
        id: `task-${taskId++}`,
        name: 'Database Migration',
        description: 'Create and test database migration',
        type: 'database',
        priority: 'high',
        estimated_hours: 4,
        dependencies: [`task-${taskId - 2}`],
        files: fileImpact.new_files.filter(f => f.path.includes('migration')),
        deliverables: ['Migration script', 'Rollback script'],
        acceptance_criteria: ['Migration runs successfully', 'Rollback tested', 'Data integrity verified']
      });
    }

    // API tasks
    for (const api of analysis.apis) {
      tasks.push({
        id: `task-${taskId++}`,
        name: `Implement ${api} API`,
        description: `Create or update ${api} API endpoint`,
        type: 'backend',
        priority: 'high',
        estimated_hours: 6,
        dependencies: analysis.database.has_changes ? [`task-${taskId - 2}`] : [`task-1`],
        files: fileImpact.new_files.concat(fileImpact.modified_files).filter(f => 
          f.path.includes(api.toLowerCase()) || f.reason.includes(api)
        ),
        deliverables: ['API implementation', 'API documentation'],
        acceptance_criteria: ['API endpoints functional', 'OpenAPI spec updated', 'Error handling implemented']
      });

      // API tests
      tasks.push({
        id: `task-${taskId++}`,
        name: `Test ${api} API`,
        description: `Create comprehensive tests for ${api} API`,
        type: 'testing',
        priority: 'medium',
        estimated_hours: 4,
        dependencies: [`task-${taskId - 2}`],
        files: fileImpact.test_files.filter(f => f.reason.includes(api)),
        deliverables: ['Unit tests', 'Integration tests', 'Contract tests'],
        acceptance_criteria: ['90% code coverage', 'All test scenarios pass', 'Contract tests validate API']
      });
    }

    // Component tasks
    for (const component of analysis.components) {
      tasks.push({
        id: `task-${taskId++}`,
        name: `Implement ${component} Component`,
        description: `Create or update ${component} React component`,
        type: 'frontend',
        priority: 'medium',
        estimated_hours: 5,
        dependencies: analysis.apis.length > 0 ? [`task-${taskId - 3}`] : [`task-1`],
        files: fileImpact.new_files.concat(fileImpact.modified_files).filter(f => 
          f.path.includes(component) || f.reason.includes(component)
        ),
        deliverables: ['Component implementation', 'Storybook stories'],
        acceptance_criteria: ['Component renders correctly', 'Props validation implemented', 'Accessibility standards met']
      });

      // Component tests
      tasks.push({
        id: `task-${taskId++}`,
        name: `Test ${component} Component`,
        description: `Create tests for ${component} component`,
        type: 'testing',
        priority: 'medium',
        estimated_hours: 3,
        dependencies: [`task-${taskId - 2}`],
        files: fileImpact.test_files.filter(f => f.reason.includes(component)),
        deliverables: ['Unit tests', 'Integration tests', 'Visual regression tests'],
        acceptance_criteria: ['Component tests pass', 'Visual tests pass', 'Accessibility tests pass']
      });
    }

    // Integration tasks
    if (analysis.components.length > 0 && analysis.apis.length > 0) {
      tasks.push({
        id: `task-${taskId++}`,
        name: 'Frontend-Backend Integration',
        description: 'Integrate frontend components with backend APIs',
        type: 'integration',
        priority: 'high',
        estimated_hours: 4,
        dependencies: tasks.filter(t => t.type === 'frontend' || t.type === 'backend').map(t => t.id),
        deliverables: ['Integration implementation', 'Error handling'],
        acceptance_criteria: ['Data flows correctly', 'Error states handled', 'Loading states implemented']
      });

      // E2E tests
      tasks.push({
        id: `task-${taskId++}`,
        name: 'End-to-End Testing',
        description: 'Create comprehensive E2E tests',
        type: 'testing',
        priority: 'medium',
        estimated_hours: 6,
        dependencies: [`task-${taskId - 2}`],
        deliverables: ['E2E test suite', 'Test data setup'],
        acceptance_criteria: ['User workflows tested', 'Cross-browser compatibility', 'Performance benchmarks met']
      });
    }

    // Documentation tasks
    if (options.includeDocs) {
      tasks.push({
        id: `task-${taskId++}`,
        name: 'Documentation Update',
        description: 'Update project documentation',
        type: 'documentation',
        priority: 'low',
        estimated_hours: 2,
        dependencies: tasks.slice(-2).map(t => t.id),
        deliverables: ['Updated README', 'API documentation', 'User guide'],
        acceptance_criteria: ['Documentation is accurate', 'Examples are working', 'Links are valid']
      });
    }

    // Quality assurance tasks
    tasks.push({
      id: `task-${taskId++}`,
      name: 'Quality Gates Validation',
      description: 'Run all quality gates and fix issues',
      type: 'quality',
      priority: 'high',
      estimated_hours: 3,
      dependencies: tasks.filter(t => t.type !== 'documentation').map(t => t.id),
      deliverables: ['Quality report', 'Issue fixes'],
      acceptance_criteria: ['All tests pass', 'Code coverage meets threshold', 'No security vulnerabilities', 'Performance benchmarks met']
    });

    console.log(`✅ Task breakdown created - ${tasks.length} tasks`);
    return tasks;
  }

  /**
   * Analyze task dependencies
   */
  async analyzeDependencies(tasks) {
    console.log('🔗 Analyzing task dependencies...');

    const dependencies = {
      critical_path: [],
      parallel_groups: [],
      blocking_tasks: [],
      dependency_graph: {}
    };

    // Build dependency graph
    tasks.forEach(task => {
      dependencies.dependency_graph[task.id] = {
        task: task.name,
        depends_on: task.dependencies || [],
        blocks: tasks.filter(t => t.dependencies?.includes(task.id)).map(t => t.id),
        can_start_after: this.calculateEarliestStart(task, tasks),
        estimated_duration: task.estimated_hours
      };
    });

    // Find critical path
    dependencies.critical_path = this.findCriticalPath(tasks, dependencies.dependency_graph);

    // Identify parallel groups
    dependencies.parallel_groups = this.identifyParallelGroups(tasks, dependencies.dependency_graph);

    // Find blocking tasks
    dependencies.blocking_tasks = tasks
      .filter(task => dependencies.dependency_graph[task.id].blocks.length > 2)
      .map(task => ({
        id: task.id,
        name: task.name,
        blocks_count: dependencies.dependency_graph[task.id].blocks.length
      }));

    console.log(`✅ Dependencies analyzed - Critical path: ${dependencies.critical_path.length} tasks`);
    return dependencies;
  }

  /**
   * Create execution plan with phases
   */
  async createExecutionPlan(tasks, dependencies) {
    console.log('📅 Creating execution plan...');

    const phases = [
      {
        name: 'Planning & Design',
        description: 'Technical design and planning',
        tasks: tasks.filter(t => t.type === 'planning'),
        estimated_duration: '1-2 days',
        parallel_execution: false
      },
      {
        name: 'Foundation',
        description: 'Database and core backend changes',
        tasks: tasks.filter(t => t.type === 'database' || (t.type === 'backend' && t.priority === 'high')),
        estimated_duration: '2-3 days',
        parallel_execution: false
      },
      {
        name: 'Implementation',
        description: 'Frontend and remaining backend implementation',
        tasks: tasks.filter(t => t.type === 'frontend' || (t.type === 'backend' && t.priority !== 'high')),
        estimated_duration: '3-5 days',
        parallel_execution: true
      },
      {
        name: 'Integration',
        description: 'Integration and comprehensive testing',
        tasks: tasks.filter(t => t.type === 'integration' || t.type === 'testing'),
        estimated_duration: '2-3 days',
        parallel_execution: true
      },
      {
        name: 'Quality & Documentation',
        description: 'Quality assurance and documentation',
        tasks: tasks.filter(t => t.type === 'quality' || t.type === 'documentation'),
        estimated_duration: '1-2 days',
        parallel_execution: false
      }
    ];

    const executionPlan = {
      phases,
      total_estimated_duration: this.calculateTotalDuration(phases),
      critical_milestones: this.identifyMilestones(tasks, dependencies),
      risk_mitigation: this.createRiskMitigation(tasks),
      rollback_strategy: this.createRollbackStrategy(tasks)
    };

    console.log(`✅ Execution plan created - ${phases.length} phases`);
    return executionPlan;
  }

  /**
   * Assess implementation risks
   */
  async assessImplementationRisks(analysis, fileImpact) {
    console.log('⚠️ Assessing implementation risks...');

    const risks = [];

    // Complexity risks
    if (analysis.complexity === 'high') {
      risks.push({
        type: 'technical',
        risk: 'High implementation complexity',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Break down into smaller tasks, increase testing'
      });
    }

    // Breaking changes risks
    if (analysis.breaking_changes.length > 0) {
      risks.push({
        type: 'business',
        risk: 'Breaking changes may affect existing users',
        probability: 'high',
        impact: 'high',
        mitigation: 'Implement feature flags, gradual rollout, comprehensive testing'
      });
    }

    // Database risks
    if (analysis.database.has_changes) {
      risks.push({
        type: 'technical',
        risk: 'Database migration may cause downtime',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Test migration thoroughly, prepare rollback script, schedule maintenance window'
      });
    }

    // File modification risks
    const highRiskFiles = fileImpact.modified_files.filter(f => f.risk === 'high');
    if (highRiskFiles.length > 0) {
      risks.push({
        type: 'technical',
        risk: 'Modifications to critical files',
        probability: 'medium',
        impact: 'medium',
        mitigation: 'Increase test coverage, code review, backup critical files'
      });
    }

    console.log(`✅ Risk assessment completed - ${risks.length} risks identified`);
    return risks;
  }

  /**
   * Define quality gates for the implementation
   */
  defineQualityGates(analysis) {
    return {
      required: [
        {
          name: 'Type Check',
          command: 'npm run type-check',
          description: 'TypeScript compilation must pass'
        },
        {
          name: 'Lint Check',
          command: 'npm run lint',
          description: 'ESLint must pass with no errors'
        },
        {
          name: 'Unit Tests',
          command: 'npm run test:unit',
          description: 'All unit tests must pass'
        },
        {
          name: 'Integration Tests',
          command: 'npm run test:integration',
          description: 'All integration tests must pass'
        }
      ],
      optional: [
        {
          name: 'Code Coverage',
          command: 'npm run test:coverage',
          description: 'Code coverage should be above 80%',
          threshold: 80
        },
        {
          name: 'Performance Tests',
          command: 'npm run test:performance',
          description: 'Performance benchmarks should be met'
        },
        {
          name: 'Accessibility Tests',
          command: 'npm run test:a11y',
          description: 'Accessibility standards should be met'
        }
      ],
      security: [
        {
          name: 'Security Audit',
          command: 'npm audit',
          description: 'No high or critical security vulnerabilities'
        },
        {
          name: 'Secret Scan',
          command: 'npm run security:scan',
          description: 'No secrets or sensitive data in code'
        }
      ],
      breaking_changes: analysis.breaking_changes.length > 0 ? [
        {
          name: 'ADR Generation',
          command: 'npm run generate:adr',
          description: 'Architecture Decision Record must be created for breaking changes'
        },
        {
          name: 'Migration Guide',
          command: 'npm run docs:migration',
          description: 'Migration guide must be created'
        }
      ] : []
    };
  }

  // Helper methods for analysis
  assessComplexity(spec) {
    let score = 0;
    
    // Check for complex indicators
    if (spec.api_contract?.breaking_changes?.length > 0) score += 3;
    if (spec.data_model?.migrations?.length > 0) score += 2;
    if (spec.acceptance_criteria?.scenarios?.length > 5) score += 2;
    if (spec.risk_assessment?.technical_risks?.some(r => r.severity === 'high')) score += 2;
    if (spec.non_functional_requirements?.performance) score += 1;
    if (spec.non_functional_requirements?.security) score += 1;

    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  extractComponents(spec) {
    const components = [];
    
    // Extract from UI design
    if (spec.ui_design?.components) {
      components.push(...spec.ui_design.components.map(c => c.name));
    }
    
    // Extract from feature overview
    if (spec.feature_overview?.summary) {
      const componentMatches = spec.feature_overview.summary.match(/\b\w+Component\b/g) || [];
      components.push(...componentMatches);
    }

    return [...new Set(components)];
  }

  extractAPIs(spec) {
    const apis = [];
    
    // Extract from API contract
    if (spec.api_contract?.endpoints) {
      apis.push(...spec.api_contract.endpoints.map(e => e.path.split('/').pop()));
    }

    return [...new Set(apis)];
  }

  extractDatabaseChanges(spec) {
    return {
      has_changes: !!(spec.data_model?.migrations?.length > 0),
      migrations: spec.data_model?.migrations || [],
      entities: spec.data_model?.entities || []
    };
  }

  extractUIChanges(spec) {
    return {
      has_changes: !!(spec.ui_design?.components?.length > 0),
      components: spec.ui_design?.components || [],
      interactions: spec.ui_design?.interaction_patterns || []
    };
  }

  extractTestingRequirements(spec) {
    return {
      unit_tests: spec.implementation_plan?.testing_strategy?.unit_tests || [],
      integration_tests: spec.implementation_plan?.testing_strategy?.integration_tests || [],
      e2e_tests: spec.implementation_plan?.testing_strategy?.e2e_tests || [],
      performance_tests: spec.implementation_plan?.testing_strategy?.performance_tests || []
    };
  }

  extractSecurityRequirements(spec) {
    return {
      authentication: spec.non_functional_requirements?.security?.authentication,
      authorization: spec.non_functional_requirements?.security?.authorization,
      data_protection: spec.non_functional_requirements?.security?.data_protection
    };
  }

  extractPerformanceRequirements(spec) {
    return {
      response_time: spec.non_functional_requirements?.performance?.response_time,
      throughput: spec.non_functional_requirements?.performance?.throughput,
      load_capacity: spec.non_functional_requirements?.performance?.load_capacity
    };
  }

  identifyBreakingChanges(spec) {
    return spec.api_contract?.breaking_changes || [];
  }

  // File path helpers
  async findComponentPath(component) {
    const possiblePaths = [
      `src/components/${component}.tsx`,
      `src/components/${component}/${component}.tsx`,
      `src/components/ui/${component}.tsx`
    ];

    for (const path of possiblePaths) {
      try {
        await fs.access(path);
        return path;
      } catch {
        // File doesn't exist, continue
      }
    }
    return null;
  }

  suggestComponentPath(component) {
    return `src/components/${component}.tsx`;
  }

  getTestPath(componentPath) {
    return componentPath.replace('.tsx', '.test.tsx');
  }

  async findAPIPath(api) {
    const possiblePaths = [
      `src/api/${api}.ts`,
      `src/services/${api}.ts`,
      `src/routes/${api}.ts`
    ];

    for (const path of possiblePaths) {
      try {
        await fs.access(path);
        return path;
      } catch {
        // File doesn't exist, continue
      }
    }
    return null;
  }

  suggestAPIPath(api) {
    return `src/api/${api}.ts`;
  }

  getAPITestPath(apiPath) {
    return apiPath.replace('.ts', '.test.ts');
  }

  suggestMigrationPath() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `migrations/${timestamp}-feature-migration.sql`;
  }

  // Estimation helpers
  estimateChanges(item, type) {
    const estimates = {
      component: { lines: 50, complexity: 'medium' },
      api: { lines: 100, complexity: 'high' }
    };
    return estimates[type] || { lines: 30, complexity: 'low' };
  }

  estimateComponentSize(component) {
    return 80; // Average component size
  }

  estimateAPISize(api) {
    return 120; // Average API size
  }

  calculateEffort(tasks) {
    const totalHours = tasks.reduce((sum, task) => sum + task.estimated_hours, 0);
    const days = Math.ceil(totalHours / 8);
    return {
      total_hours: totalHours,
      estimated_days: days,
      effort_level: days <= 3 ? 'small' : days <= 7 ? 'medium' : 'large'
    };
  }

  // Dependency analysis helpers
  calculateEarliestStart(task, tasks) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return 0;
    }

    let maxEnd = 0;
    for (const depId of task.dependencies) {
      const depTask = tasks.find(t => t.id === depId);
      if (depTask) {
        const depStart = this.calculateEarliestStart(depTask, tasks);
        const depEnd = depStart + depTask.estimated_hours;
        maxEnd = Math.max(maxEnd, depEnd);
      }
    }
    return maxEnd;
  }

  findCriticalPath(tasks, dependencyGraph) {
    // Simplified critical path calculation
    const sortedTasks = tasks.sort((a, b) => 
      this.calculateEarliestStart(b, tasks) - this.calculateEarliestStart(a, tasks)
    );
    return sortedTasks.slice(0, Math.ceil(tasks.length * 0.3)).map(t => t.id);
  }

  identifyParallelGroups(tasks, dependencyGraph) {
    const groups = [];
    const processed = new Set();

    for (const task of tasks) {
      if (processed.has(task.id)) continue;

      const parallelTasks = tasks.filter(t => 
        !processed.has(t.id) &&
        !t.dependencies?.some(dep => dependencyGraph[dep]?.blocks?.includes(task.id)) &&
        !task.dependencies?.some(dep => dependencyGraph[dep]?.blocks?.includes(t.id))
      );

      if (parallelTasks.length > 1) {
        groups.push({
          name: `Parallel Group ${groups.length + 1}`,
          tasks: parallelTasks.map(t => t.id),
          estimated_duration: Math.max(...parallelTasks.map(t => t.estimated_hours))
        });
        parallelTasks.forEach(t => processed.add(t.id));
      }
    }

    return groups;
  }

  calculateTotalDuration(phases) {
    const totalDays = phases.reduce((sum, phase) => {
      const phaseDays = parseInt(phase.estimated_duration.split('-')[1]) || 1;
      return sum + phaseDays;
    }, 0);
    return `${Math.ceil(totalDays * 0.8)}-${totalDays} days`;
  }

  identifyMilestones(tasks, dependencies) {
    return [
      {
        name: 'Design Complete',
        tasks: tasks.filter(t => t.type === 'planning').map(t => t.id),
        description: 'Technical design and planning completed'
      },
      {
        name: 'Backend Ready',
        tasks: tasks.filter(t => t.type === 'backend' || t.type === 'database').map(t => t.id),
        description: 'Backend implementation completed'
      },
      {
        name: 'Feature Complete',
        tasks: tasks.filter(t => t.type === 'frontend' || t.type === 'integration').map(t => t.id),
        description: 'Feature implementation completed'
      },
      {
        name: 'Quality Gates Passed',
        tasks: tasks.filter(t => t.type === 'quality').map(t => t.id),
        description: 'All quality gates passed'
      }
    ];
  }

  createRiskMitigation(tasks) {
    return {
      high_risk_tasks: tasks.filter(t => t.priority === 'high').map(t => ({
        task: t.name,
        mitigation: 'Increase testing, code review, pair programming'
      })),
      dependency_risks: 'Monitor critical path tasks closely',
      resource_risks: 'Ensure team availability for high-priority tasks'
    };
  }

  createRollbackStrategy(tasks) {
    return {
      database_rollback: 'Automated rollback scripts for database changes',
      feature_flags: 'Use feature flags for gradual rollout',
      deployment_rollback: 'Blue-green deployment for quick rollback',
      monitoring: 'Real-time monitoring for early issue detection'
    };
  }

  /**
   * Save implementation plan
   */
  async savePlan(plan) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `implementation-plan-${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);

    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Save plan
      await fs.writeFile(filepath, JSON.stringify(plan, null, 2));

      // Also save as markdown
      const markdownContent = this.convertPlanToMarkdown(plan);
      const markdownPath = filepath.replace('.json', '.md');
      await fs.writeFile(markdownPath, markdownContent);

      console.log(`✅ Implementation plan saved to: ${filename}`);
      return filename;

    } catch (error) {
      console.error('❌ Error saving plan:', error.message);
      throw error;
    }
  }

  generatePlanSummary(plan) {
    return {
      total_tasks: plan.tasks.length,
      estimated_effort: plan.metadata.estimated_effort,
      phases: plan.execution_plan.phases.length,
      critical_path_length: plan.dependencies.critical_path.length,
      risk_level: plan.metadata.risk_level,
      new_files: plan.file_impact.new_files.length,
      modified_files: plan.file_impact.modified_files.length
    };
  }

  convertPlanToMarkdown(plan) {
    let markdown = `# Implementation Plan: ${plan.metadata.spec_title}\n\n`;
    markdown += `**Type:** ${plan.metadata.spec_type}  \n`;
    markdown += `**Created:** ${plan.metadata.created_at}  \n`;
    markdown += `**Estimated Effort:** ${plan.metadata.estimated_effort.estimated_days} days (${plan.metadata.estimated_effort.total_hours} hours)  \n`;
    markdown += `**Risk Level:** ${plan.metadata.risk_level}\n\n`;

    // Analysis summary
    markdown += `## Analysis Summary\n\n`;
    markdown += `- **Complexity:** ${plan.analysis.complexity}\n`;
    markdown += `- **Components:** ${plan.analysis.components.length}\n`;
    markdown += `- **APIs:** ${plan.analysis.apis.length}\n`;
    markdown += `- **Database Changes:** ${plan.analysis.database.has_changes ? 'Yes' : 'No'}\n`;
    markdown += `- **Breaking Changes:** ${plan.analysis.breaking_changes.length}\n\n`;

    // File impact
    markdown += `## File Impact\n\n`;
    markdown += `- **New Files:** ${plan.file_impact.new_files.length}\n`;
    markdown += `- **Modified Files:** ${plan.file_impact.modified_files.length}\n`;
    markdown += `- **Test Files:** ${plan.file_impact.test_files.length}\n\n`;

    // Execution phases
    markdown += `## Execution Phases\n\n`;
    plan.execution_plan.phases.forEach((phase, index) => {
      markdown += `### ${index + 1}. ${phase.name}\n`;
      markdown += `${phase.description}\n\n`;
      markdown += `**Duration:** ${phase.estimated_duration}  \n`;
      markdown += `**Parallel Execution:** ${phase.parallel_execution ? 'Yes' : 'No'}  \n`;
      markdown += `**Tasks:** ${phase.tasks.length}\n\n`;
    });

    // Tasks
    markdown += `## Tasks\n\n`;
    plan.tasks.forEach(task => {
      markdown += `### ${task.name}\n`;
      markdown += `**Type:** ${task.type}  \n`;
      markdown += `**Priority:** ${task.priority}  \n`;
      markdown += `**Estimated Hours:** ${task.estimated_hours}  \n`;
      markdown += `**Dependencies:** ${task.dependencies?.join(', ') || 'None'}\n\n`;
      markdown += `${task.description}\n\n`;
      
      if (task.acceptance_criteria) {
        markdown += `**Acceptance Criteria:**\n`;
        task.acceptance_criteria.forEach(criteria => {
          markdown += `- ${criteria}\n`;
        });
        markdown += '\n';
      }
    });

    return markdown;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node task-planner.mjs <spec_file> [options]');
    console.log('Options:');
    console.log('  --include-tests     Include test tasks (default: true)');
    console.log('  --include-docs      Include documentation tasks (default: false)');
    console.log('  --risk-level <level> Risk level (low, medium, high)');
    process.exit(1);
  }

  const specFile = args[0];
  const options = {
    includeTests: true,
    includeDocs: false,
    riskLevel: 'medium'
  };

  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    switch (flag) {
      case '--include-tests':
        options.includeTests = value === 'true';
        break;
      case '--include-docs':
        options.includeDocs = value === 'true';
        break;
      case '--risk-level':
        options.riskLevel = value;
        break;
    }
  }

  try {
    // Load specification
    const specContent = await fs.readFile(specFile, 'utf-8');
    const spec = JSON.parse(specContent);

    const planner = new TaskPlanner();
    const result = await planner.generatePlan(spec, options);
    
    console.log('\n📊 Planning Summary:');
    console.log(`- Plan File: ${result.filename}`);
    console.log(`- Total Tasks: ${result.summary.total_tasks}`);
    console.log(`- Estimated Days: ${result.summary.estimated_effort.estimated_days}`);
    console.log(`- Phases: ${result.summary.phases}`);
    console.log(`- New Files: ${result.summary.new_files}`);
    console.log(`- Modified Files: ${result.summary.modified_files}`);

  } catch (error) {
    console.error('❌ Error generating plan:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TaskPlanner };