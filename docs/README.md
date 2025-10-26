# Spec-to-Code Autopilot Documentation

Welcome to the comprehensive documentation for the **Spec-to-Code Autopilot** system - an intelligent automation pipeline that transforms feature requests into production-ready code with pull requests.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [System Architecture](#system-architecture)
4. [Components](#components)
5. [CLI Reference](#cli-reference)
6. [IDE Integration](#ide-integration)
7. [Configuration](#configuration)
8. [Examples](#examples)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

## Overview

The Spec-to-Code Autopilot is a comprehensive automation system that:

- **Generates Specifications**: Converts feature requests into detailed technical specifications
- **Plans Implementation**: Creates task breakdowns with file impact analysis
- **Generates Code**: Produces production-ready code following project patterns
- **Validates Quality**: Runs comprehensive quality gates and security checks
- **Creates Pull Requests**: Generates detailed PR descriptions with validation results

### Key Features

- 🤖 **AI-Powered**: Uses advanced language models for intelligent code generation
- 📋 **Structured Workflow**: Five-phase pipeline from spec to PR
- 🔍 **Quality Assurance**: Built-in validation and testing pipeline
- 🎯 **Pattern Enforcement**: Maintains consistency with existing codebase
- 🔧 **IDE Integration**: Works with VS Code, WebStorm, Vim, Emacs, and Sublime Text
- 📊 **Detailed Reporting**: Comprehensive JSON and HTML reports

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Git repository initialized
- Project dependencies installed

### Installation

1. Clone or download the autopilot scripts to your project
2. Install dependencies:
   ```bash
   npm install chalk inquirer
   ```

### Basic Usage

1. **Run the complete workflow**:
   ```bash
   node scripts/autopilot-cli.mjs run --interactive
   ```

2. **Generate a specification only**:
   ```bash
   node scripts/autopilot-cli.mjs spec --feature "Add user authentication"
   ```

3. **Check status**:
   ```bash
   node scripts/autopilot-cli.mjs status
   ```

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Feature       │    │  Specification  │    │  Task Planning  │
│   Request       │───▶│   Generation    │───▶│     Engine      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Pull Request   │    │   Validation    │    │      Code       │
│   Generation    │◀───│    Pipeline     │◀───│   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Workflow Phases

1. **Specification Generation**: Analyzes feature requests and creates detailed specs
2. **Task Planning**: Breaks down implementation into tasks with file impact analysis
3. **Code Generation**: Creates code files following project patterns
4. **Validation Pipeline**: Runs quality gates, tests, and security checks
5. **PR Generation**: Creates pull request with comprehensive documentation

## Components

### Core Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `autopilot-cli.mjs` | Main CLI interface | `scripts/` |
| `generate-spec.mjs` | Specification generation | `scripts/` |
| `task-planner.mjs` | Implementation planning | `scripts/` |
| `code-generator.mjs` | Code generation engine | `scripts/` |
| `validation-pipeline.mjs` | Quality assurance | `scripts/` |
| `pr-generator.mjs` | Pull request creation | `scripts/` |

### Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `spec-validation.json` | Spec validation schema | `schemas/` |
| `feature-spec-template.md` | Specification template | `templates/` |
| `task-plan-template.md` | Task planning template | `templates/` |

### IDE Integrations

| IDE | Features | Location |
|-----|----------|----------|
| VS Code | Tasks, keybindings, snippets | `.ide-integrations/vscode/` |
| WebStorm | External tools, live templates | `.ide-integrations/webstorm/` |
| Vim/Neovim | Commands, mappings, snippets | `.ide-integrations/vim/` |
| Emacs | Functions, keybindings, menu | `.ide-integrations/emacs/` |
| Sublime Text | Commands, keybindings, snippets | `.ide-integrations/sublime/` |

## CLI Reference

### Commands

#### `run` - Execute Complete Workflow
```bash
node scripts/autopilot-cli.mjs run [options]
```

**Options:**
- `--feature <description>`: Feature description
- `--type <type>`: Feature type (feature, bugfix, refactor, api)
- `--priority <priority>`: Priority level (low, medium, high)
- `--author <name>`: Author name
- `--interactive`: Interactive mode with prompts
- `--dry-run`: Show what would be done without executing

**Examples:**
```bash
# Interactive mode
node scripts/autopilot-cli.mjs run --interactive

# Direct execution
node scripts/autopilot-cli.mjs run --feature "Add dark mode toggle" --type feature --priority medium

# Dry run
node scripts/autopilot-cli.mjs run --feature "User authentication" --dry-run
```

#### `spec` - Generate Specification
```bash
node scripts/autopilot-cli.mjs spec [options]
```

**Options:**
- `--feature <description>`: Feature description (required)
- `--type <type>`: Feature type
- `--priority <priority>`: Priority level
- `--author <name>`: Author name

#### `plan` - Create Implementation Plan
```bash
node scripts/autopilot-cli.mjs plan [options]
```

**Options:**
- `--spec <path>`: Path to specification file
- `--include-tests`: Include test generation
- `--include-docs`: Include documentation
- `--risk-level <level>`: Risk assessment level

#### `code` - Generate Code
```bash
node scripts/autopilot-cli.mjs code [options]
```

**Options:**
- `--plan <path>`: Path to implementation plan
- `--output <dir>`: Output directory
- `--dry-run`: Show generated code without writing files

#### `validate` - Run Validation Pipeline
```bash
node scripts/autopilot-cli.mjs validate [options]
```

**Options:**
- `--config <path>`: Validation configuration file
- `--gates <list>`: Specific gates to run (comma-separated)
- `--parallel`: Run gates in parallel

#### `pr` - Generate Pull Request
```bash
node scripts/autopilot-cli.mjs pr [options]
```

**Options:**
- `--spec <path>`: Specification file
- `--plan <path>`: Implementation plan
- `--validation <path>`: Validation results
- `--template <type>`: PR template type

#### `status` - Show Status
```bash
node scripts/autopilot-cli.mjs status [options]
```

**Options:**
- `--detailed`: Show detailed information
- `--json`: Output in JSON format

#### `config` - Manage Configuration
```bash
node scripts/autopilot-cli.mjs config [action] [options]
```

**Actions:**
- `show`: Display current configuration
- `set <key> <value>`: Set configuration value
- `reset`: Reset to defaults

### Global Options

- `--help, -h`: Show help information
- `--version, -v`: Show version information
- `--verbose`: Enable verbose logging
- `--quiet`: Suppress non-essential output

## IDE Integration

### VS Code

**Installation:**
1. Run the installer:
   ```bash
   cd .ide-integrations/vscode
   ./install.sh  # Linux/Mac
   install.bat   # Windows
   ```

**Usage:**
- **Command Palette**: Search for "Autopilot" commands
- **Keybindings**:
  - `Ctrl+Shift+A, Ctrl+Shift+R`: Run workflow
  - `Ctrl+Shift+A, Ctrl+Shift+S`: Generate spec
  - `Ctrl+Shift+A, Ctrl+Shift+V`: Run validation
- **Snippets**: Type `autopilot-feature` for feature request template

### WebStorm/IntelliJ

**Installation:**
1. Go to **File → Settings → Tools → External Tools**
2. Import `tools.xml`
3. Go to **File → Settings → Editor → Live Templates**
4. Import `live-templates.xml`

**Usage:**
- **Tools Menu**: Find Autopilot commands under Tools
- **Live Templates**: Type `autopilot-feature` and press Tab

### Vim/Neovim

**Installation:**
Add to your `.vimrc` or `init.vim`:
```vim
source /path/to/.ide-integrations/vim/autopilot.vim
```

**Usage:**
- **Commands**: `:AutopilotRun`, `:AutopilotSpec`, `:AutopilotValidate`
- **Mappings**: `<leader>ar`, `<leader>as`, `<leader>av`, `<leader>at`

### Emacs

**Installation:**
Add to your `init.el`:
```elisp
(load-file "/path/to/.ide-integrations/emacs/autopilot.el")
```

**Usage:**
- **Functions**: `M-x autopilot-run-workflow`
- **Keybindings**: `C-c a r`, `C-c a s`, `C-c a v`, `C-c a t`
- **Menu**: Tools → Autopilot

### Sublime Text

**Installation:**
Copy files to your Sublime Text Packages/User directory

**Usage:**
- **Command Palette**: Search for "Autopilot" commands
- **Keybindings**: `Ctrl+Shift+A` combinations

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTOPILOT_OUTPUT_DIR` | Output directory for generated files | `.autopilot` |
| `AUTOPILOT_TEMPLATES_DIR` | Templates directory | `templates` |
| `AUTOPILOT_SCHEMAS_DIR` | Schemas directory | `schemas` |
| `AUTOPILOT_LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` |

### Configuration File

Create `.autopilot.config.json` in your project root:

```json
{
  "outputDir": ".autopilot",
  "templatesDir": "templates",
  "schemasDir": "schemas",
  "validation": {
    "enableParallel": true,
    "timeout": 300000,
    "gates": {
      "required": ["lint", "test", "build"],
      "optional": ["coverage", "performance"],
      "security": ["audit", "scan"],
      "visual": ["screenshot", "accessibility"]
    }
  },
  "codeGeneration": {
    "enforcePatterns": true,
    "includeTests": true,
    "includeDocs": false
  },
  "pr": {
    "template": "feature",
    "autoAssign": true,
    "labels": ["autopilot", "auto-generated"]
  }
}
```

## Examples

### Example 1: Simple Feature

**Request**: "Add a dark mode toggle to the settings page"

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Add dark mode toggle to settings page" --type feature --priority medium
```

**Generated Files**:
- `Settings.tsx` - Updated settings component
- `ThemeContext.tsx` - Theme context provider
- `ThemeToggle.tsx` - Toggle component
- `themeStorage.ts` - Theme persistence utility
- `themes.css` - Theme styles
- Tests for all components

### Example 2: API Enhancement

**Request**: "Add user profile API endpoints with validation"

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Add user profile API endpoints with validation" --type api --priority high
```

**Generated Files**:
- API route handlers
- Validation schemas
- Database models
- API tests
- Documentation

### Example 3: Bug Fix

**Request**: "Fix memory leak in data processing component"

**Command**:
```bash
node scripts/autopilot-cli.mjs run --feature "Fix memory leak in data processing component" --type bugfix --priority high
```

**Generated Files**:
- Updated component with fixes
- Performance tests
- Memory usage monitoring
- Regression tests

## Troubleshooting

### Common Issues

#### Command Not Found
**Problem**: `node: command not found`
**Solution**: Install Node.js or ensure it's in your PATH

#### Permission Denied
**Problem**: Permission denied when running scripts
**Solution**: 
```bash
chmod +x scripts/*.mjs
```

#### Module Not Found
**Problem**: Cannot find module 'chalk' or other dependencies
**Solution**:
```bash
npm install chalk inquirer
```

#### Validation Failures
**Problem**: Validation pipeline fails
**Solution**:
1. Check validation configuration
2. Ensure all required tools are installed
3. Review validation logs for specific errors

#### Code Generation Issues
**Problem**: Generated code doesn't match project patterns
**Solution**:
1. Update project pattern detection
2. Review existing code structure
3. Customize generation templates

### Debug Mode

Enable debug logging:
```bash
AUTOPILOT_LOG_LEVEL=debug node scripts/autopilot-cli.mjs run --verbose
```

### Getting Help

1. **Check logs**: Review `.autopilot/logs/` for detailed information
2. **Validate configuration**: Run `autopilot-cli.mjs config show`
3. **Test components**: Run individual scripts to isolate issues
4. **Check dependencies**: Ensure all required tools are installed

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Start development server: `npm run dev`

### Adding New Features

1. **Create specification**: Use the spec generator
2. **Plan implementation**: Use the task planner
3. **Generate code**: Use the code generator
4. **Add tests**: Include comprehensive tests
5. **Update documentation**: Update relevant docs

### Code Style

- Use ESLint configuration
- Follow existing patterns
- Add JSDoc comments
- Include error handling
- Write tests for new features

### Submitting Changes

1. Create feature branch
2. Make changes with tests
3. Run validation pipeline
4. Submit pull request
5. Address review feedback

---

## Support

For questions, issues, or contributions:

- **Documentation**: Check this guide and inline comments
- **Examples**: Review the examples directory
- **Issues**: Check existing issues or create new ones
- **Discussions**: Join community discussions

---

*Generated by Spec-to-Code Autopilot Documentation Generator*