#!/usr/bin/env node

/**
 * Pre-commit hook to detect potential secrets in staged files
 * Usage: node scripts/check-secrets.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Patterns that might indicate secrets
const SECRET_PATTERNS = [
  /VITE_GEMINI_API_KEY\s*=\s*[A-Za-z0-9_-]{20,}/,
  /GOOGLE_API_KEY\s*=\s*[A-Za-z0-9_-]{20,}/,
  /VITE_SUPABASE_ANON_KEY\s*=\s*[A-Za-z0-9_-]{20,}/,
  /sk-[A-Za-z0-9_-]{20,}/, // OpenAI API keys
  /AIza[A-Za-z0-9_-]{35}/, // Google API keys
  /ya29\.[A-Za-z0-9_-]+/, // Google OAuth tokens
  /AKIA[A-Z0-9]{16}/, // AWS Access Keys
  /-----BEGIN [A-Z ]+-----/, // Private keys
];

// File extensions to check
const EXTENSIONS_TO_CHECK = ['.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.yml', '.yaml'];

// Files to always ignore
const IGNORE_FILES = [
  '.env.example',
  'package-lock.json',
  'yarn.lock',
  'check-secrets.mjs'
];

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    console.log('No staged files found or not in a git repository');
    return [];
  }
}

function shouldCheckFile(filePath) {
  // Skip if file doesn't exist
  if (!fs.existsSync(filePath)) return false;
  
  // Skip ignored files
  const fileName = path.basename(filePath);
  if (IGNORE_FILES.includes(fileName)) return false;
  
  // Skip node_modules and other directories
  if (filePath.includes('node_modules/') || 
      filePath.includes('.git/') || 
      filePath.includes('dist/') ||
      filePath.includes('.venv/')) {
    return false;
  }
  
  // Check extension
  const ext = path.extname(filePath);
  return EXTENSIONS_TO_CHECK.includes(ext);
}

function checkFileForSecrets(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];
  
  lines.forEach((line, index) => {
    SECRET_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          pattern: pattern.toString()
        });
      }
    });
  });
  
  return violations;
}

function main() {
  console.log('🔍 Checking for potential secrets in staged files...\n');
  
  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('No staged files to check.');
    return;
  }
  
  const filesToCheck = stagedFiles.filter(shouldCheckFile);
  
  if (filesToCheck.length === 0) {
    console.log('No relevant files to check for secrets.');
    return;
  }
  
  console.log(`Checking ${filesToCheck.length} files...`);
  
  let totalViolations = 0;
  
  filesToCheck.forEach(file => {
    const violations = checkFileForSecrets(file);
    
    if (violations.length > 0) {
      console.log(`\n❌ Potential secrets found in ${file}:`);
      violations.forEach(violation => {
        console.log(`   Line ${violation.line}: ${violation.content}`);
        totalViolations++;
      });
    }
  });
  
  if (totalViolations > 0) {
    console.log(`\n🚨 Found ${totalViolations} potential secret(s)!`);
    console.log('\nPlease review these findings:');
    console.log('• Remove any actual secrets from the code');
    console.log('• Use environment variables instead');
    console.log('• Add sensitive files to .gitignore');
    console.log('• Consider using .env.example for documentation');
    console.log('\nIf these are false positives, you can:');
    console.log('• Add the file to IGNORE_FILES in check-secrets.mjs');
    console.log('• Modify the patterns if needed');
    
    process.exit(1);
  } else {
    console.log('\n✅ No secrets detected in staged files.');
  }
}

main();