#!/usr/bin/env node

import { AxePuppeteer } from '@axe-core/puppeteer';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const APP_URL = 'http://localhost:8085';
const REPORT_PATH = '.reports/axe-a11y.json';

async function runA11yTests() {
  console.log('🔍 Starting accessibility tests with axe-core...');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent testing
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log(`📱 Navigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    
    // Wait for React app to load
    await page.waitForSelector('[data-testid="app"], #root', { timeout: 10000 });
    
    console.log('🧪 Running axe-core accessibility analysis...');
    
    // Run axe analysis
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    // Process results
    const summary = {
      url: APP_URL,
      timestamp: new Date().toISOString(),
      violations: results.violations.length,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length,
      details: {
        violations: results.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.length,
          tags: violation.tags
        })),
        incomplete: results.incomplete.map(item => ({
          id: item.id,
          impact: item.impact,
          description: item.description,
          nodes: item.nodes.length
        }))
      }
    };
    
    // Ensure reports directory exists
    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
    
    // Save detailed report
    await fs.writeFile(REPORT_PATH, JSON.stringify(summary, null, 2));
    
    // Console output
    console.log('\n📊 Accessibility Test Results:');
    console.log(`✅ Passes: ${summary.passes}`);
    console.log(`❌ Violations: ${summary.violations}`);
    console.log(`⚠️  Incomplete: ${summary.incomplete}`);
    console.log(`ℹ️  Inapplicable: ${summary.inapplicable}`);
    
    if (summary.violations > 0) {
      console.log('\n🚨 Accessibility Violations Found:');
      summary.details.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id} (${violation.impact})`);
        console.log(`   ${violation.description}`);
        console.log(`   Affected nodes: ${violation.nodes}`);
        console.log(`   Help: ${violation.helpUrl}\n`);
      });
    }
    
    console.log(`📄 Detailed report saved to: ${REPORT_PATH}`);
    
    // Exit with error code if violations found
    if (summary.violations > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Accessibility test failed:', error.message);
    
    // Save error report
    const errorReport = {
      error: true,
      message: error.message,
      timestamp: new Date().toISOString(),
      url: APP_URL
    };
    
    try {
      await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
      await fs.writeFile(REPORT_PATH, JSON.stringify(errorReport, null, 2));
    } catch (writeError) {
      console.error('Failed to write error report:', writeError.message);
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Accessibility test interrupted');
  process.exit(1);
});

// Run the tests
runA11yTests();