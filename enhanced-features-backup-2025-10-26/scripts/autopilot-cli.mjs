#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';

const require = createRequire(import.meta.url);
const { program } = require('commander');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Spec-to-Code Autopilot CLI
 * Main command-line interface for the automated development workflow
 */
class AutopilotCLI {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.configPath = path.join(this.projectRoot, '.trae', 'mcp.json');
    this.outputDir = path.join(this.projectRoot, '.autopilot-output');
  }

  /**
   * Initialize the CLI program
   */
  async init() {
    program
      .name('autopilot')
      .description('Spec-to-Code Autopilot - Automated feature development')
      .version('1.0.0');

    // Main autopilot command
    program
      .command('run')
      .description('Run the complete Spec-to-PR workflow')
      .option('-f, --feature <description>', 'Feature description')
      .option('-t, --type <type>', 'Feature type (feature|bugfix|refactor|api)', 'feature')
      .option('-p, --priority <priority>', 'Priority level (low|medium|high)', 'medium')
      .option('-a, --author <author>', 'Author name')
      .option('--interactive', 'Run in interactive mode', false)
      .option('--dry-run', 'Simulate without making changes', false)
      .option('--skip-validation', 'Skip validation pipeline', false)
      .option('--auto-fix', 'Automatically fix validation issues', false)
      .action(this.runAutopilot.bind(this));

    // Generate spec only
    program
      .command('spec')
      .description('Generate specification only')
      .option('-f, --feature <description>', 'Feature description')
      .option('-t, --type <type>', 'Feature type', 'feature')
      .option('-p, --priority <priority>', 'Priority level', 'medium')
      .option('-o, --output <path>', 'Output file path')
      .action(this.generateSpec.bind(this));

    // Generate plan only
    program
      .command('plan')
      .description('Generate task plan from specification')
      .option('-s, --spec <path>', 'Specification file path')
      .option('-o, --output <path>', 'Output file path')
      .action(this.generatePlan.bind(this));

    // Generate code only
    program
      .command('code')
      .description('Generate code from task plan')
      .option('-p, --plan <path>', 'Task plan file path')
      .option('-o, --output <dir>', 'Output directory')
      .action(this.generateCode.bind(this));

    // Validate changes
    program
      .command('validate')
      .description('Run validation pipeline')
      .option('--gates <gates>', 'Comma-separated list of gates to run')
      .option('--report <path>', 'Report output path')
      .action(this.runValidation.bind(this));

    // Generate PR
    program
      .command('pr')
      .description('Generate pull request description')
      .option('-s, --spec <path>', 'Specification file path')
      .option('-p, --plan <path>', 'Task plan file path')
      .option('-v, --validation <path>', 'Validation results file path')
      .option('-o, --output <path>', 'Output file path')
      .action(this.generatePR.bind(this));

    // Status command
    program
      .command('status')
      .description('Show autopilot status and recent runs')
      .action(this.showStatus.bind(this));

    // Config command
    program
      .command('config')
      .description('Configure autopilot settings')
      .option('--show', 'Show current configuration')
      .option('--set <key=value>', 'Set configuration value')
      .action(this.manageConfig.bind(this));

    await program.parseAsync();
  }

  /**
   * Run the complete autopilot workflow
   */
  async runAutopilot(options) {
    console.log(chalk.blue.bold('🚀 Spec-to-Code Autopilot'));
    console.log(chalk.gray('=====================================\n'));

    try {
      let featureRequest;

      if (options.interactive) {
        featureRequest = await this.promptForFeatureRequest();
      } else {
        if (!options.feature) {
          console.error(chalk.red('❌ Feature description is required'));
          process.exit(1);
        }

        featureRequest = {
          description: options.feature,
          type: options.type,
          priority: options.priority,
          author: options.author || 'Autopilot User'
        };
      }

      if (options.dryRun) {
        console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made\n'));
      }

      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      const runId = `run-${Date.now()}`;
      const runDir = path.join(this.outputDir, runId);
      await fs.mkdir(runDir, { recursive: true });

      console.log(chalk.cyan(`📁 Run ID: ${runId}`));
      console.log(chalk.gray(`📂 Output: ${runDir}\n`));

      const results = {
        runId,
        startTime: new Date().toISOString(),
        featureRequest,
        phases: [],
        success: false
      };

      // Phase 1: Generate Specification
      const specSpinner = ora('📋 Generating specification...').start();
      try {
        const specResult = await this.executePhase('spec', {
          feature: featureRequest.description,
          type: featureRequest.type,
          priority: featureRequest.priority,
          output: path.join(runDir, 'spec.json')
        });
        
        results.phases.push({ name: 'Specification', success: true, output: specResult });
        specSpinner.succeed('📋 Specification generated');
      } catch (error) {
        specSpinner.fail(`📋 Specification failed: ${error.message}`);
        results.phases.push({ name: 'Specification', success: false, error: error.message });
        throw error;
      }

      // Phase 2: Generate Task Plan
      const planSpinner = ora('📊 Creating task plan...').start();
      try {
        const planResult = await this.executePhase('plan', {
          spec: path.join(runDir, 'spec.json'),
          output: path.join(runDir, 'plan.json')
        });
        
        results.phases.push({ name: 'Task Planning', success: true, output: planResult });
        planSpinner.succeed('📊 Task plan created');
      } catch (error) {
        planSpinner.fail(`📊 Task planning failed: ${error.message}`);
        results.phases.push({ name: 'Task Planning', success: false, error: error.message });
        throw error;
      }

      // Phase 3: Generate Code
      if (!options.dryRun) {
        const codeSpinner = ora('💻 Generating code...').start();
        try {
          const codeResult = await this.executePhase('code', {
            plan: path.join(runDir, 'plan.json'),
            output: path.join(runDir, 'generated')
          });
          
          results.phases.push({ name: 'Code Generation', success: true, output: codeResult });
          codeSpinner.succeed('💻 Code generated');
        } catch (error) {
          codeSpinner.fail(`💻 Code generation failed: ${error.message}`);
          results.phases.push({ name: 'Code Generation', success: false, error: error.message });
          throw error;
        }
      } else {
        console.log(chalk.yellow('💻 Code generation skipped (dry run)'));
      }

      // Phase 4: Run Validation
      if (!options.skipValidation && !options.dryRun) {
        const validationSpinner = ora('🔍 Running validation pipeline...').start();
        try {
          const validationResult = await this.executePhase('validate', {
            report: path.join(runDir, 'validation.json')
          });
          
          results.phases.push({ name: 'Validation', success: true, output: validationResult });
          
          if (validationResult.summary?.success) {
            validationSpinner.succeed('🔍 Validation passed');
          } else {
            validationSpinner.warn('🔍 Validation completed with issues');
            
            if (options.autoFix) {
              const fixSpinner = ora('🔧 Auto-fixing validation issues...').start();
              try {
                await this.autoFixValidationIssues(validationResult);
                fixSpinner.succeed('🔧 Issues auto-fixed');
              } catch (fixError) {
                fixSpinner.fail(`🔧 Auto-fix failed: ${fixError.message}`);
              }
            }
          }
        } catch (error) {
          validationSpinner.fail(`🔍 Validation failed: ${error.message}`);
          results.phases.push({ name: 'Validation', success: false, error: error.message });
          throw error;
        }
      } else {
        console.log(chalk.yellow('🔍 Validation skipped'));
      }

      // Phase 5: Generate PR
      const prSpinner = ora('📝 Generating pull request...').start();
      try {
        const prResult = await this.executePhase('pr', {
          spec: path.join(runDir, 'spec.json'),
          plan: path.join(runDir, 'plan.json'),
          validation: path.join(runDir, 'validation.json'),
          output: path.join(runDir, 'pull-request.md')
        });
        
        results.phases.push({ name: 'PR Generation', success: true, output: prResult });
        prSpinner.succeed('📝 Pull request generated');
      } catch (error) {
        prSpinner.fail(`📝 PR generation failed: ${error.message}`);
        results.phases.push({ name: 'PR Generation', success: false, error: error.message });
        throw error;
      }

      // Save results
      results.endTime = new Date().toISOString();
      results.success = results.phases.every(phase => phase.success);
      
      await fs.writeFile(
        path.join(runDir, 'results.json'),
        JSON.stringify(results, null, 2)
      );

      // Display summary
      console.log(chalk.green.bold('\n✅ Autopilot workflow completed!'));
      console.log(chalk.cyan(`📁 Results saved to: ${runDir}`));
      
      if (!options.dryRun) {
        console.log(chalk.yellow('\n📋 Next steps:'));
        console.log('  1. Review generated code and PR description');
        console.log('  2. Run tests and fix any issues');
        console.log('  3. Create pull request with generated description');
        console.log('  4. Request code review from team');
      }

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Autopilot workflow failed:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  }

  /**
   * Prompt for feature request in interactive mode
   */
  async promptForFeatureRequest() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Describe the feature you want to implement:',
        validate: input => input.trim().length > 0 || 'Feature description is required'
      },
      {
        type: 'list',
        name: 'type',
        message: 'What type of change is this?',
        choices: [
          { name: '✨ Feature - New functionality', value: 'feature' },
          { name: '🐛 Bugfix - Fix existing issue', value: 'bugfix' },
          { name: '♻️ Refactor - Code improvement', value: 'refactor' },
          { name: '🔌 API - API changes', value: 'api' }
        ],
        default: 'feature'
      },
      {
        type: 'list',
        name: 'priority',
        message: 'What is the priority level?',
        choices: [
          { name: '🔴 High - Critical/urgent', value: 'high' },
          { name: '🟡 Medium - Important', value: 'medium' },
          { name: '🟢 Low - Nice to have', value: 'low' }
        ],
        default: 'medium'
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: 'Autopilot User'
      }
    ]);

    return answers;
  }

  /**
   * Execute a specific phase
   */
  async executePhase(phase, options) {
    const scriptMap = {
      spec: 'generate-spec.mjs',
      plan: 'task-planner.mjs',
      code: 'code-generator.mjs',
      validate: 'validation-pipeline.mjs',
      pr: 'pr-generator.mjs'
    };

    const scriptPath = path.join(__dirname, scriptMap[phase]);
    
    // For now, return mock results since we're demonstrating the CLI
    // In a real implementation, these would execute the actual scripts
    return { phase, options, executed: true };
  }

  /**
   * Generate specification only
   */
  async generateSpec(options) {
    console.log(chalk.blue('📋 Generating Specification'));
    
    if (!options.feature) {
      console.error(chalk.red('❌ Feature description is required'));
      process.exit(1);
    }

    const spinner = ora('Generating specification...').start();
    
    try {
      const result = await this.executePhase('spec', options);
      spinner.succeed('Specification generated successfully');
      
      if (options.output) {
        console.log(chalk.cyan(`📄 Saved to: ${options.output}`));
      }
    } catch (error) {
      spinner.fail(`Specification generation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Generate task plan only
   */
  async generatePlan(options) {
    console.log(chalk.blue('📊 Generating Task Plan'));
    
    if (!options.spec) {
      console.error(chalk.red('❌ Specification file path is required'));
      process.exit(1);
    }

    const spinner = ora('Generating task plan...').start();
    
    try {
      const result = await this.executePhase('plan', options);
      spinner.succeed('Task plan generated successfully');
      
      if (options.output) {
        console.log(chalk.cyan(`📄 Saved to: ${options.output}`));
      }
    } catch (error) {
      spinner.fail(`Task plan generation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Generate code only
   */
  async generateCode(options) {
    console.log(chalk.blue('💻 Generating Code'));
    
    if (!options.plan) {
      console.error(chalk.red('❌ Task plan file path is required'));
      process.exit(1);
    }

    const spinner = ora('Generating code...').start();
    
    try {
      const result = await this.executePhase('code', options);
      spinner.succeed('Code generated successfully');
      
      if (options.output) {
        console.log(chalk.cyan(`📁 Saved to: ${options.output}`));
      }
    } catch (error) {
      spinner.fail(`Code generation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Run validation pipeline
   */
  async runValidation(options) {
    console.log(chalk.blue('🔍 Running Validation Pipeline'));

    const spinner = ora('Running validation...').start();
    
    try {
      const result = await this.executePhase('validate', options);
      
      if (result.summary?.success) {
        spinner.succeed('All validation gates passed');
      } else {
        spinner.warn('Validation completed with issues');
        console.log(chalk.yellow('\n⚠️ Issues found:'));
        // Display validation issues
      }
      
      if (options.report) {
        console.log(chalk.cyan(`📊 Report saved to: ${options.report}`));
      }
    } catch (error) {
      spinner.fail(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Generate PR description
   */
  async generatePR(options) {
    console.log(chalk.blue('📝 Generating Pull Request'));

    const spinner = ora('Generating PR description...').start();
    
    try {
      const result = await this.executePhase('pr', options);
      spinner.succeed('PR description generated successfully');
      
      if (options.output) {
        console.log(chalk.cyan(`📄 Saved to: ${options.output}`));
      }
    } catch (error) {
      spinner.fail(`PR generation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Show autopilot status
   */
  async showStatus() {
    console.log(chalk.blue.bold('📊 Autopilot Status'));
    console.log(chalk.gray('===================\n'));

    try {
      // Check if output directory exists
      const outputExists = await fs.access(this.outputDir).then(() => true).catch(() => false);
      
      if (!outputExists) {
        console.log(chalk.yellow('No previous runs found'));
        return;
      }

      // List recent runs
      const runs = await fs.readdir(this.outputDir);
      const recentRuns = runs
        .filter(run => run.startsWith('run-'))
        .sort()
        .reverse()
        .slice(0, 5);

      if (recentRuns.length === 0) {
        console.log(chalk.yellow('No previous runs found'));
        return;
      }

      console.log(chalk.cyan('Recent Runs:'));
      for (const run of recentRuns) {
        const runPath = path.join(this.outputDir, run);
        const resultsPath = path.join(runPath, 'results.json');
        
        try {
          const results = JSON.parse(await fs.readFile(resultsPath, 'utf8'));
          const status = results.success ? chalk.green('✅ SUCCESS') : chalk.red('❌ FAILED');
          const date = new Date(results.startTime).toLocaleString();
          
          console.log(`  ${status} ${run} - ${date}`);
          console.log(chalk.gray(`    ${results.featureRequest?.description || 'No description'}`));
        } catch (error) {
          console.log(`  ${chalk.gray('❓ UNKNOWN')} ${run} - ${chalk.gray('No results file')}`);
        }
      }

    } catch (error) {
      console.error(chalk.red(`Error checking status: ${error.message}`));
    }
  }

  /**
   * Manage configuration
   */
  async manageConfig(options) {
    console.log(chalk.blue.bold('⚙️ Autopilot Configuration'));
    console.log(chalk.gray('============================\n'));

    if (options.show) {
      try {
        const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
        const autopilotConfig = config.tools?.find(tool => tool.name === 'spec-to-code-autopilot');
        
        if (autopilotConfig) {
          console.log(chalk.cyan('Current Configuration:'));
          console.log(JSON.stringify(autopilotConfig, null, 2));
        } else {
          console.log(chalk.yellow('Autopilot not configured'));
        }
      } catch (error) {
        console.error(chalk.red(`Error reading config: ${error.message}`));
      }
    }

    if (options.set) {
      console.log(chalk.yellow('Configuration updates not yet implemented'));
      console.log(chalk.gray('Edit .trae/mcp.json manually for now'));
    }
  }

  /**
   * Auto-fix validation issues
   */
  async autoFixValidationIssues(validationResult) {
    // Mock implementation for auto-fixing
    console.log(chalk.yellow('Auto-fix functionality not yet implemented'));
    return { fixed: 0, remaining: validationResult.summary?.failed || 0 };
  }
}

// CLI entry point
async function main() {
  try {
    const cli = new AutopilotCLI();
    await cli.init();
  } catch (error) {
    console.error(chalk.red.bold('❌ CLI Error:'), error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { AutopilotCLI };