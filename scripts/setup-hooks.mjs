#!/usr/bin/env node

/**
 * Setup script to install Git pre-commit hooks
 * Usage: node scripts/setup-hooks.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const gitHooksDir = path.join(projectRoot, '.git', 'hooks');
const preCommitHookPath = path.join(gitHooksDir, 'pre-commit');

const preCommitHookContent = `#!/bin/sh
#
# Pre-commit hook to check for secrets
# This hook was installed by scripts/setup-hooks.mjs
#

echo "🔍 Running pre-commit secret detection..."

# Run the secret detection script
npm run check-secrets

# If the script fails, prevent the commit
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Pre-commit hook failed!"
    echo "Please fix the issues above before committing."
    echo ""
    echo "To bypass this check (NOT RECOMMENDED):"
    echo "git commit --no-verify"
    echo ""
    exit 1
fi

echo "✅ Pre-commit checks passed!"
exit 0
`;

function setupPreCommitHook() {
    console.log('🔧 Setting up Git pre-commit hooks...\n');

    // Check if we're in a Git repository
    if (!fs.existsSync(path.join(projectRoot, '.git'))) {
        console.error('❌ Error: Not in a Git repository');
        console.log('Please run this script from the project root directory.');
        process.exit(1);
    }

    // Create hooks directory if it doesn't exist
    if (!fs.existsSync(gitHooksDir)) {
        fs.mkdirSync(gitHooksDir, { recursive: true });
        console.log('📁 Created .git/hooks directory');
    }

    // Check if pre-commit hook already exists
    if (fs.existsSync(preCommitHookPath)) {
        const existingContent = fs.readFileSync(preCommitHookPath, 'utf8');
        if (existingContent.includes('check-secrets')) {
            console.log('✅ Pre-commit hook already exists and includes secret detection');
            return;
        } else {
            console.log('⚠️  Pre-commit hook exists but doesn\'t include secret detection');
            console.log('Creating backup...');
            fs.copyFileSync(preCommitHookPath, preCommitHookPath + '.backup');
            console.log('📄 Backup created: .git/hooks/pre-commit.backup');
        }
    }

    // Write the pre-commit hook
    fs.writeFileSync(preCommitHookPath, preCommitHookContent);
    
    // Make it executable (on Unix-like systems)
    try {
        fs.chmodSync(preCommitHookPath, 0o755);
        console.log('🔐 Made pre-commit hook executable');
    } catch (error) {
        console.log('⚠️  Could not make hook executable (Windows system)');
        console.log('The hook should still work on Windows');
    }

    console.log('✅ Pre-commit hook installed successfully!');
    console.log('');
    console.log('The hook will now run automatically before each commit to check for secrets.');
    console.log('');
    console.log('To test the hook manually:');
    console.log('  npm run check-secrets');
    console.log('');
    console.log('To bypass the hook (NOT RECOMMENDED):');
    console.log('  git commit --no-verify');
}

function main() {
    try {
        setupPreCommitHook();
    } catch (error) {
        console.error('❌ Error setting up pre-commit hook:', error.message);
        process.exit(1);
    }
}

main();