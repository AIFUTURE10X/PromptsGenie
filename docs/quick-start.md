# Quick Start Guide

Get up and running with Spec-to-Code Autopilot in under 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Git repository initialized
- ✅ Basic project structure in place

## Installation

### 1. Download Autopilot Scripts

Clone or download the autopilot scripts to your project:

```bash
# If adding to existing project
git clone https://github.com/your-repo/autopilot-scripts.git scripts
```

### 2. Install Dependencies

```bash
npm install chalk inquirer
```

### 3. Verify Installation

```bash
node scripts/autopilot-cli.mjs --help
```

You should see the help menu with available commands.

## Your First Autopilot Run

### Option 1: Interactive Mode (Recommended for beginners)

```bash
node scripts/autopilot-cli.mjs run --interactive
```

Follow the prompts:
- **Feature description**: "Add a user profile page"
- **Feature type**: feature
- **Priority**: medium
- **Author**: Your name

### Option 2: Direct Command

```bash
node scripts/autopilot-cli.mjs run --feature "Add user profile page" --type feature --priority medium --author "Your Name"
```

## What Happens Next?

The autopilot will:

1. **📋 Generate Specification** (30 seconds)
   - Creates detailed technical spec
   - Defines acceptance criteria
   - Plans API contracts

2. **🗂️ Create Task Plan** (45 seconds)
   - Breaks down implementation
   - Analyzes file impacts
   - Estimates effort

3. **⚡ Generate Code** (60 seconds)
   - Creates components/files
   - Follows project patterns
   - Includes tests

4. **✅ Run Validation** (90 seconds)
   - Runs linting
   - Executes tests
   - Checks security

5. **📝 Create Pull Request** (15 seconds)
   - Generates PR description
   - Includes validation results
   - Documents changes

## Check Your Results

### Generated Files

Look in the `.autopilot/` directory:
```
.autopilot/
├── specifications/
│   └── user-profile-page-spec.json
├── plans/
│   └── user-profile-page-plan.json
├── generated/
│   ├── UserProfile.tsx
│   ├── UserProfile.test.tsx
│   └── userProfileApi.ts
├── validation/
│   └── validation-results.json
└── pull-requests/
    └── user-profile-page-pr.md
```

### View the Pull Request

```bash
cat .autopilot/pull-requests/user-profile-page-pr.md
```

## IDE Integration (Optional)

### VS Code Setup

1. **Install integration**:
   ```bash
   cd .ide-integrations/vscode
   ./install.sh  # Linux/Mac
   install.bat   # Windows
   ```

2. **Use keyboard shortcuts**:
   - `Ctrl+Shift+A, Ctrl+Shift+R`: Run workflow
   - `Ctrl+Shift+A, Ctrl+Shift+S`: Generate spec

### Other IDEs

Check `.ide-integrations/` for your preferred editor:
- WebStorm/IntelliJ
- Vim/Neovim  
- Emacs
- Sublime Text

## Common First-Time Issues

### ❌ "Command not found"
**Solution**: Ensure Node.js is installed and in PATH
```bash
node --version  # Should show v18+
```

### ❌ "Module not found"
**Solution**: Install dependencies
```bash
npm install chalk inquirer
```

### ❌ "Permission denied"
**Solution**: Make scripts executable
```bash
chmod +x scripts/*.mjs
```

### ❌ "Validation failed"
**Solution**: Check what failed
```bash
node scripts/autopilot-cli.mjs validate --detailed
```

## Next Steps

### 1. Try Different Feature Types

```bash
# API endpoint
node scripts/autopilot-cli.mjs run --feature "Add user authentication API" --type api

# Bug fix
node scripts/autopilot-cli.mjs run --feature "Fix memory leak in data processor" --type bugfix

# Refactoring
node scripts/autopilot-cli.mjs run --feature "Extract common utilities to shared module" --type refactor
```

### 2. Use Individual Commands

```bash
# Generate specification only
node scripts/autopilot-cli.mjs spec --feature "Add search functionality"

# Create implementation plan
node scripts/autopilot-cli.mjs plan --spec .autopilot/specifications/search-spec.json

# Generate code only
node scripts/autopilot-cli.mjs code --plan .autopilot/plans/search-plan.json

# Run validation
node scripts/autopilot-cli.mjs validate

# Check status
node scripts/autopilot-cli.mjs status
```

### 3. Customize Configuration

Create `.autopilot.config.json`:
```json
{
  "outputDir": ".autopilot",
  "validation": {
    "enableParallel": true,
    "gates": {
      "required": ["lint", "test", "build"],
      "optional": ["coverage"]
    }
  },
  "codeGeneration": {
    "includeTests": true,
    "includeDocs": false
  }
}
```

## Tips for Success

### ✅ Write Clear Feature Descriptions

**Good**:
```
"Add user profile page with avatar upload, personal information editing, and privacy settings"
```

**Better**:
```
"As a user, I want to edit my profile information including avatar, name, email, and privacy settings so that I can keep my account information current and control my visibility to other users."
```

### ✅ Start Small

Begin with simple features and gradually work up to complex ones:

1. **Simple**: "Add loading spinner component"
2. **Medium**: "Add user profile page with form validation"  
3. **Complex**: "Implement real-time chat with WebSocket and message history"

### ✅ Review Generated Code

Always review the generated code before merging:
- Check for project pattern compliance
- Verify test coverage
- Ensure security best practices

### ✅ Iterate and Improve

Use the autopilot iteratively:
```bash
# First iteration: Basic functionality
node scripts/autopilot-cli.mjs run --feature "Basic user search"

# Second iteration: Add features
node scripts/autopilot-cli.mjs run --feature "Add filters and sorting to user search"

# Third iteration: Optimize
node scripts/autopilot-cli.mjs run --feature "Optimize user search performance with debouncing and caching"
```

## Getting Help

### 📚 Documentation
- **Full Guide**: `docs/README.md`
- **Examples**: `docs/examples.md`
- **API Reference**: `docs/api.md`

### 🔍 Debugging
```bash
# Enable verbose logging
node scripts/autopilot-cli.mjs run --feature "test" --verbose

# Check detailed status
node scripts/autopilot-cli.mjs status --detailed

# View configuration
node scripts/autopilot-cli.mjs config show
```

### 🆘 Common Commands
```bash
# Show help for any command
node scripts/autopilot-cli.mjs <command> --help

# Check what would be generated (dry run)
node scripts/autopilot-cli.mjs run --feature "test feature" --dry-run

# Reset configuration to defaults
node scripts/autopilot-cli.mjs config reset
```

---

🎉 **Congratulations!** You're now ready to use Spec-to-Code Autopilot to accelerate your development workflow.

**Next**: Check out `docs/examples.md` for more advanced use cases and patterns.