# API Reference

Complete API reference for the Spec-to-Code Autopilot system components.

## Table of Contents

1. [CLI Commands](#cli-commands)
2. [Core Classes](#core-classes)
3. [Configuration Schema](#configuration-schema)
4. [File Formats](#file-formats)
5. [Validation Gates](#validation-gates)
6. [Templates](#templates)

## CLI Commands

### `autopilot-cli.mjs run`

Execute the complete Spec-to-PR workflow.

**Syntax**:
```bash
node scripts/autopilot-cli.mjs run [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--feature <description>` | string | - | Feature description (required if not interactive) |
| `--type <type>` | enum | `feature` | Feature type: `feature`, `bugfix`, `refactor`, `api`, `docs`, `chore` |
| `--priority <priority>` | enum | `medium` | Priority: `low`, `medium`, `high` |
| `--author <name>` | string | `git config user.name` | Author name |
| `--interactive` | boolean | `false` | Enable interactive prompts |
| `--dry-run` | boolean | `false` | Show what would be done without executing |
| `--output <dir>` | string | `.autopilot` | Output directory |
| `--config <path>` | string | `.autopilot.config.json` | Configuration file path |

**Examples**:
```bash
# Interactive mode
node scripts/autopilot-cli.mjs run --interactive

# Direct execution
node scripts/autopilot-cli.mjs run --feature "Add user authentication" --type feature --priority high

# Dry run
node scripts/autopilot-cli.mjs run --feature "Test feature" --dry-run
```

**Exit Codes**:
- `0`: Success
- `1`: General error
- `2`: Validation failed
- `3`: Configuration error

### `autopilot-cli.mjs spec`

Generate specification from feature description.

**Syntax**:
```bash
node scripts/autopilot-cli.mjs spec [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--feature <description>` | string | - | Feature description (required) |
| `--type <type>` | enum | `feature` | Feature type |
| `--priority <priority>` | enum | `medium` | Priority level |
| `--author <name>` | string | `git config user.name` | Author name |
| `--template <path>` | string | `templates/feature-spec-template.md` | Template file |
| `--output <path>` | string | `.autopilot/specifications/` | Output directory |

**Output**: JSON specification file

### `autopilot-cli.mjs plan`

Create implementation plan from specification.

**Syntax**:
```bash
node scripts/autopilot-cli.mjs plan [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--spec <path>` | string | - | Specification file path (required) |
| `--include-tests` | boolean | `true` | Include test generation |
| `--include-docs` | boolean | `false` | Include documentation |
| `--risk-level <level>` | enum | `medium` | Risk assessment: `low`, `medium`, `high` |
| `--output <path>` | string | `.autopilot/plans/` | Output directory |

**Output**: JSON implementation plan

### `autopilot-cli.mjs code`

Generate code from implementation plan.

**Syntax**:
```bash
node scripts/autopilot-cli.mjs code [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--plan <path>` | string | - | Implementation plan path (required) |
| `--output <dir>` | string | `.autopilot/generated/` | Output directory |
| `--dry-run` | boolean | `false` | Show generated code without writing |
| `--enforce-patterns` | boolean | `true` | Enforce project patterns |

**Output**: Generated code files

### `autopilot-cli.mjs validate`

Run validation pipeline.

**Syntax**:
```bash
node scripts/autopilot-cli.mjs validate [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--config <path>` | string | `validation.config.json` | Validation configuration |
| `--gates <list>` | string[] | `all` | Specific gates to run (comma-separated) |
| `--parallel` | boolean | `true` | Run gates in parallel |
| `--timeout <ms>` | number | `300000` | Timeout per gate in milliseconds |
| `--output <path>` | string | `.autopilot/validation/` | Output directory |

**Output**: Validation results JSON and HTML report

### `autopilot-cli.mjs pr`

Generate pull request description.

**Syntax**:
```bash
node scripts/autopilot-cli.mjs pr [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--spec <path>` | string | - | Specification file |
| `--plan <path>` | string | - | Implementation plan |
| `--validation <path>` | string | - | Validation results |
| `--template <type>` | enum | `feature` | PR template: `feature`, `bugfix`, `refactor`, `docs`, `chore` |
| `--output <path>` | string | `.autopilot/pull-requests/` | Output directory |

**Output**: Markdown PR description

### `autopilot-cli.mjs status`

Show autopilot status and recent runs.

**Syntax**:
```bash
node scripts/autopilot-cli.mjs status [options]
```

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--detailed` | boolean | `false` | Show detailed information |
| `--json` | boolean | `false` | Output in JSON format |
| `--limit <n>` | number | `10` | Number of recent runs to show |

### `autopilot-cli.mjs config`

Manage configuration settings.

**Syntax**:
```bash
node scripts/autopilot-cli.mjs config <action> [options]
```

**Actions**:
- `show`: Display current configuration
- `set <key> <value>`: Set configuration value
- `reset`: Reset to defaults

## Core Classes

### SpecificationGenerator

Generates technical specifications from feature descriptions.

**Constructor**:
```javascript
new SpecificationGenerator(options)
```

**Options**:
```typescript
interface SpecGeneratorOptions {
  templatesDir?: string;
  schemasDir?: string;
  outputDir?: string;
  aiModel?: string;
}
```

**Methods**:

#### `generateSpecification(featureRequest)`

**Parameters**:
```typescript
interface FeatureRequest {
  description: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'api' | 'docs' | 'chore';
  priority: 'low' | 'medium' | 'high';
  author: string;
}
```

**Returns**: `Promise<Specification>`

#### `validateSpecification(spec)`

**Parameters**: `Specification` object

**Returns**: `Promise<ValidationResult>`

### TaskPlanner

Creates implementation plans with file impact analysis.

**Constructor**:
```javascript
new TaskPlanner(options)
```

**Methods**:

#### `createPlan(specification)`

**Parameters**: `Specification` object

**Returns**: `Promise<ImplementationPlan>`

#### `analyzeFileImpact(plan)`

**Parameters**: `ImplementationPlan` object

**Returns**: `Promise<FileImpactAnalysis>`

### CodeGenerator

Generates code following project patterns.

**Constructor**:
```javascript
new CodeGenerator(options)
```

**Methods**:

#### `generateCode(plan)`

**Parameters**: `ImplementationPlan` object

**Returns**: `Promise<GeneratedCode[]>`

#### `enforcePatterns(code, patterns)`

**Parameters**: 
- `code`: Generated code object
- `patterns`: Project patterns

**Returns**: `Promise<EnforcedCode>`

### ValidationPipeline

Runs quality gates and validation checks.

**Constructor**:
```javascript
new ValidationPipeline(config)
```

**Methods**:

#### `runValidation(options)`

**Parameters**:
```typescript
interface ValidationOptions {
  gates?: string[];
  parallel?: boolean;
  timeout?: number;
}
```

**Returns**: `Promise<ValidationResults>`

#### `runGate(gateName, config)`

**Parameters**:
- `gateName`: Name of the validation gate
- `config`: Gate configuration

**Returns**: `Promise<GateResult>`

### PRGenerator

Creates pull request descriptions with validation results.

**Constructor**:
```javascript
new PRGenerator(options)
```

**Methods**:

#### `generatePR(metadata)`

**Parameters**:
```typescript
interface PRMetadata {
  specification: Specification;
  plan: ImplementationPlan;
  validation: ValidationResults;
  template: string;
}
```

**Returns**: `Promise<PRDescription>`

## Configuration Schema

### Main Configuration (`.autopilot.config.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "outputDir": {
      "type": "string",
      "default": ".autopilot",
      "description": "Output directory for generated files"
    },
    "templatesDir": {
      "type": "string", 
      "default": "templates",
      "description": "Templates directory"
    },
    "schemasDir": {
      "type": "string",
      "default": "schemas", 
      "description": "Schemas directory"
    },
    "validation": {
      "type": "object",
      "properties": {
        "enableParallel": {
          "type": "boolean",
          "default": true
        },
        "timeout": {
          "type": "number",
          "default": 300000
        },
        "gates": {
          "type": "object",
          "properties": {
            "required": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["lint", "test", "build"]
            },
            "optional": {
              "type": "array", 
              "items": { "type": "string" },
              "default": ["coverage", "performance"]
            },
            "security": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["audit", "scan"]
            },
            "visual": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["screenshot", "accessibility"]
            }
          }
        }
      }
    },
    "codeGeneration": {
      "type": "object",
      "properties": {
        "enforcePatterns": {
          "type": "boolean",
          "default": true
        },
        "includeTests": {
          "type": "boolean", 
          "default": true
        },
        "includeDocs": {
          "type": "boolean",
          "default": false
        }
      }
    },
    "pr": {
      "type": "object",
      "properties": {
        "template": {
          "type": "string",
          "enum": ["feature", "bugfix", "refactor", "docs", "chore"],
          "default": "feature"
        },
        "autoAssign": {
          "type": "boolean",
          "default": true
        },
        "labels": {
          "type": "array",
          "items": { "type": "string" },
          "default": ["autopilot", "auto-generated"]
        }
      }
    }
  }
}
```

### Validation Configuration

```json
{
  "gates": {
    "lint": {
      "command": "npm run lint",
      "timeout": 60000,
      "critical": true,
      "category": "required"
    },
    "test": {
      "command": "npm test",
      "timeout": 120000,
      "critical": true,
      "category": "required"
    },
    "build": {
      "command": "npm run build",
      "timeout": 180000,
      "critical": true,
      "category": "required"
    },
    "coverage": {
      "command": "npm run test:coverage",
      "timeout": 120000,
      "critical": false,
      "category": "optional",
      "thresholds": {
        "lines": 80,
        "functions": 80,
        "branches": 70
      }
    }
  }
}
```

## File Formats

### Specification Format

```typescript
interface Specification {
  metadata: {
    id: string;
    title: string;
    type: 'feature' | 'bugfix' | 'refactor' | 'api' | 'docs' | 'chore';
    priority: 'low' | 'medium' | 'high';
    version: string;
    author: string;
    createdAt: string;
    updatedAt: string;
  };
  userStory: {
    as: string;
    want: string;
    so: string;
  };
  acceptanceCriteria: string[];
  requirements: {
    functional: string[];
    nonFunctional: string[];
    technical: string[];
  };
  apiContract?: {
    endpoints: Endpoint[];
    models: Model[];
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
}
```

### Implementation Plan Format

```typescript
interface ImplementationPlan {
  metadata: {
    specificationId: string;
    createdAt: string;
    estimatedHours: number;
    complexity: 'low' | 'medium' | 'high';
  };
  fileImpact: {
    newFiles: string[];
    modifiedFiles: string[];
    deletedFiles: string[];
    estimatedChanges: number;
  };
  tasks: Task[];
  dependencies: Dependency[];
  phases: Phase[];
  qualityGates: QualityGate[];
}
```

### Validation Results Format

```typescript
interface ValidationResults {
  metadata: {
    timestamp: string;
    duration: number;
    totalGates: number;
  };
  summary: {
    passed: number;
    failed: number;
    skipped: number;
    criticalFailures: number;
  };
  gates: GateResult[];
  recommendations: string[];
  nextSteps: string[];
}
```

## Validation Gates

### Built-in Gates

| Gate | Category | Command | Critical | Description |
|------|----------|---------|----------|-------------|
| `lint` | required | `npm run lint` | Yes | Code linting |
| `test` | required | `npm test` | Yes | Unit tests |
| `build` | required | `npm run build` | Yes | Build process |
| `coverage` | optional | `npm run test:coverage` | No | Test coverage |
| `performance` | optional | `npm run test:perf` | No | Performance tests |
| `audit` | security | `npm audit` | Yes | Security audit |
| `scan` | security | `npm run security:scan` | Yes | Security scan |
| `screenshot` | visual | `npm run test:visual` | No | Visual regression |
| `accessibility` | visual | `npm run test:a11y` | No | Accessibility |

### Custom Gates

Create custom validation gates:

```json
{
  "gates": {
    "custom-gate": {
      "command": "your-custom-command",
      "timeout": 60000,
      "critical": false,
      "category": "optional",
      "env": {
        "NODE_ENV": "test"
      },
      "cwd": "./custom-dir",
      "successCodes": [0],
      "metrics": {
        "pattern": "Coverage: (\\d+)%",
        "threshold": 80
      }
    }
  }
}
```

## Templates

### Specification Template Variables

Available in `feature-spec-template.md`:

| Variable | Type | Description |
|----------|------|-------------|
| `{{title}}` | string | Feature title |
| `{{type}}` | string | Feature type |
| `{{priority}}` | string | Priority level |
| `{{author}}` | string | Author name |
| `{{description}}` | string | Feature description |
| `{{userStory}}` | object | User story components |
| `{{acceptanceCriteria}}` | array | Acceptance criteria list |
| `{{requirements}}` | object | Requirements by category |

### Task Plan Template Variables

Available in `task-plan-template.md`:

| Variable | Type | Description |
|----------|------|-------------|
| `{{specTitle}}` | string | Specification title |
| `{{tasks}}` | array | Task list |
| `{{phases}}` | array | Implementation phases |
| `{{fileImpact}}` | object | File impact analysis |
| `{{dependencies}}` | array | Task dependencies |
| `{{estimatedHours}}` | number | Total estimated hours |

### PR Template Variables

Available in PR templates:

| Variable | Type | Description |
|----------|------|-------------|
| `{{title}}` | string | PR title |
| `{{summary}}` | string | Change summary |
| `{{changes}}` | object | Changes by category |
| `{{validation}}` | object | Validation results |
| `{{testing}}` | object | Testing information |
| `{{breaking}}` | array | Breaking changes |
| `{{checklist}}` | array | Review checklist |

## Error Codes

| Code | Category | Description |
|------|----------|-------------|
| `E001` | Configuration | Invalid configuration file |
| `E002` | Configuration | Missing required configuration |
| `E003` | Specification | Specification validation failed |
| `E004` | Planning | Task planning failed |
| `E005` | Generation | Code generation failed |
| `E006` | Validation | Validation pipeline failed |
| `E007` | PR | PR generation failed |
| `E008` | File | File operation failed |
| `E009` | Template | Template processing failed |
| `E010` | Network | Network operation failed |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTOPILOT_OUTPUT_DIR` | `.autopilot` | Output directory |
| `AUTOPILOT_TEMPLATES_DIR` | `templates` | Templates directory |
| `AUTOPILOT_SCHEMAS_DIR` | `schemas` | Schemas directory |
| `AUTOPILOT_LOG_LEVEL` | `info` | Logging level |
| `AUTOPILOT_CONFIG_FILE` | `.autopilot.config.json` | Configuration file |
| `AUTOPILOT_PARALLEL_GATES` | `true` | Enable parallel validation |
| `AUTOPILOT_TIMEOUT` | `300000` | Default timeout (ms) |

---

This API reference provides complete documentation for integrating with and extending the Spec-to-Code Autopilot system.