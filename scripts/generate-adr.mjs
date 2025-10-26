#!/usr/bin/env node

/**
 * Architecture Decision Record (ADR) Generator
 * 
 * Generates ADRs for breaking changes and significant architectural decisions
 */

import { writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const adrDir = join(projectRoot, 'docs', 'adrs');

// Ensure ADR directory exists
if (!existsSync(adrDir)) {
  mkdirSync(adrDir, { recursive: true });
}

class ADRGenerator {
  constructor(context) {
    this.context = context;
    this.adrNumber = this.getNextADRNumber();
  }

  generate() {
    console.log(`📝 Generating ADR ${this.adrNumber}...`);
    
    const adr = this.buildADR();
    const filename = this.formatFilename();
    const filepath = join(adrDir, filename);
    
    writeFileSync(filepath, adr);
    
    console.log(`✅ ADR generated: ${filepath}`);
    return filepath;
  }

  getNextADRNumber() {
    try {
      const files = readdirSync(adrDir);
      const adrFiles = files.filter(f => f.match(/^\d{4}-/));
      
      if (adrFiles.length === 0) {
        return 1;
      }
      
      const numbers = adrFiles.map(f => parseInt(f.substring(0, 4)));
      return Math.max(...numbers) + 1;
    } catch (error) {
      return 1;
    }
  }

  formatFilename() {
    const paddedNumber = this.adrNumber.toString().padStart(4, '0');
    const title = this.context.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    
    return `${paddedNumber}-${title}.md`;
  }

  buildADR() {
    const date = new Date().toISOString().split('T')[0];
    
    return `# ADR ${this.adrNumber}: ${this.context.title}

## Status

${this.context.status || 'Proposed'}

## Context

${this.context.context || 'Context not provided'}

## Decision

${this.context.decision || 'Decision not provided'}

## Consequences

### Positive

${this.formatList(this.context.consequences?.positive || [])}

### Negative

${this.formatList(this.context.consequences?.negative || [])}

### Neutral

${this.formatList(this.context.consequences?.neutral || [])}

## Implementation

${this.context.implementation || 'Implementation details not provided'}

## Migration Strategy

${this.context.migration || 'No migration required'}

## Rollback Plan

${this.context.rollback || 'Rollback plan not provided'}

## Monitoring and Validation

${this.context.monitoring || 'Standard monitoring applies'}

## Related Decisions

${this.formatList(this.context.related || [])}

## References

${this.formatList(this.context.references || [])}

---

**Date:** ${date}  
**Author:** Spec-to-Code Autopilot  
**Reviewers:** ${this.context.reviewers || 'TBD'}  
**Status:** ${this.context.status || 'Proposed'}
`;
  }

  formatList(items) {
    if (!items || items.length === 0) {
      return 'None specified';
    }
    
    return items.map(item => `- ${item}`).join('\n');
  }
}

// Predefined ADR templates for common scenarios
const ADR_TEMPLATES = {
  'api-breaking-change': {
    title: 'API Breaking Change',
    context: `We need to make breaking changes to the API to improve functionality and maintainability.
    
The current API has limitations that prevent us from implementing new features effectively. The proposed changes will break backward compatibility but provide significant improvements.`,
    
    decision: `We will implement the breaking API changes with proper versioning and migration support.
    
Key changes:
- Update API endpoints
- Modify request/response schemas
- Implement new validation rules`,
    
    consequences: {
      positive: [
        'Improved API design and consistency',
        'Better performance and scalability',
        'Enhanced developer experience',
        'Future-proof architecture'
      ],
      negative: [
        'Breaking changes require client updates',
        'Migration effort for existing users',
        'Temporary disruption during transition',
        'Documentation updates required'
      ],
      neutral: [
        'API versioning strategy needed',
        'Deprecation timeline must be communicated'
      ]
    },
    
    implementation: `1. Implement new API version alongside existing
2. Update OpenAPI specifications
3. Create migration tools and documentation
4. Implement backward compatibility layer (temporary)
5. Update client SDKs and examples`,
    
    migration: `1. Announce breaking changes with 30-day notice
2. Provide migration guide and tools
3. Offer support during transition period
4. Maintain old API version for 6 months
5. Gradually deprecate old endpoints`,
    
    rollback: `1. Revert to previous API version
2. Restore old endpoint configurations
3. Update load balancer routing
4. Communicate rollback to users
5. Investigate and fix issues before re-deployment`,
    
    monitoring: `1. Monitor API usage metrics for both versions
2. Track migration progress
3. Monitor error rates and performance
4. Set up alerts for unusual patterns
5. Collect user feedback during transition`
  },
  
  'database-schema-change': {
    title: 'Database Schema Change',
    context: `Database schema modifications are required to support new features and improve data integrity.`,
    
    decision: `Implement database schema changes with proper migration strategy.`,
    
    consequences: {
      positive: [
        'Improved data model',
        'Better performance',
        'Enhanced data integrity'
      ],
      negative: [
        'Downtime during migration',
        'Risk of data loss',
        'Rollback complexity'
      ]
    },
    
    implementation: `1. Create migration scripts
2. Test on staging environment
3. Backup production data
4. Execute migration during maintenance window`,
    
    migration: `1. Create backward-compatible migration
2. Test rollback procedures
3. Coordinate with deployment pipeline`,
    
    rollback: `1. Restore from backup
2. Revert migration scripts
3. Update application configuration`
  },
  
  'technology-adoption': {
    title: 'Technology Adoption',
    context: `Evaluation of new technology adoption for improved development experience and capabilities.`,
    
    decision: `Adopt new technology with gradual integration approach.`,
    
    consequences: {
      positive: [
        'Improved development productivity',
        'Better performance characteristics',
        'Enhanced maintainability'
      ],
      negative: [
        'Learning curve for team',
        'Additional complexity',
        'Migration effort required'
      ]
    },
    
    implementation: `1. Pilot implementation in non-critical areas
2. Team training and documentation
3. Gradual rollout across codebase`,
    
    migration: `1. Identify migration candidates
2. Create migration tools and guides
3. Execute phased migration`,
    
    rollback: `1. Revert to previous technology
2. Restore old implementations
3. Update build and deployment processes`
  }
};

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📝 ADR Generator');
    console.log('\nUsage:');
    console.log('  node generate-adr.mjs <template> [title]');
    console.log('  node generate-adr.mjs custom --context "..." --decision "..."');
    console.log('\nAvailable templates:');
    Object.keys(ADR_TEMPLATES).forEach(template => {
      console.log(`  - ${template}`);
    });
    process.exit(0);
  }
  
  const template = args[0];
  
  let context;
  
  if (template === 'custom') {
    // Build custom ADR from command line arguments
    context = {
      title: getArgValue('--title') || 'Custom Decision',
      context: getArgValue('--context') || 'Context not provided',
      decision: getArgValue('--decision') || 'Decision not provided',
      status: getArgValue('--status') || 'Proposed'
    };
  } else if (ADR_TEMPLATES[template]) {
    // Use predefined template
    context = { ...ADR_TEMPLATES[template] };
    
    // Override title if provided
    if (args[1]) {
      context.title = args[1];
    }
  } else {
    console.error(`❌ Unknown template: ${template}`);
    console.log('Available templates:', Object.keys(ADR_TEMPLATES).join(', '));
    process.exit(1);
  }
  
  try {
    const generator = new ADRGenerator(context);
    const filepath = generator.generate();
    
    console.log('\n✅ ADR generated successfully!');
    console.log(`📄 File: ${filepath}`);
    console.log('\n📋 Next steps:');
    console.log('  1. Review and customize the generated ADR');
    console.log('  2. Add specific implementation details');
    console.log('  3. Get team review and approval');
    console.log('  4. Update status when implemented');
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 ADR generation failed:', error.message);
    process.exit(1);
  }
}

function getArgValue(argName) {
  const args = process.argv;
  const index = args.indexOf(argName);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

// Export for testing
export { ADRGenerator, ADR_TEMPLATES };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}