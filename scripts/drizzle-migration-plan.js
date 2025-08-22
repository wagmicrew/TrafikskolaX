const fs = require('fs');
const path = require('path');

class DrizzleMigrationPlanner {
  constructor() {
    this.plan = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
  }

  async createMigrationPlan() {
    console.log('🔧 Creating Drizzle ORM Migration Plan...\n');

    // Load analysis results
    const analysisPath = path.join(process.cwd(), 'logs', 'drizzle-orm-analysis.json');
    if (!fs.existsSync(analysisPath)) {
      throw new Error('Analysis results not found. Run the analyzer first.');
    }

    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

    this.categorizeIssues(analysis);
    this.generateMigrationPlan();
    this.savePlan();

    return this.plan;
  }

  categorizeIssues(analysis) {
    const { issues, rawSQL, mixedUsage } = analysis.details;

    // Critical: Security risks and data integrity
    issues.forEach(item => {
      if (item.issues.some(issue =>
        issue.includes('Raw SQL query with variables but no WHERE clause') ||
        issue.includes('potential security risk')
      )) {
        this.plan.critical.push({
          file: item.file,
          issues: item.issues,
          priority: 'CRITICAL',
          reason: 'Security vulnerability'
        });
      }
    });

    // High: Mixed usage and transaction issues
    mixedUsage.forEach(item => {
      this.plan.high.push({
        file: item.file,
        type: 'Mixed Usage',
        drizzleOps: item.drizzleORM,
        rawSQLOps: item.rawSQL,
        priority: 'HIGH',
        reason: 'Inconsistent ORM usage'
      });
    });

    // High: Multiple write operations without transactions
    issues.forEach(item => {
      if (item.issues.some(issue =>
        issue.includes('Multiple write operations without transaction')
      )) {
        this.plan.high.push({
          file: item.file,
          issues: item.issues,
          priority: 'HIGH',
          reason: 'Data integrity risk'
        });
      }
    });

    // Medium: N+1 query patterns
    issues.forEach(item => {
      if (item.issues.some(issue =>
        issue.includes('Potential N+1 query pattern')
      )) {
        this.plan.medium.push({
          file: item.file,
          issues: item.issues,
          priority: 'MEDIUM',
          reason: 'Performance optimization'
        });
      }
    });

    // Low: Pure raw SQL files (migration candidates)
    rawSQL.forEach(item => {
      this.plan.low.push({
        file: item.file,
        rawSQL: item.rawSQL,
        priority: 'LOW',
        reason: 'Gradual migration'
      });
    });
  }

  generateMigrationPlan() {
    console.log('📋 Generating Migration Strategy...\n');

    this.plan.strategy = {
      phases: [
        {
          phase: 1,
          name: 'Critical Security Fixes',
          duration: '1-2 days',
          tasks: this.plan.critical.length,
          description: 'Fix security vulnerabilities and data integrity issues'
        },
        {
          phase: 2,
          name: 'High Priority Consistency',
          duration: '3-5 days',
          tasks: this.plan.high.length,
          description: 'Standardize ORM usage and add transaction support'
        },
        {
          phase: 3,
          name: 'Medium Priority Optimization',
          duration: '2-3 days',
          tasks: this.plan.medium.length,
          description: 'Optimize query patterns and performance'
        },
        {
          phase: 4,
          name: 'Low Priority Migration',
          duration: '1-2 weeks',
          tasks: this.plan.low.length,
          description: 'Gradual migration of remaining raw SQL'
        }
      ],

      tools: [
        'Drizzle ORM migration utilities',
        'Database transaction wrappers',
        'Query performance monitoring',
        'Automated testing for each fix'
      ],

      validation: [
        'Unit tests for each migrated query',
        'Performance benchmarks',
        'Security audit of parameterized queries',
        'Data integrity checks'
      ]
    };
  }

  savePlan() {
    const planPath = path.join(process.cwd(), 'logs', 'drizzle-migration-plan.json');
    fs.mkdirSync(path.dirname(planPath), { recursive: true });

    const report = {
      generated: new Date().toISOString(),
      summary: {
        critical: this.plan.critical.length,
        high: this.plan.high.length,
        medium: this.plan.medium.length,
        low: this.plan.low.length,
        total: this.plan.critical.length + this.plan.high.length + this.plan.medium.length + this.plan.low.length
      },
      plan: this.plan
    };

    fs.writeFileSync(planPath, JSON.stringify(report, null, 2));
    console.log(`💾 Migration plan saved to: ${planPath}`);
  }

  printPlan() {
    console.log('\n🚀 DRIZZLE ORM MIGRATION PLAN\n');
    console.log('=' .repeat(50));

    console.log(`📊 Total Issues: ${this.plan.critical.length + this.plan.high.length + this.plan.medium.length + this.plan.low.length}`);
    console.log(`🔴 Critical: ${this.plan.critical.length} (Security/Data Integrity)`);
    console.log(`🟠 High: ${this.plan.high.length} (Consistency/Transactions)`);
    console.log(`🟡 Medium: ${this.plan.medium.length} (Performance)`);
    console.log(`🟢 Low: ${this.plan.low.length} (Migration Candidates)`);

    console.log('\n📈 MIGRATION PHASES:\n');

    this.plan.strategy.phases.forEach((phase, index) => {
      console.log(`${index + 1}. ${phase.name}`);
      console.log(`   ⏱️  Duration: ${phase.duration}`);
      console.log(`   📋 Tasks: ${phase.tasks}`);
      console.log(`   📝 ${phase.description}\n`);
    });

    console.log('🛠️  RECOMMENDED TOOLS:');
    this.plan.strategy.tools.forEach(tool => {
      console.log(`   • ${tool}`);
    });

    console.log('\n✅ VALIDATION STEPS:');
    this.plan.strategy.validation.forEach(step => {
      console.log(`   • ${step}`);
    });

    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   • Each phase should be completed and tested before moving to next');
    console.log('   • Critical security issues must be fixed first');
    console.log('   • Maintain backward compatibility during migration');
    console.log('   • Regular database backups recommended');
    console.log('   • Monitor performance impact of changes');
  }
}

// Example usage and immediate recommendations
async function main() {
  const planner = new DrizzleMigrationPlanner();
  await planner.createMigrationPlan();
  planner.printPlan();

  console.log('\n\n🎯 IMMEDIATE ACTION ITEMS:\n');

  if (planner.plan.critical.length > 0) {
    console.log('🔴 CRITICAL - Fix Immediately:');
    planner.plan.critical.slice(0, 5).forEach(item => {
      console.log(`   • ${item.file} - ${item.reason}`);
    });
  }

  if (planner.plan.high.length > 0) {
    console.log('\n🟠 HIGH PRIORITY - This Sprint:');
    planner.plan.high.slice(0, 5).forEach(item => {
      console.log(`   • ${item.file} - ${item.reason}`);
    });
  }

  console.log('\n📋 Full plan available in: logs/drizzle-migration-plan.json');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DrizzleMigrationPlanner;
