#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Automated Code Generator
 * Generates code based on implementation plans while enforcing project patterns
 */
class CodeGenerator {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.patternsPath = path.join(__dirname, '..', '.rules');
    this.outputDir = path.join(__dirname, '..', 'generated');
    
    // Code generation patterns
    this.patterns = {
      react: {
        component: this.generateReactComponent.bind(this),
        hook: this.generateReactHook.bind(this),
        context: this.generateReactContext.bind(this),
        test: this.generateReactTest.bind(this)
      },
      api: {
        endpoint: this.generateAPIEndpoint.bind(this),
        service: this.generateAPIService.bind(this),
        middleware: this.generateAPIMiddleware.bind(this),
        test: this.generateAPITest.bind(this)
      },
      database: {
        migration: this.generateMigration.bind(this),
        model: this.generateModel.bind(this),
        seed: this.generateSeed.bind(this)
      },
      utils: {
        utility: this.generateUtility.bind(this),
        type: this.generateTypeDefinition.bind(this),
        constant: this.generateConstants.bind(this)
      }
    };
  }

  /**
   * Generate code from implementation plan
   */
  async generateFromPlan(plan, options = {}) {
    const {
      dryRun = false,
      skipExisting = true,
      enforcePatterns = true
    } = options;

    console.log('🔧 Starting code generation from plan...');

    // Load project patterns
    const projectPatterns = await this.loadProjectPatterns();
    
    // Analyze plan for code generation requirements
    const codeRequirements = await this.analyzePlanForCodeGeneration(plan);
    
    // Generate code for each requirement
    const generatedFiles = [];
    
    for (const requirement of codeRequirements) {
      try {
        const files = await this.generateCodeForRequirement(
          requirement, 
          projectPatterns, 
          { dryRun, skipExisting, enforcePatterns }
        );
        generatedFiles.push(...files);
      } catch (error) {
        console.error(`❌ Error generating code for ${requirement.type}:`, error.message);
      }
    }

    // Generate summary
    const summary = {
      total_files: generatedFiles.length,
      by_type: this.groupFilesByType(generatedFiles),
      patterns_enforced: enforcePatterns,
      dry_run: dryRun
    };

    console.log(`✅ Code generation completed - ${generatedFiles.length} files generated`);
    
    return {
      generated_files: generatedFiles,
      summary,
      next_steps: this.generateNextSteps(generatedFiles, plan)
    };
  }

  /**
   * Load project patterns from .rules file
   */
  async loadProjectPatterns() {
    try {
      const rulesContent = await fs.readFile(this.patternsPath, 'utf-8');
      return this.parseProjectRules(rulesContent);
    } catch (error) {
      console.warn('⚠️ Could not load project patterns, using defaults');
      return this.getDefaultPatterns();
    }
  }

  /**
   * Parse project rules from .rules file
   */
  parseProjectRules(rulesContent) {
    const patterns = {
      naming: {},
      structure: {},
      imports: {},
      exports: {},
      testing: {},
      typescript: {}
    };

    const lines = rulesContent.split('\n');
    let currentSection = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        currentSection = trimmed.substring(2).toLowerCase().replace(/\s+/g, '_');
        continue;
      }

      if (trimmed.startsWith('- ') && currentSection) {
        const rule = trimmed.substring(2);
        if (!patterns[currentSection]) patterns[currentSection] = [];
        patterns[currentSection].push(rule);
      }
    }

    return patterns;
  }

  /**
   * Get default patterns if .rules file is not available
   */
  getDefaultPatterns() {
    return {
      naming: {
        components: 'PascalCase',
        files: 'kebab-case',
        functions: 'camelCase',
        constants: 'UPPER_SNAKE_CASE'
      },
      structure: {
        components: 'src/components',
        hooks: 'src/hooks',
        utils: 'src/utils',
        api: 'src/api',
        types: 'src/types'
      },
      imports: {
        react: "import React from 'react'",
        types: "import type { } from ''",
        relative: "import { } from './'",
        absolute: "import { } from '@/'"
      },
      exports: {
        default: 'export default',
        named: 'export { }',
        type: 'export type { }'
      },
      testing: {
        framework: 'jest',
        location: '__tests__',
        naming: '.test.tsx'
      },
      typescript: {
        strict: true,
        interfaces: 'PascalCase',
        types: 'PascalCase'
      }
    };
  }

  /**
   * Analyze implementation plan for code generation requirements
   */
  async analyzePlanForCodeGeneration(plan) {
    console.log('🔍 Analyzing plan for code generation requirements...');

    const requirements = [];

    // Analyze tasks for code generation needs
    for (const task of plan.tasks) {
      if (task.type === 'frontend' && task.files) {
        for (const file of task.files) {
          if (file.path.includes('components')) {
            requirements.push({
              type: 'react_component',
              name: this.extractComponentName(file.path),
              path: file.path,
              task: task,
              estimated_lines: file.estimated_lines || 80,
              props: this.extractPropsFromTask(task),
              functionality: this.extractFunctionalityFromTask(task)
            });
          }
        }
      }

      if (task.type === 'backend' && task.files) {
        for (const file of task.files) {
          if (file.path.includes('api')) {
            requirements.push({
              type: 'api_endpoint',
              name: this.extractAPIName(file.path),
              path: file.path,
              task: task,
              estimated_lines: file.estimated_lines || 120,
              methods: this.extractMethodsFromTask(task),
              middleware: this.extractMiddlewareFromTask(task)
            });
          }
        }
      }

      if (task.type === 'testing' && task.files) {
        for (const file of task.files) {
          requirements.push({
            type: 'test_file',
            name: this.extractTestName(file.path),
            path: file.path,
            task: task,
            test_types: file.test_types || ['unit'],
            target_file: this.getTargetFileForTest(file.path)
          });
        }
      }

      if (task.type === 'database' && task.files) {
        for (const file of task.files) {
          if (file.path.includes('migration')) {
            requirements.push({
              type: 'database_migration',
              name: this.extractMigrationName(file.path),
              path: file.path,
              task: task,
              operations: this.extractMigrationOperations(task)
            });
          }
        }
      }
    }

    // Analyze file impact for additional requirements
    for (const newFile of plan.file_impact.new_files) {
      if (!requirements.some(r => r.path === newFile.path)) {
        const type = this.determineFileType(newFile.path);
        if (type) {
          requirements.push({
            type,
            name: this.extractNameFromPath(newFile.path),
            path: newFile.path,
            reason: newFile.reason,
            estimated_lines: newFile.estimated_lines || 50
          });
        }
      }
    }

    console.log(`✅ Found ${requirements.length} code generation requirements`);
    return requirements;
  }

  /**
   * Generate code for a specific requirement
   */
  async generateCodeForRequirement(requirement, patterns, options) {
    console.log(`🔨 Generating ${requirement.type}: ${requirement.name}`);

    const { dryRun, skipExisting, enforcePatterns } = options;
    const generatedFiles = [];

    // Check if file already exists
    if (skipExisting) {
      try {
        await fs.access(requirement.path);
        console.log(`⏭️ Skipping existing file: ${requirement.path}`);
        return generatedFiles;
      } catch {
        // File doesn't exist, continue with generation
      }
    }

    // Generate code based on type
    const [category, subtype] = requirement.type.split('_');
    
    if (this.patterns[category] && this.patterns[category][subtype]) {
      const code = await this.patterns[category][subtype](requirement, patterns);
      
      if (enforcePatterns) {
        const validatedCode = await this.enforcePatterns(code, requirement, patterns);
        
        if (!dryRun) {
          await this.writeGeneratedFile(requirement.path, validatedCode);
        }
        
        generatedFiles.push({
          path: requirement.path,
          type: requirement.type,
          lines: validatedCode.split('\n').length,
          patterns_applied: true,
          dry_run: dryRun
        });
      } else {
        if (!dryRun) {
          await this.writeGeneratedFile(requirement.path, code);
        }
        
        generatedFiles.push({
          path: requirement.path,
          type: requirement.type,
          lines: code.split('\n').length,
          patterns_applied: false,
          dry_run: dryRun
        });
      }
    } else {
      console.warn(`⚠️ No generator found for type: ${requirement.type}`);
    }

    return generatedFiles;
  }

  /**
   * Generate React Component
   */
  async generateReactComponent(requirement, patterns) {
    const { name, props = [], functionality = [] } = requirement;
    
    const componentName = this.toPascalCase(name);
    const propsInterface = `${componentName}Props`;
    
    let code = '';
    
    // Imports
    code += "import React from 'react';\n";
    if (props.length > 0) {
      code += `import type { ${propsInterface} } from './types';\n`;
    }
    code += '\n';
    
    // Props interface
    if (props.length > 0) {
      code += `interface ${propsInterface} {\n`;
      for (const prop of props) {
        code += `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};\n`;
      }
      code += '}\n\n';
    }
    
    // Component
    const propsParam = props.length > 0 ? `{ ${props.map(p => p.name).join(', ')} }: ${propsInterface}` : '';
    
    code += `const ${componentName}: React.FC${props.length > 0 ? `<${propsInterface}>` : ''} = (${propsParam}) => {\n`;
    
    // State and hooks
    if (functionality.includes('state')) {
      code += '  const [state, setState] = React.useState({});\n\n';
    }
    
    if (functionality.includes('effect')) {
      code += '  React.useEffect(() => {\n';
      code += '    // Effect logic here\n';
      code += '  }, []);\n\n';
    }
    
    // Event handlers
    if (functionality.includes('handlers')) {
      code += '  const handleClick = () => {\n';
      code += '    // Handle click logic\n';
      code += '  };\n\n';
    }
    
    // Render
    code += '  return (\n';
    code += `    <div className="${this.toKebabCase(name)}">\n`;
    code += `      <h2>${componentName}</h2>\n`;
    
    if (props.length > 0) {
      code += '      {/* Props: */}\n';
      for (const prop of props) {
        code += `      <p>{${prop.name}}</p>\n`;
      }
    }
    
    if (functionality.includes('handlers')) {
      code += '      <button onClick={handleClick}>Click me</button>\n';
    }
    
    code += '    </div>\n';
    code += '  );\n';
    code += '};\n\n';
    
    // Export
    code += `export default ${componentName};\n`;
    
    return code;
  }

  /**
   * Generate React Hook
   */
  async generateReactHook(requirement, patterns) {
    const { name, functionality = [] } = requirement;
    
    const hookName = `use${this.toPascalCase(name)}`;
    
    let code = '';
    
    // Imports
    code += "import { useState, useEffect, useCallback } from 'react';\n\n";
    
    // Hook
    code += `const ${hookName} = () => {\n`;
    
    // State
    code += '  const [data, setData] = useState(null);\n';
    code += '  const [loading, setLoading] = useState(false);\n';
    code += '  const [error, setError] = useState(null);\n\n';
    
    // Methods
    code += '  const fetchData = useCallback(async () => {\n';
    code += '    setLoading(true);\n';
    code += '    setError(null);\n';
    code += '    try {\n';
    code += '      // Fetch logic here\n';
    code += '      const result = await fetch("/api/data");\n';
    code += '      setData(result);\n';
    code += '    } catch (err) {\n';
    code += '      setError(err);\n';
    code += '    } finally {\n';
    code += '      setLoading(false);\n';
    code += '    }\n';
    code += '  }, []);\n\n';
    
    // Effect
    code += '  useEffect(() => {\n';
    code += '    fetchData();\n';
    code += '  }, [fetchData]);\n\n';
    
    // Return
    code += '  return {\n';
    code += '    data,\n';
    code += '    loading,\n';
    code += '    error,\n';
    code += '    refetch: fetchData\n';
    code += '  };\n';
    code += '};\n\n';
    
    // Export
    code += `export default ${hookName};\n`;
    
    return code;
  }

  /**
   * Generate React Context
   */
  async generateReactContext(requirement, patterns) {
    const { name } = requirement;
    
    const contextName = `${this.toPascalCase(name)}Context`;
    const providerName = `${this.toPascalCase(name)}Provider`;
    const hookName = `use${this.toPascalCase(name)}`;
    
    let code = '';
    
    // Imports
    code += "import React, { createContext, useContext, useState, ReactNode } from 'react';\n\n";
    
    // Types
    code += `interface ${this.toPascalCase(name)}State {\n`;
    code += '  // Define your state here\n';
    code += '}\n\n';
    
    code += `interface ${contextName}Type {\n`;
    code += `  state: ${this.toPascalCase(name)}State;\n`;
    code += `  setState: React.Dispatch<React.SetStateAction<${this.toPascalCase(name)}State>>;\n`;
    code += '}\n\n';
    
    code += `interface ${providerName}Props {\n`;
    code += '  children: ReactNode;\n';
    code += '}\n\n';
    
    // Context
    code += `const ${contextName} = createContext<${contextName}Type | undefined>(undefined);\n\n`;
    
    // Provider
    code += `export const ${providerName}: React.FC<${providerName}Props> = ({ children }) => {\n`;
    code += `  const [state, setState] = useState<${this.toPascalCase(name)}State>({\n`;
    code += '    // Initial state\n';
    code += '  });\n\n';
    
    code += '  return (\n';
    code += `    <${contextName}.Provider value={{ state, setState }}>\n`;
    code += '      {children}\n';
    code += `    </${contextName}.Provider>\n`;
    code += '  );\n';
    code += '};\n\n';
    
    // Hook
    code += `export const ${hookName} = () => {\n`;
    code += `  const context = useContext(${contextName});\n`;
    code += '  if (context === undefined) {\n';
    code += `    throw new Error('${hookName} must be used within a ${providerName}');\n`;
    code += '  }\n';
    code += '  return context;\n';
    code += '};\n';
    
    return code;
  }

  /**
   * Generate React Test
   */
  async generateReactTest(requirement, patterns) {
    const { name, target_file } = requirement;
    
    const componentName = this.extractComponentNameFromPath(target_file);
    const testName = `${componentName} Component`;
    
    let code = '';
    
    // Imports
    code += "import React from 'react';\n";
    code += "import { render, screen, fireEvent } from '@testing-library/react';\n";
    code += "import '@testing-library/jest-dom';\n";
    code += `import ${componentName} from './${componentName}';\n\n`;
    
    // Test suite
    code += `describe('${testName}', () => {\n`;
    
    // Basic render test
    code += '  it('renders without crashing', () => {\n';
    code += `    render(<${componentName} />);\n`;
    code += '  });\n\n';
    
    // Content test
    code += '  it('displays the correct content', () => {\n';
    code += `    render(<${componentName} />);\n`;
    code += `    expect(screen.getByText('${componentName}')).toBeInTheDocument();\n`;
    code += '  });\n\n';
    
    // Props test
    code += '  it('handles props correctly', () => {\n';
    code += '    const testProps = {\n';
    code += '      // Add test props here\n';
    code += '    };\n';
    code += `    render(<${componentName} {...testProps} />);\n`;
    code += '    // Add assertions here\n';
    code += '  });\n\n';
    
    // Interaction test
    code += '  it('handles user interactions', () => {\n';
    code += `    render(<${componentName} />);\n`;
    code += '    const button = screen.getByRole('button');\n';
    code += '    fireEvent.click(button);\n';
    code += '    // Add assertions here\n';
    code += '  });\n';
    
    code += '});\n';
    
    return code;
  }

  /**
   * Generate API Endpoint
   */
  async generateAPIEndpoint(requirement, patterns) {
    const { name, methods = ['GET'], middleware = [] } = requirement;
    
    const routeName = this.toKebabCase(name);
    const handlerName = this.toCamelCase(name);
    
    let code = '';
    
    // Imports
    code += "import { Request, Response, NextFunction } from 'express';\n";
    code += "import { Router } from 'express';\n";
    if (middleware.length > 0) {
      code += `import { ${middleware.join(', ')} } from '../middleware';\n`;
    }
    code += '\n';
    
    // Router
    code += 'const router = Router();\n\n';
    
    // Handlers for each method
    for (const method of methods) {
      const methodHandler = `${handlerName}${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}`;
      
      code += `const ${methodHandler} = async (req: Request, res: Response, next: NextFunction) => {\n`;
      code += '  try {\n';
      
      switch (method.toUpperCase()) {
        case 'GET':
          code += '    // Get logic here\n';
          code += '    const data = {}; // Fetch data\n';
          code += '    res.json({ success: true, data });\n';
          break;
        case 'POST':
          code += '    const { body } = req;\n';
          code += '    // Validation logic here\n';
          code += '    // Create logic here\n';
          code += '    const result = {}; // Create result\n';
          code += '    res.status(201).json({ success: true, data: result });\n';
          break;
        case 'PUT':
          code += '    const { id } = req.params;\n';
          code += '    const { body } = req;\n';
          code += '    // Update logic here\n';
          code += '    const result = {}; // Update result\n';
          code += '    res.json({ success: true, data: result });\n';
          break;
        case 'DELETE':
          code += '    const { id } = req.params;\n';
          code += '    // Delete logic here\n';
          code += '    res.json({ success: true, message: 'Deleted successfully' });\n';
          break;
      }
      
      code += '  } catch (error) {\n';
      code += '    next(error);\n';
      code += '  }\n';
      code += '};\n\n';
      
      // Route registration
      const middlewareStr = middleware.length > 0 ? `, ${middleware.join(', ')}` : '';
      code += `router.${method.toLowerCase()}('/${routeName}'${middlewareStr}, ${methodHandler});\n`;
      if (method !== 'GET' && method !== 'POST') {
        code += `router.${method.toLowerCase()}('/${routeName}/:id'${middlewareStr}, ${methodHandler});\n`;
      }
      code += '\n';
    }
    
    // Export
    code += 'export default router;\n';
    
    return code;
  }

  /**
   * Generate API Service
   */
  async generateAPIService(requirement, patterns) {
    const { name } = requirement;
    
    const serviceName = `${this.toPascalCase(name)}Service`;
    
    let code = '';
    
    // Imports
    code += "import { Request, Response } from 'express';\n";
    code += "// Import your database/ORM here\n\n";
    
    // Service class
    code += `class ${serviceName} {\n`;
    
    // Methods
    code += '  async findAll() {\n';
    code += '    // Implement find all logic\n';
    code += '    return [];\n';
    code += '  }\n\n';
    
    code += '  async findById(id: string) {\n';
    code += '    // Implement find by id logic\n';
    code += '    return null;\n';
    code += '  }\n\n';
    
    code += '  async create(data: any) {\n';
    code += '    // Implement create logic\n';
    code += '    return data;\n';
    code += '  }\n\n';
    
    code += '  async update(id: string, data: any) {\n';
    code += '    // Implement update logic\n';
    code += '    return data;\n';
    code += '  }\n\n';
    
    code += '  async delete(id: string) {\n';
    code += '    // Implement delete logic\n';
    code += '    return true;\n';
    code += '  }\n';
    
    code += '}\n\n';
    
    // Export
    code += `export default new ${serviceName}();\n`;
    
    return code;
  }

  /**
   * Generate API Middleware
   */
  async generateAPIMiddleware(requirement, patterns) {
    const { name } = requirement;
    
    const middlewareName = this.toCamelCase(name);
    
    let code = '';
    
    // Imports
    code += "import { Request, Response, NextFunction } from 'express';\n\n";
    
    // Middleware function
    code += `export const ${middlewareName} = (req: Request, res: Response, next: NextFunction) => {\n`;
    code += '  try {\n';
    code += '    // Middleware logic here\n';
    code += '    next();\n';
    code += '  } catch (error) {\n';
    code += '    res.status(500).json({ error: 'Internal server error' });\n';
    code += '  }\n';
    code += '};\n';
    
    return code;
  }

  /**
   * Generate API Test
   */
  async generateAPITest(requirement, patterns) {
    const { name, target_file } = requirement;
    
    const endpointName = this.extractAPINameFromPath(target_file);
    
    let code = '';
    
    // Imports
    code += "import request from 'supertest';\n";
    code += "import app from '../app';\n\n";
    
    // Test suite
    code += `describe('${endpointName} API', () => {\n`;
    
    // GET test
    code += '  describe('GET /', () => {\n';
    code += '    it('should return 200 and data', async () => {\n';
    code += `      const response = await request(app).get('/${this.toKebabCase(endpointName)}');\n`;
    code += '      expect(response.status).toBe(200);\n';
    code += '      expect(response.body.success).toBe(true);\n';
    code += '    });\n';
    code += '  });\n\n';
    
    // POST test
    code += '  describe('POST /', () => {\n';
    code += '    it('should create new resource', async () => {\n';
    code += '      const testData = {\n';
    code += '        // Add test data here\n';
    code += '      };\n';
    code += `      const response = await request(app).post('/${this.toKebabCase(endpointName)}').send(testData);\n`;
    code += '      expect(response.status).toBe(201);\n';
    code += '      expect(response.body.success).toBe(true);\n';
    code += '    });\n';
    code += '  });\n';
    
    code += '});\n';
    
    return code;
  }

  /**
   * Generate Database Migration
   */
  async generateMigration(requirement, patterns) {
    const { name, operations = [] } = requirement;
    
    let code = '';
    
    // Migration header
    code += `-- Migration: ${name}\n`;
    code += `-- Created: ${new Date().toISOString()}\n\n`;
    
    // Up migration
    code += '-- Up\n';
    for (const operation of operations) {
      switch (operation.type) {
        case 'create_table':
          code += `CREATE TABLE ${operation.table} (\n`;
          code += '  id SERIAL PRIMARY KEY,\n';
          code += '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n';
          code += '  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n';
          code += ');\n\n';
          break;
        case 'add_column':
          code += `ALTER TABLE ${operation.table} ADD COLUMN ${operation.column} ${operation.type};\n\n`;
          break;
        case 'drop_column':
          code += `ALTER TABLE ${operation.table} DROP COLUMN ${operation.column};\n\n`;
          break;
      }
    }
    
    // Down migration
    code += '-- Down\n';
    for (const operation of operations.reverse()) {
      switch (operation.type) {
        case 'create_table':
          code += `DROP TABLE ${operation.table};\n\n`;
          break;
        case 'add_column':
          code += `ALTER TABLE ${operation.table} DROP COLUMN ${operation.column};\n\n`;
          break;
        case 'drop_column':
          code += `ALTER TABLE ${operation.table} ADD COLUMN ${operation.column} ${operation.type};\n\n`;
          break;
      }
    }
    
    return code;
  }

  /**
   * Generate Model
   */
  async generateModel(requirement, patterns) {
    const { name } = requirement;
    
    const modelName = this.toPascalCase(name);
    
    let code = '';
    
    // Imports
    code += "// Import your ORM here\n\n";
    
    // Interface
    code += `export interface ${modelName} {\n`;
    code += '  id: number;\n';
    code += '  createdAt: Date;\n';
    code += '  updatedAt: Date;\n';
    code += '  // Add your fields here\n';
    code += '}\n\n';
    
    // Model definition (example for TypeORM)
    code += `export class ${modelName}Entity {\n`;
    code += '  // Add your entity definition here\n';
    code += '}\n';
    
    return code;
  }

  /**
   * Generate Utility
   */
  async generateUtility(requirement, patterns) {
    const { name, functionality = [] } = requirement;
    
    const utilName = this.toCamelCase(name);
    
    let code = '';
    
    // Utility function
    code += `export const ${utilName} = () => {\n`;
    code += '  // Utility logic here\n';
    code += '  return null;\n';
    code += '};\n\n';
    
    // Additional utilities based on functionality
    if (functionality.includes('validation')) {
      code += `export const validate${this.toPascalCase(name)} = (data: any) => {\n`;
      code += '  // Validation logic here\n';
      code += '  return true;\n';
      code += '};\n\n';
    }
    
    if (functionality.includes('formatting')) {
      code += `export const format${this.toPascalCase(name)} = (data: any) => {\n`;
      code += '  // Formatting logic here\n';
      code += '  return data;\n';
      code += '};\n\n';
    }
    
    return code;
  }

  /**
   * Generate Type Definition
   */
  async generateTypeDefinition(requirement, patterns) {
    const { name } = requirement;
    
    const typeName = this.toPascalCase(name);
    
    let code = '';
    
    // Interface
    code += `export interface ${typeName} {\n`;
    code += '  // Add your type definition here\n';
    code += '}\n\n';
    
    // Type alias
    code += `export type ${typeName}Type = ${typeName};\n\n`;
    
    // Enum (if applicable)
    code += `export enum ${typeName}Status {\n`;
    code += '  ACTIVE = 'active',\n';
    code += '  INACTIVE = 'inactive'\n';
    code += '}\n';
    
    return code;
  }

  /**
   * Generate Constants
   */
  async generateConstants(requirement, patterns) {
    const { name } = requirement;
    
    const constantPrefix = this.toUpperSnakeCase(name);
    
    let code = '';
    
    // Constants
    code += `export const ${constantPrefix}_CONFIG = {\n`;
    code += '  // Add your configuration here\n';
    code += '};\n\n';
    
    code += `export const ${constantPrefix}_MESSAGES = {\n`;
    code += '  SUCCESS: 'Operation completed successfully',\n';
    code += '  ERROR: 'An error occurred'\n';
    code += '};\n\n';
    
    code += `export const ${constantPrefix}_ENDPOINTS = {\n`;
    code += `  BASE: '/${this.toKebabCase(name)}',\n`;
    code += `  LIST: '/${this.toKebabCase(name)}',\n`;
    code += `  DETAIL: '/${this.toKebabCase(name)}/:id'\n`;
    code += '};\n`;
    
    return code;
  }

  /**
   * Enforce project patterns on generated code
   */
  async enforcePatterns(code, requirement, patterns) {
    let enforcedCode = code;
    
    // Enforce naming conventions
    enforcedCode = this.enforceNamingPatterns(enforcedCode, patterns);
    
    // Enforce import patterns
    enforcedCode = this.enforceImportPatterns(enforcedCode, patterns);
    
    // Enforce TypeScript patterns
    enforcedCode = this.enforceTypeScriptPatterns(enforcedCode, patterns);
    
    // Enforce formatting
    enforcedCode = this.enforceFormattingPatterns(enforcedCode, patterns);
    
    return enforcedCode;
  }

  enforceNamingPatterns(code, patterns) {
    // This would implement naming convention enforcement
    // For now, return as-is
    return code;
  }

  enforceImportPatterns(code, patterns) {
    // This would implement import organization
    // For now, return as-is
    return code;
  }

  enforceTypeScriptPatterns(code, patterns) {
    // This would implement TypeScript best practices
    // For now, return as-is
    return code;
  }

  enforceFormattingPatterns(code, patterns) {
    // This would implement code formatting
    // For now, return as-is
    return code;
  }

  /**
   * Write generated file to disk
   */
  async writeGeneratedFile(filePath, content) {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, content, 'utf-8');
      
      console.log(`✅ Generated: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error writing file ${filePath}:`, error.message);
      throw error;
    }
  }

  // Helper methods for extracting information from tasks and files
  extractComponentName(filePath) {
    const basename = path.basename(filePath, '.tsx');
    return this.toPascalCase(basename);
  }

  extractAPIName(filePath) {
    const basename = path.basename(filePath, '.ts');
    return this.toCamelCase(basename);
  }

  extractTestName(filePath) {
    const basename = path.basename(filePath, '.test.tsx');
    return this.toPascalCase(basename);
  }

  extractMigrationName(filePath) {
    const basename = path.basename(filePath, '.sql');
    return basename;
  }

  extractNameFromPath(filePath) {
    const basename = path.basename(filePath);
    const name = basename.split('.')[0];
    return name;
  }

  extractPropsFromTask(task) {
    // Extract props from task description or acceptance criteria
    // This is a simplified implementation
    return [
      { name: 'title', type: 'string', optional: false },
      { name: 'description', type: 'string', optional: true }
    ];
  }

  extractFunctionalityFromTask(task) {
    const functionality = [];
    const description = task.description?.toLowerCase() || '';
    
    if (description.includes('state') || description.includes('data')) {
      functionality.push('state');
    }
    if (description.includes('effect') || description.includes('fetch')) {
      functionality.push('effect');
    }
    if (description.includes('click') || description.includes('handle')) {
      functionality.push('handlers');
    }
    
    return functionality;
  }

  extractMethodsFromTask(task) {
    const methods = ['GET'];
    const description = task.description?.toLowerCase() || '';
    
    if (description.includes('create') || description.includes('add')) {
      methods.push('POST');
    }
    if (description.includes('update') || description.includes('edit')) {
      methods.push('PUT');
    }
    if (description.includes('delete') || description.includes('remove')) {
      methods.push('DELETE');
    }
    
    return [...new Set(methods)];
  }

  extractMiddlewareFromTask(task) {
    const middleware = [];
    const description = task.description?.toLowerCase() || '';
    
    if (description.includes('auth') || description.includes('login')) {
      middleware.push('authenticate');
    }
    if (description.includes('validate')) {
      middleware.push('validate');
    }
    if (description.includes('rate') || description.includes('limit')) {
      middleware.push('rateLimit');
    }
    
    return middleware;
  }

  extractMigrationOperations(task) {
    // Extract migration operations from task description
    // This is a simplified implementation
    return [
      { type: 'create_table', table: 'example_table' }
    ];
  }

  getTargetFileForTest(testPath) {
    return testPath.replace('.test.', '.').replace('.spec.', '.');
  }

  determineFileType(filePath) {
    const ext = path.extname(filePath);
    const dir = path.dirname(filePath);
    
    if (ext === '.tsx' && dir.includes('components')) return 'react_component';
    if (ext === '.ts' && dir.includes('api')) return 'api_endpoint';
    if (ext === '.test.tsx' || ext === '.spec.tsx') return 'test_file';
    if (ext === '.sql' && dir.includes('migration')) return 'database_migration';
    if (ext === '.ts' && dir.includes('utils')) return 'utils_utility';
    if (ext === '.ts' && dir.includes('types')) return 'utils_type';
    
    return null;
  }

  extractComponentNameFromPath(filePath) {
    const basename = path.basename(filePath, path.extname(filePath));
    return this.toPascalCase(basename);
  }

  extractAPINameFromPath(filePath) {
    const basename = path.basename(filePath, path.extname(filePath));
    return this.toCamelCase(basename);
  }

  groupFilesByType(files) {
    const grouped = {};
    for (const file of files) {
      if (!grouped[file.type]) grouped[file.type] = 0;
      grouped[file.type]++;
    }
    return grouped;
  }

  generateNextSteps(generatedFiles, plan) {
    const steps = [];
    
    if (generatedFiles.some(f => f.type.includes('component'))) {
      steps.push('Review generated React components and update props/functionality as needed');
    }
    
    if (generatedFiles.some(f => f.type.includes('api'))) {
      steps.push('Implement business logic in generated API endpoints');
    }
    
    if (generatedFiles.some(f => f.type.includes('test'))) {
      steps.push('Run tests and update test cases based on actual implementation');
    }
    
    if (generatedFiles.some(f => f.type.includes('migration'))) {
      steps.push('Review and test database migrations before applying');
    }
    
    steps.push('Run quality gates: type-check, lint, and tests');
    steps.push('Update documentation and API contracts');
    
    return steps;
  }

  // String transformation utilities
  toPascalCase(str) {
    return str.replace(/(?:^|[-_\s])(\w)/g, (_, char) => char.toUpperCase());
  }

  toCamelCase(str) {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  toUpperSnakeCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node code-generator.mjs <plan_file> [options]');
    console.log('Options:');
    console.log('  --dry-run           Generate code without writing files');
    console.log('  --skip-existing     Skip files that already exist (default: true)');
    console.log('  --enforce-patterns  Enforce project patterns (default: true)');
    process.exit(1);
  }

  const planFile = args[0];
  const options = {
    dryRun: false,
    skipExisting: true,
    enforcePatterns: true
  };

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const flag = args[i];
    
    switch (flag) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--skip-existing':
        options.skipExisting = args[i + 1] === 'true';
        i++;
        break;
      case '--enforce-patterns':
        options.enforcePatterns = args[i + 1] === 'true';
        i++;
        break;
    }
  }

  try {
    // Load implementation plan
    const planContent = await fs.readFile(planFile, 'utf-8');
    const plan = JSON.parse(planContent);

    const generator = new CodeGenerator();
    const result = await generator.generateFromPlan(plan, options);
    
    console.log('\n🎯 Code Generation Summary:');
    console.log(`- Total Files: ${result.summary.total_files}`);
    console.log(`- By Type:`, result.summary.by_type);
    console.log(`- Patterns Enforced: ${result.summary.patterns_enforced}`);
    console.log(`- Dry Run: ${result.summary.dry_run}`);
    
    if (result.next_steps.length > 0) {
      console.log('\n📋 Next Steps:');
      result.next_steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
      });
    }

  } catch (error) {
    console.error('❌ Error generating code:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CodeGenerator };