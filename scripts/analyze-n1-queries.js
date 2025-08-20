#!/usr/bin/env node

/**
 * Script to identify potential N+1 query patterns in the codebase
 * Analyzes database query patterns and suggests optimizations
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Patterns that indicate potential N+1 queries
const n1Patterns = [
  // Loop + database query patterns
  {
    pattern: /\.map\s*\(\s*async\s*\([^)]*\)\s*=>\s*[^}]*(?:db\.|sql`|\.execute|fetch\()/,
    severity: 'high',
    description: 'Async map with database query - classic N+1 pattern'
  },
  {
    pattern: /for\s*\([^)]*\)\s*\{[^}]*(?:db\.|sql`|\.execute|fetch\()/,
    severity: 'high',
    description: 'For loop with database query inside'
  },
  {
    pattern: /forEach\s*\(\s*async\s*[^}]*(?:db\.|sql`|\.execute|fetch\()/,
    severity: 'high',
    description: 'forEach with async database query'
  },
  
  // Sequential query patterns
  {
    pattern: /await\s+[^;]*\.map\s*\(\s*async/,
    severity: 'medium',
    description: 'Sequential async operations that could be parallelized'
  },
  {
    pattern: /for\s*\([^)]*\)\s*\{[^}]*await/,
    severity: 'medium',
    description: 'Sequential awaits in loop'
  },
  
  // Missing JOIN patterns
  {
    pattern: /SELECT.*FROM\s+\w+.*WHERE.*=.*\$\{.*\}/,
    severity: 'medium',
    description: 'Parameterized query that might benefit from JOIN'
  },
  
  // React component patterns
  {
    pattern: /useEffect\s*\([^}]*\.map\s*\([^}]*fetch/,
    severity: 'medium',
    description: 'useEffect with mapped fetch calls'
  }
];

// Database performance anti-patterns
const performancePatterns = [
  {
    pattern: /SELECT\s+\*/,
    severity: 'low',
    description: 'SELECT * - consider selecting specific columns'
  },
  {
    pattern: /db\.execute\s*\(\s*sql`.*ORDER BY.*`\s*\)/,
    severity: 'low',
    description: 'ORDER BY without LIMIT - could be expensive'
  },
  {
    pattern: /\.length\s*>\s*0/,
    severity: 'low',
    description: 'Use .length check instead of result.rows?.length > 0'
  }
];

console.log('🔍 Analyzing codebase for N+1 query patterns...');

function analyzeFile(filePath, content) {
  const issues = [];
  
  // Check for N+1 patterns
  n1Patterns.forEach(({ pattern, severity, description }) => {
    const matches = content.match(new RegExp(pattern.source, 'g'));
    if (matches) {
      matches.forEach(match => {
        const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
        issues.push({
          type: 'N+1 Query',
          severity,
          description,
          line: lineNumber,
          code: match.trim(),
          suggestion: getSuggestion(description)
        });
      });
    }
  });
  
  // Check for performance patterns
  performancePatterns.forEach(({ pattern, severity, description }) => {
    const matches = content.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      matches.forEach(match => {
        const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
        issues.push({
          type: 'Performance',
          severity,
          description,
          line: lineNumber,
          code: match.trim(),
          suggestion: getPerformanceSuggestion(description)
        });
      });
    }
  });
  
  return issues;
}

function getSuggestion(description) {
  if (description.includes('map with database query')) {
    return 'Use Promise.all() or batch query with WHERE IN clause';
  }
  if (description.includes('For loop with database query')) {
    return 'Collect IDs first, then use single query with WHERE IN';
  }
  if (description.includes('forEach with async')) {
    return 'Use Promise.all() with map() instead of forEach()';
  }
  if (description.includes('Sequential async')) {
    return 'Use Promise.all() to run queries in parallel';
  }
  if (description.includes('might benefit from JOIN')) {
    return 'Consider using JOIN instead of separate queries';
  }
  return 'Review query pattern for optimization opportunities';
}

function getPerformanceSuggestion(description) {
  if (description.includes('SELECT *')) {
    return 'Select only needed columns: SELECT id, name, email FROM users';
  }
  if (description.includes('ORDER BY without LIMIT')) {
    return 'Add LIMIT clause or consider pagination';
  }
  if (description.includes('length check')) {
    return 'Use result.length > 0 or result?.[0] for better performance';
  }
  return 'Review for performance optimization';
}

// Scan relevant directories
const scanDirs = [
  'app/api/',
  'app/dashboard/',
  'components/',
  'lib/',
];

const allIssues = [];

scanDirs.forEach(dir => {
  const fullDir = path.join(projectRoot, dir);
  if (!fs.existsSync(fullDir)) return;
  
  function scanDirectory(directory) {
    const items = fs.readdirSync(directory);
    
    items.forEach(item => {
      const itemPath = path.join(directory, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(itemPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
        const content = fs.readFileSync(itemPath, 'utf8');
        const relativePath = path.relative(projectRoot, itemPath);
        const issues = analyzeFile(relativePath, content);
        
        if (issues.length > 0) {
          allIssues.push({
            file: relativePath,
            issues: issues
          });
        }
      }
    });
  }
  
  scanDirectory(fullDir);
});

// Sort by severity
const severityOrder = { high: 3, medium: 2, low: 1 };
allIssues.sort((a, b) => {
  const maxSeverityA = Math.max(...a.issues.map(i => severityOrder[i.severity]));
  const maxSeverityB = Math.max(...b.issues.map(i => severityOrder[i.severity]));
  return maxSeverityB - maxSeverityA;
});

console.log(`\n📊 Found potential issues in ${allIssues.length} files:\n`);

// Display results
allIssues.forEach((fileIssues, index) => {
  console.log(`${index + 1}. ${fileIssues.file}`);
  fileIssues.issues.forEach(issue => {
    const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
    console.log(`   ${emoji} ${issue.type}: ${issue.description}`);
    console.log(`      Line ${issue.line}: ${issue.code.substring(0, 80)}...`);
    console.log(`      💡 ${issue.suggestion}`);
  });
  console.log('');
});

// Generate optimization examples
const optimizationExamples = `
# N+1 Query Optimization Examples

## Bad: N+1 Pattern
\`\`\`typescript
// This creates N+1 queries (1 + N where N is users.length)
const users = await db.select().from(usersTable);
const usersWithBookings = await Promise.all(
  users.map(async (user) => ({
    ...user,
    bookings: await db.select().from(bookingsTable).where(eq(bookingsTable.userId, user.id))
  }))
);
\`\`\`

## Good: Single Query with JOIN
\`\`\`typescript
// This uses a single query
const usersWithBookings = await db
  .select({
    userId: usersTable.id,
    userName: usersTable.name,
    bookingId: bookingsTable.id,
    bookingDate: bookingsTable.scheduledAt
  })
  .from(usersTable)
  .leftJoin(bookingsTable, eq(usersTable.id, bookingsTable.userId));
\`\`\`

## Alternative: Batch Query
\`\`\`typescript
// Get users first
const users = await db.select().from(usersTable);
const userIds = users.map(u => u.id);

// Get all bookings in one query
const bookings = await db.select().from(bookingsTable)
  .where(inArray(bookingsTable.userId, userIds));

// Group bookings by userId
const bookingsByUser = bookings.reduce((acc, booking) => {
  acc[booking.userId] = acc[booking.userId] || [];
  acc[booking.userId].push(booking);
  return acc;
}, {});

// Combine data
const usersWithBookings = users.map(user => ({
  ...user,
  bookings: bookingsByUser[user.id] || []
}));
\`\`\`
`;

// Write detailed report
const reportContent = `# N+1 Query Analysis Report

Generated: ${new Date().toISOString()}

## Summary
- **Files analyzed:** ${allIssues.length}
- **High severity issues:** ${allIssues.reduce((sum, f) => sum + f.issues.filter(i => i.severity === 'high').length, 0)}
- **Medium severity issues:** ${allIssues.reduce((sum, f) => sum + f.issues.filter(i => i.severity === 'medium').length, 0)}
- **Low severity issues:** ${allIssues.reduce((sum, f) => sum + f.issues.filter(i => i.severity === 'low').length, 0)}

## Detailed Results

${allIssues.map((fileIssues, index) => `
### ${index + 1}. ${fileIssues.file}

${fileIssues.issues.map(issue => `
**${issue.severity.toUpperCase()}:** ${issue.description}
- **Line:** ${issue.line}
- **Code:** \`${issue.code}\`
- **Suggestion:** ${issue.suggestion}
`).join('')}
`).join('')}

${optimizationExamples}

## Recommended Actions:
1. **Priority 1:** Fix high-severity N+1 query patterns
2. **Priority 2:** Optimize medium-severity issues  
3. **Priority 3:** Address performance anti-patterns
4. **Monitor:** Set up query performance monitoring
5. **Test:** Measure performance improvements after fixes
`;

fs.writeFileSync(path.join(projectRoot, 'N1_QUERY_ANALYSIS.md'), reportContent);

console.log('✅ Analysis complete!');
console.log('📄 Report saved to: N1_QUERY_ANALYSIS.md');
console.log(`\n🎯 Focus on ${allIssues.filter(f => f.issues.some(i => i.severity === 'high')).length} files with high-severity issues first.`);
