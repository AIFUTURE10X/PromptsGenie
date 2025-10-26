#!/usr/bin/env node

/**
 * Conventional Commits Validation Script
 * Enforces conventional commit format for release discipline
 */

import { execSync } from 'child_process';

const CONVENTIONAL_COMMIT_REGEX = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?: .{1,50}/;

const COMMIT_TYPES = {
  feat: 'A new feature',
  fix: 'A bug fix',
  docs: 'Documentation only changes',
  style: 'Changes that do not affect the meaning of the code',
  refactor: 'A code change that neither fixes a bug nor adds a feature',
  perf: 'A code change that improves performance',
  test: 'Adding missing tests or correcting existing tests',
  chore: 'Changes to the build process or auxiliary tools',
  ci: 'Changes to CI configuration files and scripts',
  build: 'Changes that affect the build system or external dependencies',
  revert: 'Reverts a previous commit'
};

class CommitValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
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

  validateCommitMessage(message) {
    const trimmed = message.trim();
    
    if (!CONVENTIONAL_COMMIT_REGEX.test(trimmed)) {
      return {
        valid: false,
        error: 'Commit message does not follow conventional commit format'
      };
    }

    const [, type, scope, description] = trimmed.match(/^(\w+)(\(.+\))?: (.+)/) || [];
    
    if (!COMMIT_TYPES[type]) {
      return {
        valid: false,
        error: `Invalid commit type: ${type}. Valid types: ${Object.keys(COMMIT_TYPES).join(', ')}`
      };
    }

    if (description && description.length > 50) {
      return {
        valid: false,
        error: 'Commit description should be 50 characters or less'
      };
    }

    if (description && description.endsWith('.')) {
      return {
        valid: false,
        error: 'Commit description should not end with a period'
      };
    }

    if (description && description[0] !== description[0].toLowerCase()) {
      return {
        valid: false,
        error: 'Commit description should start with lowercase letter'
      };
    }

    return { valid: true };
  }

  validateRecentCommits(count = 10) {
    try {
      const commits = execSync(`git log --oneline -${count} --pretty=format:"%s"`, { 
        encoding: 'utf8' 
      }).split('\n').filter(Boolean);

      this.log(`🔍 Validating last ${commits.length} commits...`);

      let validCount = 0;
      commits.forEach((commit, index) => {
        const result = this.validateCommitMessage(commit);
        if (result.valid) {
          validCount++;
          this.log(`✅ Commit ${index + 1}: ${commit.substring(0, 60)}...`, 'success');
        } else {
          this.errors.push(`Commit ${index + 1}: ${result.error}`);
          this.log(`❌ Commit ${index + 1}: ${result.error}`, 'error');
          this.log(`   Message: ${commit}`, 'error');
        }
      });

      return {
        total: commits.length,
        valid: validCount,
        invalid: commits.length - validCount
      };
    } catch (error) {
      this.errors.push(`Failed to get commit history: ${error.message}`);
      return { total: 0, valid: 0, invalid: 0 };
    }
  }

  async validateCurrentCommit() {
    try {
      // Check if there's a commit message file (for git hooks)
      const commitMsgFile = process.env.GIT_COMMIT_MSG_FILE;
      if (commitMsgFile) {
        const fs = await import('fs');
        const message = fs.readFileSync(commitMsgFile, 'utf8');
        return this.validateCommitMessage(message);
      }

      // Fallback to last commit
      const lastCommit = execSync('git log -1 --pretty=format:"%s"', { 
        encoding: 'utf8' 
      });
      return this.validateCommitMessage(lastCommit);
    } catch (error) {
      this.errors.push(`Failed to get current commit: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }

  printUsageGuide() {
    this.log('\n📝 Conventional Commit Format Guide:', 'info');
    this.log('='.repeat(40));
    this.log('Format: <type>[optional scope]: <description>');
    this.log('');
    this.log('Valid types:', 'info');
    Object.entries(COMMIT_TYPES).forEach(([type, description]) => {
      this.log(`  ${type.padEnd(10)} - ${description}`);
    });
    this.log('');
    this.log('Examples:', 'success');
    this.log('  feat: add user authentication');
    this.log('  fix(api): resolve timeout issue');
    this.log('  docs: update installation guide');
    this.log('  test: add unit tests for utils');
  }

  printSummary(stats) {
    this.log('\n📊 Commit Validation Summary', 'info');
    this.log('='.repeat(30));
    this.log(`Total commits checked: ${stats.total}`);
    this.log(`Valid commits: ${stats.valid}`, 'success');
    this.log(`Invalid commits: ${stats.invalid}`, stats.invalid > 0 ? 'error' : 'success');

    if (this.errors.length > 0) {
      this.log('\n❌ Validation Errors:', 'error');
      this.errors.forEach(error => this.log(`  • ${error}`, 'error'));
    }

    if (this.warnings.length > 0) {
      this.log('\n⚠️  Warnings:', 'warning');
      this.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
    }

    const success = this.errors.length === 0;
    this.log(`\n🎯 Validation Status: ${success ? 'PASSED' : 'FAILED'}`, 
             success ? 'success' : 'error');

    return success;
  }

  async run(options = {}) {
    const { count = 10, showGuide = false } = options;

    this.log('🚀 Starting Conventional Commits Validation', 'info');
    
    if (showGuide) {
      this.printUsageGuide();
    }

    const stats = this.validateRecentCommits(count);
    return this.printSummary(stats);
  }
}

// CLI handling
const args = process.argv.slice(2);
const options = {
  count: parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 10,
  showGuide: args.includes('--guide')
};

const validator = new CommitValidator();
const success = await validator.run(options);
process.exit(success ? 0 : 1);

export default CommitValidator;