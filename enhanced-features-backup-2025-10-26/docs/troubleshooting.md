# Troubleshooting Guide

Common issues and solutions for the Spec-to-Code Autopilot system.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Configuration Problems](#configuration-problems)
3. [ESLint & TypeScript Issues](#eslint--typescript-issues)
4. [Specification Generation](#specification-generation)
5. [Code Generation Issues](#code-generation-issues)
6. [Validation Pipeline](#validation-pipeline)
7. [PR Generation](#pr-generation)
8. [IDE Integration](#ide-integration)
9. [Performance Issues](#performance-issues)
10. [Error Reference](#error-reference)
11. [Getting Help](#getting-help)

## Installation Issues

### Node.js Version Compatibility

**Problem**: Script fails with syntax errors or module import issues.

**Symptoms**:
```
SyntaxError: Cannot use import statement outside a module
```

**Solution**:
1. Ensure Node.js version 16+ is installed:
   ```bash
   node --version
   ```
2. Check that files use `.mjs` extension for ES modules
3. Verify `package.json` has `"type": "module"`

### Missing Dependencies

**Problem**: Import errors for required modules.

**Symptoms**:
```
Error: Cannot find module 'fs/promises'
Module not found: 'path'
```

**Solution**:
1. Install missing dependencies:
   ```bash
   npm install
   ```
2. For built-in modules, ensure Node.js is up to date
3. Check import paths are correct

### Permission Issues

**Problem**: Cannot create files or directories.

**Symptoms**:
```
Error: EACCES: permission denied, mkdir '.autopilot'
```

**Solution**:
1. **Windows**: Run terminal as administrator
2. **macOS/Linux**: Check directory permissions:
   ```bash
   chmod 755 .
   ```
3. Ensure output directory is writable

## Configuration Problems

### Invalid Configuration File

**Problem**: Configuration file has syntax errors.

**Symptoms**:
```
SyntaxError: Unexpected token in JSON
Configuration validation failed
```

**Solution**:
1. Validate JSON syntax:
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('.autopilot.config.json')))"
   ```
2. Use configuration schema for validation
3. Reset to defaults:
   ```bash
   node scripts/autopilot-cli.mjs config reset
   ```

### Missing Configuration Values

**Problem**: Required configuration values are missing.

**Symptoms**:
```
Error: Missing required configuration: outputDir
```

**Solution**:
1. Check configuration file exists:
   ```bash
   ls -la .autopilot.config.json
   ```
2. Set missing values:
   ```bash
   node scripts/autopilot-cli.mjs config set outputDir .autopilot
   ```
3. Use interactive setup:
   ```bash
   node scripts/autopilot-cli.mjs run --interactive
   ```

### Template Directory Not Found

**Problem**: Cannot find template files.

**Symptoms**:
```
Error: Template directory not found: templates
```

**Solution**:
1. Verify templates directory exists:
   ```bash
   ls -la templates/
   ```
2. Set correct template path:
   ```bash
   node scripts/autopilot-cli.mjs config set templatesDir ./templates
   ```
3. Copy templates from examples:
   ```bash
   cp -r examples/templates ./templates
   ```

## ESLint & TypeScript Issues

### ESLint Parsing Error: Cannot read file tsconfig.json

**Problem**: ESLint throws parsing errors when trying to read TypeScript configuration.

**Symptoms**:
```
Parsing error: Cannot read file 'tsconfig.json'
Error: Cannot resolve path to parser
```

**Solution**:
1. Ensure `parserOptions.project` points to the correct path:
   ```javascript
   parserOptions: {
     project: ["./tsconfig.json"], // or ["./tsconfig.json", "./tsconfig.server.json"]
     tsconfigRootDir: __dirname,
   }
   ```
2. Verify `tsconfigRootDir` is set to `__dirname` in `.eslintrc.cjs`
3. Check that `tsconfig.json` exists and is valid:
   ```bash
   npx tsc --noEmit --project ./tsconfig.json
   ```

### ESLint Performance Issues with Type-Aware Rules

**Problem**: ESLint runs very slowly with type-aware rules enabled.

**Symptoms**:
- Linting takes several minutes
- High CPU usage during ESLint execution
- IDE becomes unresponsive

**Solution**:
1. **Temporary fix**: Remove type-aware rules from `extends`:
   ```javascript
   extends: [
     "eslint:recommended",
     "plugin:@typescript-eslint/recommended",
     // "plugin:@typescript-eslint/recommended-requiring-type-checking", // Comment out temporarily
   ]
   ```
2. **Performance optimization**: Use project references in `tsconfig.json`:
   ```json
   {
     "compilerOptions": { "incremental": true },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```
3. **Selective enabling**: Enable type-aware rules only for specific files:
   ```javascript
   overrides: [
     {
       files: ["src/**/*.ts", "src/**/*.tsx"],
       extends: ["plugin:@typescript-eslint/recommended-requiring-type-checking"]
     }
   ]
   ```

### Import Paths with @/* Fail in ESLint

**Problem**: ESLint cannot resolve TypeScript path aliases like `@/components`.

**Symptoms**:
```
Unable to resolve path to module '@/components/Button'
Import/no-unresolved error for @/* paths
```

**Solution**:
1. Install and configure `eslint-import-resolver-typescript`:
   ```bash
   npm install --save-dev eslint-import-resolver-typescript
   ```
2. Add to ESLint settings:
   ```javascript
   settings: {
     "import/resolver": {
       typescript: {
         alwaysTryTypes: true,
         project: "./"
       }
     }
   }
   ```
3. Ensure `tsconfig.json` has correct path mapping:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"]
       }
     }
   }
   ```

### Vite or Jest Conflicts with moduleResolution

**Problem**: Different tools require different module resolution strategies.

**Symptoms**:
```
Module not found: Can't resolve '@/components'
Jest cannot find module from path mapping
```

**Solution**:
1. **For Node.js tooling** that doesn't support "Bundler", use "NodeNext":
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "moduleResolution": "NodeNext"
     }
   }
   ```
2. **Keep Vite config aligned** with TypeScript paths:
   ```javascript
   // vite.config.ts
   export default defineConfig({
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src')
       }
     }
   })
   ```
3. **For Jest**, add module name mapping:
   ```javascript
   // jest.config.cjs
   module.exports = {
     moduleNameMapping: {
       '^@/(.*)$': '<rootDir>/src/$1'
     }
   }
   ```

### TypeScript Strict Mode Errors

**Problem**: Enabling strict TypeScript checking reveals many errors.

**Symptoms**:
```
Object is possibly 'undefined'
Argument of type 'unknown' is not assignable
Property does not exist on type '{}'
```

**Solution**:
1. **Gradual migration**: Enable strict checks one by one:
   ```json
   {
     "compilerOptions": {
       "strict": false,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```
2. **Use type guards** for undefined checks:
   ```typescript
   if (value && value.property) {
     // Safe to access value.property
   }
   ```
3. **Add proper type annotations**:
   ```typescript
   const data: ApiResponse = await fetchData();
   ```

### Quick Checks to Avoid Common Pitfalls

**Run this diagnostic sequence when setting up or troubleshooting:**

1. **Verify ESLint configuration**:
   ```bash
   npx eslint --print-config src/App.tsx
   ```

2. **Test TypeScript compilation**:
   ```bash
   npm run typecheck
   ```

3. **Run the complete workflow**:
   ```bash
   npm run fix
   npm run typecheck  
   npm run lint
   ```

4. **Check for conflicting configurations**:
   - Ensure only one ESLint config file exists
   - Verify TypeScript paths match in all config files
   - Check that all tools use the same module resolution

**Address any remaining TypeScript errors before committing** to maintain code quality and prevent CI failures.

## Specification Generation

### Feature Description Too Vague

**Problem**: Generated specification lacks detail.

**Symptoms**:
- Generic acceptance criteria
- Missing technical requirements
- Incomplete user stories

**Solution**:
1. Provide more detailed feature description:
   ```bash
   # Instead of: "Add login"
   # Use: "Add user authentication with email/password, remember me option, and password reset functionality"
   ```
2. Include specific requirements:
   - User interface requirements
   - Business logic details
   - Integration points
3. Use interactive mode for guided input

### Specification Validation Fails

**Problem**: Generated specification doesn't pass validation.

**Symptoms**:
```
Specification validation failed: Missing required field 'acceptanceCriteria'
```

**Solution**:
1. Check specification schema:
   ```bash
   node -e "console.log(require('./schemas/specification-schema.json'))"
   ```
2. Manually edit specification file
3. Re-run specification generation with more details

### Template Processing Errors

**Problem**: Template variables not replaced correctly.

**Symptoms**:
```
Template error: Variable 'userStory' not found
```

**Solution**:
1. Check template syntax:
   ```bash
   cat templates/feature-spec-template.md
   ```
2. Verify variable names match schema
3. Update template with correct variables

## Code Generation Issues

### Pattern Enforcement Failures

**Problem**: Generated code doesn't follow project patterns.

**Symptoms**:
- Inconsistent file structure
- Wrong naming conventions
- Missing imports

**Solution**:
1. Update pattern configuration:
   ```json
   {
     "codeGeneration": {
       "enforcePatterns": true,
       "patterns": {
         "fileNaming": "kebab-case",
         "componentStructure": "functional"
       }
     }
   }
   ```
2. Provide pattern examples in templates
3. Review and update generated code manually

### Missing Dependencies

**Problem**: Generated code has import errors.

**Symptoms**:
```
Module not found: './components/Button'
Cannot resolve dependency: 'react-router-dom'
```

**Solution**:
1. Install missing packages:
   ```bash
   npm install react-router-dom
   ```
2. Update import paths in generated code
3. Check project structure matches expectations

### File Conflicts

**Problem**: Generated files conflict with existing files.

**Symptoms**:
```
Error: File already exists: src/components/Button.tsx
```

**Solution**:
1. Use dry-run mode first:
   ```bash
   node scripts/autopilot-cli.mjs code --plan plan.json --dry-run
   ```
2. Review file impact analysis
3. Backup existing files before generation
4. Merge changes manually if needed

## Validation Pipeline

### Gate Execution Failures

**Problem**: Validation gates fail to execute.

**Symptoms**:
```
Gate 'lint' failed: Command not found: eslint
Gate 'test' timed out after 300000ms
```

**Solution**:
1. Install missing tools:
   ```bash
   npm install -g eslint
   npm install --save-dev jest
   ```
2. Check command paths:
   ```bash
   which eslint
   npm run lint --dry-run
   ```
3. Increase timeout for slow gates:
   ```json
   {
     "gates": {
       "test": {
         "timeout": 600000
       }
     }
   }
   ```

### Critical Gate Failures

**Problem**: Critical validation gates fail, blocking workflow.

**Symptoms**:
```
Critical gate 'build' failed with exit code 1
Workflow stopped due to critical failures
```

**Solution**:
1. Review gate output:
   ```bash
   cat .autopilot/validation/results.json
   ```
2. Fix underlying issues:
   - Compilation errors
   - Test failures
   - Linting issues
3. Re-run validation:
   ```bash
   node scripts/autopilot-cli.mjs validate
   ```

### Parallel Execution Issues

**Problem**: Gates interfere with each other when run in parallel.

**Symptoms**:
- Port conflicts
- File locking issues
- Resource contention

**Solution**:
1. Disable parallel execution:
   ```json
   {
     "validation": {
       "enableParallel": false
     }
   }
   ```
2. Configure gate isolation:
   ```json
   {
     "gates": {
       "test": {
         "env": {
           "PORT": "3001"
         }
       }
     }
   }
   ```

## PR Generation

### Missing Metadata

**Problem**: PR generation fails due to missing input files.

**Symptoms**:
```
Error: Specification file not found: .autopilot/specifications/spec.json
```

**Solution**:
1. Ensure all workflow phases completed:
   ```bash
   ls -la .autopilot/
   ```
2. Run missing phases:
   ```bash
   node scripts/autopilot-cli.mjs spec --feature "Your feature"
   node scripts/autopilot-cli.mjs plan --spec .autopilot/specifications/spec.json
   ```
3. Check file paths in configuration

### Template Rendering Issues

**Problem**: PR template doesn't render correctly.

**Symptoms**:
- Missing sections
- Unresolved variables
- Formatting issues

**Solution**:
1. Check template file:
   ```bash
   cat templates/pr-templates/feature.md
   ```
2. Verify template variables:
   ```bash
   node -e "console.log(Object.keys(require('./.autopilot/pr-metadata.json')))"
   ```
3. Update template with correct syntax

### Validation Results Integration

**Problem**: Validation results not properly integrated into PR.

**Symptoms**:
- Missing test results
- Incorrect pass/fail counts
- No recommendations

**Solution**:
1. Check validation results format:
   ```bash
   cat .autopilot/validation/results.json
   ```
2. Ensure validation completed successfully
3. Update PR template to handle missing data

## IDE Integration

### VS Code Extension Issues

**Problem**: VS Code tasks or commands not working.

**Symptoms**:
- Tasks not appearing in command palette
- Keybindings not working
- Snippets not available

**Solution**:
1. Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Check extension installation:
   ```bash
   ls -la .vscode/
   ```
3. Verify task configuration:
   ```json
   // .vscode/tasks.json
   {
     "version": "2.0.0",
     "tasks": [
       {
         "label": "Autopilot: Run Workflow",
         "type": "shell",
         "command": "node scripts/autopilot-cli.mjs run --interactive"
       }
     ]
   }
   ```

### WebStorm/IntelliJ Issues

**Problem**: Run configurations not working.

**Symptoms**:
- Configurations not appearing
- Scripts fail to execute
- Wrong working directory

**Solution**:
1. Import run configurations:
   - File → Import Settings
   - Select `.idea/runConfigurations/`
2. Check Node.js interpreter:
   - File → Settings → Languages & Frameworks → Node.js
3. Verify working directory in run configuration

### Vim/Neovim Issues

**Problem**: Commands or mappings not working.

**Symptoms**:
- Key mappings not responding
- Commands not found
- Plugin conflicts

**Solution**:
1. Source configuration:
   ```vim
   :source ~/.vimrc
   " or for Neovim
   :source ~/.config/nvim/init.vim
   ```
2. Check plugin installation:
   ```vim
   :PluginList
   ```
3. Verify command definitions:
   ```vim
   :command
   ```

## Performance Issues

### Slow Specification Generation

**Problem**: Specification generation takes too long.

**Symptoms**:
- Process hangs for minutes
- High CPU usage
- Memory consumption

**Solution**:
1. Reduce feature description complexity
2. Use simpler templates
3. Check system resources:
   ```bash
   top
   htop
   ```

### Validation Pipeline Timeouts

**Problem**: Validation gates timeout frequently.

**Symptoms**:
```
Gate 'test' timed out after 300000ms
```

**Solution**:
1. Increase timeout values:
   ```json
   {
     "validation": {
       "timeout": 600000
     }
   }
   ```
2. Optimize test suites:
   - Run only relevant tests
   - Use test parallelization
   - Mock external dependencies
3. Use faster hardware or CI environment

### Large File Generation

**Problem**: Code generation creates very large files.

**Symptoms**:
- Files over 1000 lines
- Memory issues during generation
- Slow file operations

**Solution**:
1. Break down large features into smaller components
2. Use modular code generation
3. Implement file size limits:
   ```json
   {
     "codeGeneration": {
       "maxFileSize": 500,
       "splitLargeFiles": true
     }
   }
   ```

## Error Reference

### Common Error Codes

| Code | Error | Solution |
|------|-------|----------|
| E001 | Invalid configuration file | Check JSON syntax and schema |
| E002 | Missing required configuration | Set missing configuration values |
| E003 | Specification validation failed | Review and fix specification |
| E004 | Task planning failed | Check specification completeness |
| E005 | Code generation failed | Review plan and templates |
| E006 | Validation pipeline failed | Fix failing validation gates |
| E007 | PR generation failed | Check input files and templates |
| E008 | File operation failed | Check permissions and disk space |
| E009 | Template processing failed | Fix template syntax and variables |
| E010 | Network operation failed | Check internet connection |

### Debug Mode

Enable debug logging for detailed error information:

```bash
# Set environment variable
export AUTOPILOT_LOG_LEVEL=debug

# Or use CLI flag
node scripts/autopilot-cli.mjs run --debug --feature "Test feature"
```

### Log Files

Check log files for detailed error information:

```bash
# View recent logs
tail -f .autopilot/logs/autopilot.log

# Search for errors
grep -i error .autopilot/logs/autopilot.log

# View specific workflow logs
cat .autopilot/logs/workflow-$(date +%Y%m%d).log
```

## Getting Help

### Self-Diagnosis

Run the built-in diagnostic tool:

```bash
node scripts/autopilot-cli.mjs diagnose
```

This will check:
- Node.js version compatibility
- Required dependencies
- Configuration validity
- Template availability
- File permissions

### Verbose Output

Use verbose mode for detailed operation logs:

```bash
node scripts/autopilot-cli.mjs run --verbose --feature "Test feature"
```

### System Information

Gather system information for support:

```bash
# System info
node --version
npm --version
git --version

# Project info
cat package.json
ls -la .autopilot/

# Configuration
cat .autopilot.config.json
```

### Community Support

1. **GitHub Issues**: Report bugs and feature requests
2. **Documentation**: Check latest documentation
3. **Examples**: Review working examples
4. **Stack Overflow**: Search for similar issues

### Creating Bug Reports

Include the following information:

1. **Environment**:
   - Operating system
   - Node.js version
   - npm version

2. **Configuration**:
   - `.autopilot.config.json` (sanitized)
   - Relevant package.json sections

3. **Steps to Reproduce**:
   - Exact commands run
   - Input files used
   - Expected vs actual behavior

4. **Logs**:
   - Error messages
   - Debug output
   - Log files

5. **Files**:
   - Generated specifications
   - Implementation plans
   - Validation results

### Performance Profiling

Profile performance issues:

```bash
# CPU profiling
node --prof scripts/autopilot-cli.mjs run --feature "Test feature"
node --prof-process isolate-*.log > profile.txt

# Memory profiling
node --inspect scripts/autopilot-cli.mjs run --feature "Test feature"
# Open chrome://inspect in Chrome browser
```

---

This troubleshooting guide covers the most common issues you might encounter. If you can't find a solution here, please check the latest documentation or create a support request with detailed information about your issue.