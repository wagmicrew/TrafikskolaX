const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class DrizzleORMAnalyzer {
  constructor() {
    this.findings = {
      drizzleORM: [],
      rawSQL: [],
      mixedUsage: [],
      issues: [],
      filesAnalyzed: 0
    };
  }

  async analyzeCodebase() {
    console.log('🔍 Starting Drizzle ORM Analysis...\n');

    const files = await glob('**/*.{js,ts,tsx}', {
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        'logs/**',
        'scripts/drizzle-orm-analyzer.js'
      ]
    });

    console.log(`📁 Found ${files.length} files to analyze\n`);

    for (const file of files) {
      await this.analyzeFile(file);
    }

    this.generateReport();
  }

  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.findings.filesAnalyzed++;

      const analysis = {
        file: filePath,
        drizzleORM: [],
        rawSQL: [],
        issues: []
      };

      // Check for Drizzle ORM patterns
      const drizzlePatterns = [
        { pattern: /\.select\(/g, type: 'SELECT' },
        { pattern: /\.from\(/g, type: 'FROM' },
        { pattern: /\.where\(/g, type: 'WHERE' },
        { pattern: /\.insert\(/g, type: 'INSERT' },
        { pattern: /\.update\(/g, type: 'UPDATE' },
        { pattern: /\.delete\(/g, type: 'DELETE' },
        { pattern: /eq\(|ne\(|gt\(|lt\(|gte\(|lte\(|like\(|ilike\(/g, type: 'CONDITIONS' }
      ];

      // Check for raw SQL patterns
      const rawSQLPatterns = [
        { pattern: /db\.execute\s*\(\s*sql`/g, type: 'RAW_EXECUTE' },
        { pattern: /sql`/g, type: 'SQL_TEMPLATE' },
        { pattern: /db\.execute\s*\(\s*`/g, type: 'STRING_EXECUTE' }
      ];

      let hasDrizzle = false;
      let hasRawSQL = false;

      // Analyze Drizzle ORM usage
      for (const { pattern, type } of drizzlePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          hasDrizzle = true;
          analysis.drizzleORM.push({
            type,
            count: matches.length,
            pattern: pattern.source
          });
        }
      }

      // Analyze raw SQL usage
      for (const { pattern, type } of rawSQLPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          hasRawSQL = true;
          analysis.rawSQL.push({
            type,
            count: matches.length,
            pattern: pattern.source
          });
        }
      }

      // Check for potential issues
      this.checkForIssues(content, filePath, analysis);

      // Categorize file
      if (hasDrizzle && !hasRawSQL) {
        this.findings.drizzleORM.push(analysis);
      } else if (!hasDrizzle && hasRawSQL) {
        this.findings.rawSQL.push(analysis);
      } else if (hasDrizzle && hasRawSQL) {
        this.findings.mixedUsage.push(analysis);
      }

    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
    }
  }

  checkForIssues(content, filePath, analysis) {
    const issues = [];

    // Check for common issues
    if (content.includes('sql`') && content.includes('.select(')) {
      issues.push('Mixed usage of raw SQL and Drizzle ORM in same file');
    }

    if (content.includes('db.execute(sql`') && content.includes('.select(')) {
      issues.push('Using both raw execute and Drizzle ORM queries');
    }

    // Check for raw SQL without proper parameterization
    const rawQueries = content.match(/sql`[\s\S]*?`/g);
    if (rawQueries) {
      for (const query of rawQueries) {
        if (query.includes('SELECT') && query.includes('${') && !query.includes('WHERE')) {
          issues.push('Raw SQL query with variables but no WHERE clause - potential security risk');
        }
      }
    }

    // Check for N+1 query patterns
    if (content.includes('.map(') && (content.includes('.select(') || content.includes('db.execute('))) {
      issues.push('Potential N+1 query pattern detected');
    }

    // Check for missing transactions
    if ((content.includes('.insert(') || content.includes('.update(') || content.includes('.delete(')) &&
        !content.includes('db.transaction(') && !content.includes('sql`BEGIN`')) {
      issues.push('Multiple write operations without transaction');
    }

    analysis.issues = issues;
    if (issues.length > 0) {
      this.findings.issues.push({
        file: filePath,
        issues
      });
    }
  }

  generateReport() {
    console.log('📊 DRIZZLE ORM ANALYSIS REPORT\n');
    console.log('=' .repeat(50));

    console.log(`📁 Files Analyzed: ${this.findings.filesAnalyzed}`);
    console.log(`✅ Pure Drizzle ORM: ${this.findings.drizzleORM.length} files`);
    console.log(`⚠️  Raw SQL Only: ${this.findings.rawSQL.length} files`);
    console.log(`🔄 Mixed Usage: ${this.findings.mixedUsage.length} files`);
    console.log(`❌ Issues Found: ${this.findings.issues.length} files`);

    console.log('\n' + '=' .repeat(50));
    console.log('🔍 DETAILED ANALYSIS\n');

    // Report issues
    if (this.findings.issues.length > 0) {
      console.log('\n❌ FILES WITH ISSUES:');
      this.findings.issues.forEach(item => {
        console.log(`  📄 ${item.file}`);
        item.issues.forEach(issue => {
          console.log(`    ⚠️  ${issue}`);
        });
      });
    }

    // Report mixed usage
    if (this.findings.mixedUsage.length > 0) {
      console.log('\n🔄 FILES WITH MIXED USAGE (Drizzle + Raw SQL):');
      this.findings.mixedUsage.forEach(item => {
        console.log(`  📄 ${item.file}`);
        console.log(`    Drizzle: ${JSON.stringify(item.drizzleORM)}`);
        console.log(`    Raw SQL: ${JSON.stringify(item.rawSQL)}`);
      });
    }

    // Report raw SQL only files
    if (this.findings.rawSQL.length > 0) {
      console.log('\n⚠️  FILES USING ONLY RAW SQL:');
      this.findings.rawSQL.forEach(item => {
        console.log(`  📄 ${item.file}`);
        console.log(`    Raw SQL: ${JSON.stringify(item.rawSQL)}`);
      });
    }

    // Save detailed report
    this.saveDetailedReport();
  }

  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        filesAnalyzed: this.findings.filesAnalyzed,
        drizzleORM: this.findings.drizzleORM.length,
        rawSQL: this.findings.rawSQL.length,
        mixedUsage: this.findings.mixedUsage.length,
        issues: this.findings.issues.length
      },
      details: this.findings
    };

    const reportPath = path.join(process.cwd(), 'logs', 'drizzle-orm-analysis.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  }

  // Additional analysis methods
  async findAllQueries() {
    console.log('\n🔍 EXTRACTING ALL DATABASE QUERIES...\n');

    const files = await glob('**/*.{js,ts,tsx}', {
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        'logs/**',
        'scripts/drizzle-orm-analyzer.js'
      ]
    });

    const allQueries = {
      drizzleQueries: [],
      rawSQLQueries: [],
      problematicQueries: []
    };

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Extract Drizzle ORM queries
      const drizzleMatches = content.match(/\.select\(|\.insert\(|\.update\(|\.delete\(/g);
      if (drizzleMatches) {
        allQueries.drizzleQueries.push({
          file,
          type: 'Drizzle ORM',
          operations: drizzleMatches.map(m => m.replace(/[().]/g, '').toUpperCase())
        });
      }

      // Extract raw SQL queries
      const sqlMatches = content.match(/sql`[\s\S]*?`/g);
      if (sqlMatches) {
        allQueries.rawSQLQueries.push({
          file,
          type: 'Raw SQL',
          queries: sqlMatches.map(q => q.replace(/sql`/g, '').replace(/`/g, '').trim())
        });
      }

      // Find potentially problematic patterns
      if (content.includes('sql`') && content.includes('.select(')) {
        allQueries.problematicQueries.push({
          file,
          issue: 'Mixed usage of raw SQL and Drizzle ORM',
          severity: 'Medium'
        });
      }

      if (content.includes('${') && content.includes('sql`') && !content.includes('WHERE')) {
        allQueries.problematicQueries.push({
          file,
          issue: 'Raw SQL query with variables but no WHERE clause',
          severity: 'High'
        });
      }
    }

    const queriesPath = path.join(process.cwd(), 'logs', 'all-queries.json');
    fs.mkdirSync(path.dirname(queriesPath), { recursive: true });
    fs.writeFileSync(queriesPath, JSON.stringify(allQueries, null, 2));

    console.log(`📋 All queries logged to: ${queriesPath}`);
    console.log(`   - Drizzle queries: ${allQueries.drizzleQueries.length} files`);
    console.log(`   - Raw SQL queries: ${allQueries.rawSQLQueries.length} files`);
    console.log(`   - Problematic queries: ${allQueries.problematicQueries.length} files`);
  }
}

// Run the analyzer
async function main() {
  const analyzer = new DrizzleORMAnalyzer();

  // Run analysis
  await analyzer.analyzeCodebase();

  // Find all queries
  await analyzer.findAllQueries();

  console.log('\n✅ Analysis complete! Check logs/ directory for detailed reports.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DrizzleORMAnalyzer;
