#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test the complete Spec-to-PR workflow
 * This script demonstrates the entire flow from feature request to PR
 */
class SpecToPRWorkflowTest {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.testDir = path.join(__dirname, '..', '.test-workflow');
    this.reportsDir = path.join(__dirname, '..', '.reports');
    
    // Sample feature request for testing
    this.sampleFeatureRequest = {
      title: 'Add Dark Mode Toggle',
      description: 'Implement a dark mode toggle in the application settings that allows users to switch between light and dark themes',
      priority: 'medium',
      type: 'feature',
      author: 'Test User',
      requirements: [
        'Toggle switch in settings page',
        'Persist user preference in localStorage',
        'Apply theme across all components',
        'Smooth transition animations',
        'Accessibility compliance'
      ]
    };
  }

  /**
   * Run the complete workflow test
   */
  async runWorkflowTest() {
    console.log('🚀 Starting Spec-to-PR Workflow Test');
    console.log('=====================================\n');

    try {
      // Ensure test directories exist
      await fs.mkdir(this.testDir, { recursive: true });
      await fs.mkdir(this.reportsDir, { recursive: true });

      const startTime = Date.now();
      const results = {
        phases: [],
        success: false,
        duration: 0,
        outputs: {}
      };

      // Phase 1: Generate Specification
      console.log('📋 Phase 1: Generating Specification...');
      const specResult = await this.testSpecGeneration();
      results.phases.push(specResult);
      results.outputs.spec = specResult.output;

      if (!specResult.success) {
        throw new Error('Specification generation failed');
      }

      // Phase 2: Create Task Plan
      console.log('\n📊 Phase 2: Creating Task Plan...');
      const planResult = await this.testTaskPlanning(specResult.output);
      results.phases.push(planResult);
      results.outputs.plan = planResult.output;

      if (!planResult.success) {
        throw new Error('Task planning failed');
      }

      // Phase 3: Generate Code
      console.log('\n💻 Phase 3: Generating Code...');
      const codeResult = await this.testCodeGeneration(planResult.output);
      results.phases.push(codeResult);
      results.outputs.code = codeResult.output;

      if (!codeResult.success) {
        throw new Error('Code generation failed');
      }

      // Phase 4: Run Validation Pipeline
      console.log('\n🔍 Phase 4: Running Validation Pipeline...');
      const validationResult = await this.testValidationPipeline();
      results.phases.push(validationResult);
      results.outputs.validation = validationResult.output;

      // Phase 5: Generate PR
      console.log('\n📝 Phase 5: Generating Pull Request...');
      const prResult = await this.testPRGeneration(
        specResult.output,
        planResult.output,
        validationResult.output
      );
      results.phases.push(prResult);
      results.outputs.pr = prResult.output;

      if (!prResult.success) {
        throw new Error('PR generation failed');
      }

      // Calculate final results
      results.duration = Date.now() - startTime;
      results.success = results.phases.every(phase => phase.success);

      // Generate test report
      await this.generateTestReport(results);

      console.log('\n✅ Workflow test completed successfully!');
      console.log(`⏱️ Total duration: ${Math.round(results.duration / 1000)}s`);
      
      return results;

    } catch (error) {
      console.error('\n❌ Workflow test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test specification generation
   */
  async testSpecGeneration() {
    const phase = {
      name: 'Specification Generation',
      success: false,
      duration: 0,
      output: null,
      error: null
    };

    const startTime = Date.now();

    try {
      // Create mock spec based on feature request
      const spec = {
        metadata: {
          title: this.sampleFeatureRequest.title,
          type: this.sampleFeatureRequest.type,
          priority: this.sampleFeatureRequest.priority,
          author: this.sampleFeatureRequest.author,
          created_at: new Date().toISOString(),
          version: '1.0.0'
        },
        user_story: {
          title: this.sampleFeatureRequest.title,
          description: this.sampleFeatureRequest.description,
          as_a: 'user',
          i_want: 'to toggle between light and dark themes',
          so_that: 'I can use the application in different lighting conditions'
        },
        acceptance_criteria: [
          'Given I am on the settings page, when I click the dark mode toggle, then the theme should switch to dark mode',
          'Given dark mode is enabled, when I refresh the page, then the dark theme should persist',
          'Given I toggle the theme, when the transition occurs, then it should be smooth and accessible',
          'Given I use a screen reader, when I interact with the toggle, then it should announce the current state'
        ],
        api_contract: {
          endpoints: [],
          components: [
            {
              name: 'ThemeToggle',
              props: {
                isDark: 'boolean',
                onToggle: 'function',
                disabled: 'boolean'
              }
            },
            {
              name: 'ThemeProvider',
              props: {
                theme: 'string',
                children: 'ReactNode'
              }
            }
          ]
        },
        data_model: {
          theme_preference: {
            type: 'string',
            values: ['light', 'dark', 'system'],
            storage: 'localStorage',
            key: 'theme-preference'
          }
        },
        non_functional_requirements: {
          performance: 'Theme switching should complete within 200ms',
          accessibility: 'WCAG 2.1 AA compliance required',
          browser_support: 'Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)',
          responsive: 'Works on all screen sizes'
        },
        risk_assessment: {
          level: 'low',
          risks: [
            'Potential flash of unstyled content during theme switch',
            'CSS specificity conflicts with existing styles'
          ],
          mitigation: [
            'Implement CSS-in-JS solution with proper loading states',
            'Use CSS custom properties for theme variables'
          ]
        }
      };

      // Save spec to file
      const specPath = path.join(this.testDir, 'test-spec.json');
      await fs.writeFile(specPath, JSON.stringify(spec, null, 2));

      phase.output = { spec, path: specPath };
      phase.success = true;
      
      console.log('  ✅ Specification generated successfully');
      console.log(`  📄 Saved to: ${specPath}`);

    } catch (error) {
      phase.error = error.message;
      console.log(`  ❌ Specification generation failed: ${error.message}`);
    }

    phase.duration = Date.now() - startTime;
    return phase;
  }

  /**
   * Test task planning
   */
  async testTaskPlanning(specResult) {
    const phase = {
      name: 'Task Planning',
      success: false,
      duration: 0,
      output: null,
      error: null
    };

    const startTime = Date.now();

    try {
      const { spec } = specResult;
      
      // Create mock task plan
      const plan = {
        metadata: {
          spec_version: spec.metadata.version,
          created_at: new Date().toISOString(),
          complexity: 'medium',
          estimated_hours: 8
        },
        summary: 'Implement dark mode toggle with theme persistence and smooth transitions',
        tasks: [
          {
            id: 'task-1',
            title: 'Create theme context and provider',
            description: 'Implement React context for theme management',
            files: ['src/contexts/ThemeContext.tsx'],
            type: 'create',
            complexity: 'medium',
            estimated_hours: 2
          },
          {
            id: 'task-2',
            title: 'Create theme toggle component',
            description: 'Build accessible toggle switch component',
            files: ['src/components/ThemeToggle.tsx'],
            type: 'create',
            complexity: 'low',
            estimated_hours: 1.5
          },
          {
            id: 'task-3',
            title: 'Add theme styles and CSS variables',
            description: 'Define light and dark theme CSS custom properties',
            files: ['src/styles/themes.css', 'src/styles/variables.css'],
            type: 'create',
            complexity: 'medium',
            estimated_hours: 2
          },
          {
            id: 'task-4',
            title: 'Integrate toggle in settings page',
            description: 'Add theme toggle to settings page',
            files: ['src/pages/Settings.tsx'],
            type: 'modify',
            complexity: 'low',
            estimated_hours: 1
          },
          {
            id: 'task-5',
            title: 'Add localStorage persistence',
            description: 'Implement theme preference persistence',
            files: ['src/utils/themeStorage.ts'],
            type: 'create',
            complexity: 'low',
            estimated_hours: 1
          },
          {
            id: 'task-6',
            title: 'Write unit tests',
            description: 'Create comprehensive test suite',
            files: [
              'src/contexts/__tests__/ThemeContext.test.tsx',
              'src/components/__tests__/ThemeToggle.test.tsx',
              'src/utils/__tests__/themeStorage.test.ts'
            ],
            type: 'create',
            complexity: 'medium',
            estimated_hours: 2.5
          }
        ],
        dependencies: [
          { from: 'task-1', to: 'task-2' },
          { from: 'task-1', to: 'task-4' },
          { from: 'task-2', to: 'task-4' },
          { from: 'task-3', to: 'task-1' },
          { from: 'task-5', to: 'task-1' }
        ],
        execution_plan: {
          phases: [
            {
              name: 'Foundation',
              tasks: ['task-3', 'task-5'],
              parallel: true
            },
            {
              name: 'Core Implementation',
              tasks: ['task-1', 'task-2'],
              parallel: true
            },
            {
              name: 'Integration',
              tasks: ['task-4'],
              parallel: false
            },
            {
              name: 'Testing',
              tasks: ['task-6'],
              parallel: false
            }
          ]
        },
        risk_analysis: {
          level: 'low',
          critical_path: ['task-3', 'task-1', 'task-4'],
          bottlenecks: ['task-1'],
          risks: [
            'CSS conflicts with existing styles',
            'Performance impact of theme switching'
          ]
        },
        quality_gates: [
          'TypeScript compilation must pass',
          'All unit tests must pass',
          'ESLint rules must pass',
          'Accessibility tests must pass',
          'Visual regression tests must pass'
        ]
      };

      // Save plan to file
      const planPath = path.join(this.testDir, 'test-plan.json');
      await fs.writeFile(planPath, JSON.stringify(plan, null, 2));

      phase.output = { plan, path: planPath };
      phase.success = true;
      
      console.log('  ✅ Task plan generated successfully');
      console.log(`  📊 ${plan.tasks.length} tasks planned`);
      console.log(`  ⏱️ Estimated: ${plan.metadata.estimated_hours} hours`);
      console.log(`  📄 Saved to: ${planPath}`);

    } catch (error) {
      phase.error = error.message;
      console.log(`  ❌ Task planning failed: ${error.message}`);
    }

    phase.duration = Date.now() - startTime;
    return phase;
  }

  /**
   * Test code generation
   */
  async testCodeGeneration(planResult) {
    const phase = {
      name: 'Code Generation',
      success: false,
      duration: 0,
      output: null,
      error: null
    };

    const startTime = Date.now();

    try {
      const { plan } = planResult;
      const generatedFiles = [];

      // Create mock generated files based on plan
      for (const task of plan.tasks) {
        for (const filePath of task.files) {
          const fileName = path.basename(filePath);
          const mockContent = this.generateMockFileContent(fileName, task);
          
          const testFilePath = path.join(this.testDir, 'generated', fileName);
          await fs.mkdir(path.dirname(testFilePath), { recursive: true });
          await fs.writeFile(testFilePath, mockContent);
          
          generatedFiles.push({
            original_path: filePath,
            test_path: testFilePath,
            task_id: task.id,
            type: task.type
          });
        }
      }

      phase.output = { 
        files: generatedFiles,
        summary: `Generated ${generatedFiles.length} files`
      };
      phase.success = true;
      
      console.log('  ✅ Code generation completed');
      console.log(`  📁 Generated ${generatedFiles.length} files`);

    } catch (error) {
      phase.error = error.message;
      console.log(`  ❌ Code generation failed: ${error.message}`);
    }

    phase.duration = Date.now() - startTime;
    return phase;
  }

  /**
   * Test validation pipeline
   */
  async testValidationPipeline() {
    const phase = {
      name: 'Validation Pipeline',
      success: false,
      duration: 0,
      output: null,
      error: null
    };

    const startTime = Date.now();

    try {
      // Create mock validation results
      const validation = {
        summary: {
          total_gates: 12,
          passed: 10,
          failed: 1,
          skipped: 1,
          warnings: 3,
          duration: 45000,
          success: false // One critical gate failed
        },
        gates: {
          required: [
            {
              name: 'TypeScript Compilation',
              passed: true,
              duration: 5000,
              critical: true,
              warnings: 0
            },
            {
              name: 'ESLint',
              passed: false,
              duration: 3000,
              critical: true,
              warnings: 2,
              error: '2 linting errors found'
            },
            {
              name: 'Unit Tests',
              passed: true,
              duration: 15000,
              critical: true,
              warnings: 0
            },
            {
              name: 'Integration Tests',
              passed: true,
              duration: 8000,
              critical: true,
              warnings: 1
            }
          ],
          optional: [
            {
              name: 'Code Coverage',
              passed: true,
              duration: 2000,
              critical: false,
              warnings: 0,
              metrics: { value: 85, unit: '%', threshold: 80 }
            },
            {
              name: 'Performance Tests',
              passed: true,
              duration: 5000,
              critical: false,
              warnings: 0
            },
            {
              name: 'Accessibility Tests',
              passed: true,
              duration: 3000,
              critical: false,
              warnings: 0
            }
          ],
          security: [
            {
              name: 'NPM Audit',
              passed: true,
              duration: 2000,
              critical: true,
              warnings: 0,
              metrics: { vulnerabilities: 0 }
            },
            {
              name: 'Secret Scanning',
              passed: true,
              duration: 1000,
              critical: true,
              warnings: 0
            }
          ],
          visual: [
            {
              name: 'Storybook Build',
              passed: true,
              duration: 8000,
              critical: false,
              warnings: 0
            },
            {
              name: 'Visual Regression Tests',
              passed: true,
              duration: 12000,
              critical: false,
              warnings: 0
            },
            {
              name: 'Chromatic Tests',
              passed: false,
              skipped: true,
              duration: 0,
              critical: false,
              warnings: 0,
              error: 'Chromatic token not configured'
            }
          ]
        },
        recommendations: [
          {
            type: 'critical',
            title: 'Fix ESLint Errors',
            description: 'ESLint found 2 critical errors that must be fixed',
            items: [
              'Remove unused import in ThemeContext.tsx',
              'Fix missing dependency in useEffect hook'
            ],
            priority: 'high'
          }
        ],
        next_steps: [
          '❌ Fix failing critical quality gates',
          '🔧 Fix ESLint errors',
          '🔄 Re-run validation pipeline',
          '✅ Proceed to PR creation once all gates pass'
        ]
      };

      // Save validation results
      const validationPath = path.join(this.testDir, 'validation-results.json');
      await fs.writeFile(validationPath, JSON.stringify(validation, null, 2));

      phase.output = { validation, path: validationPath };
      phase.success = true; // Phase succeeds even if validation fails
      
      console.log('  ✅ Validation pipeline completed');
      console.log(`  📊 ${validation.summary.passed}/${validation.summary.total_gates} gates passed`);
      console.log(`  ⚠️ ${validation.summary.failed} critical failures`);
      console.log(`  💡 ${validation.recommendations.length} recommendations`);

    } catch (error) {
      phase.error = error.message;
      console.log(`  ❌ Validation pipeline failed: ${error.message}`);
    }

    phase.duration = Date.now() - startTime;
    return phase;
  }

  /**
   * Test PR generation
   */
  async testPRGeneration(specResult, planResult, validationResult) {
    const phase = {
      name: 'PR Generation',
      success: false,
      duration: 0,
      output: null,
      error: null
    };

    const startTime = Date.now();

    try {
      const { spec } = specResult;
      const { plan } = planResult;
      const { validation } = validationResult;

      // Create mock PR data
      const prData = {
        title: `feat: ${spec.metadata.title}`,
        description: spec.user_story.description,
        type: 'feature',
        spec,
        plan,
        validation,
        fileAnalysis: {
          total: 8,
          by_type: {
            '.tsx': 4,
            '.ts': 2,
            '.css': 2
          },
          by_directory: {
            'src/components': 2,
            'src/contexts': 1,
            'src/utils': 1,
            'src/styles': 2,
            'src/__tests__': 2
          },
          complexity: 'medium',
          risk_level: 'low'
        },
        impact: {
          scope: 'moderate',
          affected_areas: ['frontend', 'styling', 'testing'],
          user_facing: true,
          api_changes: false,
          database_changes: false,
          breaking_changes: false,
          performance_impact: 'minimal',
          security_impact: 'none'
        },
        breakingChanges: [],
        author: 'Spec-to-Code Autopilot',
        reviewers: ['frontend-team'],
        labels: ['feature', 'ui', 'accessibility', 'size/medium'],
        linkedIssues: [],
        metadata: {
          generated_at: new Date().toISOString(),
          generator_version: '1.0.0',
          files_changed: 8,
          validation_success: false
        }
      };

      // Generate PR description
      const prDescription = this.generateMockPRDescription(prData);
      
      // Save PR files
      const prPath = path.join(this.testDir, 'pull-request.md');
      const prMetadataPath = path.join(this.testDir, 'pr-metadata.json');
      
      await fs.writeFile(prPath, prDescription);
      await fs.writeFile(prMetadataPath, JSON.stringify(prData, null, 2));

      phase.output = { 
        description: prDescription,
        metadata: prData,
        files: {
          description: prPath,
          metadata: prMetadataPath
        }
      };
      phase.success = true;
      
      console.log('  ✅ PR description generated');
      console.log(`  📝 Title: ${prData.title}`);
      console.log(`  🏷️ Labels: ${prData.labels.join(', ')}`);
      console.log(`  📄 Saved to: ${prPath}`);

    } catch (error) {
      phase.error = error.message;
      console.log(`  ❌ PR generation failed: ${error.message}`);
    }

    phase.duration = Date.now() - startTime;
    return phase;
  }

  /**
   * Generate mock file content
   */
  generateMockFileContent(fileName, task) {
    const templates = {
      'ThemeContext.tsx': `
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme-preference', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};
      `,
      'ThemeToggle.tsx': `
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  disabled?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ disabled = false, className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      disabled={disabled}
      className={\`theme-toggle \${className}\`}
      aria-label={\`Switch to \${isDark ? 'light' : 'dark'} mode\`}
      role="switch"
      aria-checked={isDark}
    >
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">
        {isDark ? '🌙' : '☀️'} {isDark ? 'Dark' : 'Light'} Mode
      </span>
    </button>
  );
};
      `
    };

    return templates[fileName] || `// Generated file: ${fileName}\n// Task: ${task.title}\n// ${task.description}\n\nexport default {};\n`;
  }

  /**
   * Generate mock PR description
   */
  generateMockPRDescription(prData) {
    return `# feat: ${prData.title.replace('feat: ', '')}

${prData.description}

## 📋 Summary

**User Story:** As a user, I want to toggle between light and dark themes so that I can use the application in different lighting conditions.

**Acceptance Criteria:**
- Given I am on the settings page, when I click the dark mode toggle, then the theme should switch to dark mode
- Given dark mode is enabled, when I refresh the page, then the dark theme should persist
- Given I toggle the theme, when the transition occurs, then it should be smooth and accessible
- Given I use a screen reader, when I interact with the toggle, then it should announce the current state

## 🔄 Changes Made

**Key Changes:**
- Create theme context and provider
- Create theme toggle component
- Add theme styles and CSS variables
- Integrate toggle in settings page
- Add localStorage persistence
- Write unit tests

**Files Modified:**
- Total files changed: 8
- By file type:
  - .tsx: 4 files
  - .ts: 2 files
  - .css: 2 files

## 🧪 Testing

**Test Plan:**
- Unit tests for ThemeContext
- Unit tests for ThemeToggle component
- Integration tests for theme persistence
- Accessibility tests for toggle component

**Test Results:**
- Total tests: 12
- Passed: 10
- Failed: 1
- Duration: 45s

## ✅ Validation Results

**Overall Status:** ❌ FAILED

| Gate Category | Total | Passed | Failed | Skipped |
|---------------|-------|--------|--------|---------|
| Required | 4 | 3 | 1 | 0 |
| Optional | 3 | 3 | 0 | 0 |
| Security | 2 | 2 | 0 | 0 |
| Visual | 3 | 2 | 0 | 1 |

**Failed Gates:**
- ❌ ESLint: 2 linting errors found

## 📊 Impact Analysis

**Scope:** moderate
**Risk Level:** low
**Affected Areas:** frontend, styling, testing

**Impact Details:**
- User-facing changes: ✅ Yes
- API changes: ❌ No
- Database changes: ❌ No
- Breaking changes: ❌ No
- Performance impact: minimal
- Security impact: none

## ⚠️ Breaking Changes

No breaking changes in this PR.

## ✅ Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Corresponding changes to documentation made
- [ ] No new warnings introduced
- [ ] Tests added that prove fix is effective or feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published

---

## 🤖 Generated by Spec-to-Code Autopilot

- **Generated at:** ${prData.metadata.generated_at}
- **Generator version:** ${prData.metadata.generator_version}
- **Files changed:** ${prData.metadata.files_changed}
- **Validation status:** ${prData.metadata.validation_success ? '✅ Passed' : '❌ Failed'}
`;
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport(results) {
    const report = {
      test_summary: {
        success: results.success,
        duration: results.duration,
        phases_completed: results.phases.length,
        phases_passed: results.phases.filter(p => p.success).length
      },
      phases: results.phases,
      outputs: results.outputs,
      recommendations: this.generateTestRecommendations(results),
      next_steps: this.generateTestNextSteps(results)
    };

    const reportPath = path.join(this.testDir, 'workflow-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLTestReport(report);
    const htmlReportPath = path.join(this.testDir, 'workflow-test-report.html');
    await fs.writeFile(htmlReportPath, htmlReport);

    console.log(`\n📊 Test report generated: ${reportPath}`);
    console.log(`🌐 HTML report generated: ${htmlReportPath}`);
  }

  /**
   * Generate test recommendations
   */
  generateTestRecommendations(results) {
    const recommendations = [];

    // Check for failed phases
    const failedPhases = results.phases.filter(p => !p.success);
    if (failedPhases.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Fix Failed Phases',
        description: 'Some workflow phases failed and need attention',
        items: failedPhases.map(p => `${p.name}: ${p.error}`)
      });
    }

    // Check validation results
    if (results.outputs.validation?.validation?.summary?.success === false) {
      recommendations.push({
        type: 'validation',
        title: 'Address Validation Failures',
        description: 'Quality gates failed and must be fixed before PR merge',
        items: ['Fix ESLint errors', 'Re-run validation pipeline']
      });
    }

    // Performance recommendations
    const totalDuration = results.duration;
    if (totalDuration > 300000) { // 5 minutes
      recommendations.push({
        type: 'performance',
        title: 'Optimize Workflow Performance',
        description: 'Workflow took longer than expected',
        items: ['Consider parallel execution', 'Optimize validation pipeline']
      });
    }

    return recommendations;
  }

  /**
   * Generate test next steps
   */
  generateTestNextSteps(results) {
    const steps = [];

    if (results.success) {
      steps.push('✅ All workflow phases completed successfully');
      steps.push('🚀 Ready to integrate Spec-to-Code Autopilot');
      steps.push('📝 Create CLI commands and IDE integration');
      steps.push('🔄 Set up CI/CD integration');
    } else {
      steps.push('❌ Fix failing workflow phases');
      steps.push('🔍 Review error messages and logs');
      steps.push('🛠️ Make necessary improvements');
      steps.push('🔄 Re-run workflow test');
    }

    return steps;
  }

  /**
   * Generate HTML test report
   */
  generateHTMLTestReport(report) {
    const { test_summary, phases, recommendations, next_steps } = report;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spec-to-PR Workflow Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: ${test_summary.success ? '#10b981' : '#ef4444'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #1f2937; }
        .metric-label { color: #6b7280; font-size: 0.9em; }
        .phase { background: #f8fafc; margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid #d1d5db; }
        .phase.success { border-left-color: #10b981; }
        .phase.failed { border-left-color: #ef4444; }
        .phase-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .phase-name { font-weight: bold; }
        .phase-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-success { background: #d1fae5; color: #065f46; }
        .status-failed { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Spec-to-PR Workflow Test Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Status: ${test_summary.success ? '✅ PASSED' : '❌ FAILED'}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="metric">
                    <div class="metric-value">${test_summary.phases_completed}</div>
                    <div class="metric-label">Phases Completed</div>
                </div>
                <div class="metric">
                    <div class="metric-value" style="color: #10b981">${test_summary.phases_passed}</div>
                    <div class="metric-label">Phases Passed</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Math.round(test_summary.duration / 1000)}s</div>
                    <div class="metric-label">Total Duration</div>
                </div>
            </div>
            
            <h2>📋 Workflow Phases</h2>
            ${phases.map(phase => `
                <div class="phase ${phase.success ? 'success' : 'failed'}">
                    <div class="phase-header">
                        <span class="phase-name">${phase.name}</span>
                        <span class="phase-status ${phase.success ? 'status-success' : 'status-failed'}">
                            ${phase.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                    </div>
                    <div>Duration: ${phase.duration}ms</div>
                    ${phase.error ? `<div style="color: #ef4444;">Error: ${phase.error}</div>` : ''}
                </div>
            `).join('')}
            
            ${recommendations.length > 0 ? `
                <h2>💡 Recommendations</h2>
                ${recommendations.map(rec => `
                    <div style="background: #fef7ff; border: 1px solid #e879f9; border-radius: 6px; padding: 15px; margin: 10px 0;">
                        <h3>${rec.title}</h3>
                        <p>${rec.description}</p>
                        <ul>${rec.items.map(item => `<li>${item}</li>`).join('')}</ul>
                    </div>
                `).join('')}
            ` : ''}
            
            <h2>📋 Next Steps</h2>
            <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 6px; padding: 15px;">
                <ul>${next_steps.map(step => `<li>${step}</li>`).join('')}</ul>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }
}

// CLI interface
async function main() {
  try {
    const tester = new SpecToPRWorkflowTest();
    const results = await tester.runWorkflowTest();
    
    console.log('\n🎉 Workflow test summary:');
    console.log(`- Success: ${results.success ? '✅' : '❌'}`);
    console.log(`- Phases: ${results.phases.filter(p => p.success).length}/${results.phases.length} passed`);
    console.log(`- Duration: ${Math.round(results.duration / 1000)}s`);
    
    process.exit(results.success ? 0 : 1);

  } catch (error) {
    console.error('❌ Workflow test error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { SpecToPRWorkflowTest };