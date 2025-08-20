#!/usr/bin/env node

/**
 * TypeScript health check script
 * Identifies TypeScript issues and provides suggestions for fixes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

console.log('🔍 Running TypeScript health check...');

// Run TypeScript compiler to get diagnostics
function runTypeScriptCheck() {
  try {
    console.log('📊 Analyzing TypeScript diagnostics...');
    const output = execSync('npx tsc --noEmit --pretty false', { 
      encoding: 'utf8',
      cwd: projectRoot 
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

// Parse TypeScript errors
function parseTypeScriptErrors(output) {
  const errors = [];
  const lines = output.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Match TypeScript error format: file(line,col): error TS####: message
    const match = line.match(/^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
    if (match) {
      const [, file, line, col, code, message] = match;
      errors.push({
        file: file.replace(projectRoot, '').replace(/^[\\\/]/, ''),
        line: parseInt(line),
        column: parseInt(col),
        code,
        message,
        severity: getSeverity(code, message)
      });
    }
  }
  
  return errors;
}

// Categorize error severity
function getSeverity(code, message) {
  // High priority fixes
  if (code.match(/TS2304|TS2307|TS2345|TS2339/)) {
    return 'high';
  }
  // Medium priority
  if (code.match(/TS2322|TS2571|TS2554/)) {
    return 'medium';
  }
  // Low priority
  return 'low';
}

// Group errors by file
function groupErrorsByFile(errors) {
  return errors.reduce((acc, error) => {
    if (!acc[error.file]) {
      acc[error.file] = [];
    }
    acc[error.file].push(error);
    return acc;
  }, {});
}

// Get error statistics
function getErrorStats(errors) {
  return {
    total: errors.length,
    high: errors.filter(e => e.severity === 'high').length,
    medium: errors.filter(e => e.severity === 'medium').length,
    low: errors.filter(e => e.severity === 'low').length,
    files: new Set(errors.map(e => e.file)).size
  };
}

// Generate common fixes
function generateCommonFixes() {
  return {
    'TS2304': {
      title: 'Cannot find name',
      fixes: [
        'Add missing import statement',
        'Check variable/function name spelling',
        'Ensure the identifier is in scope'
      ]
    },
    'TS2307': {
      title: 'Cannot find module',
      fixes: [
        'Install missing dependency with npm/yarn',
        'Check import path spelling',
        'Add type declarations for third-party modules'
      ]
    },
    'TS2345': {
      title: 'Argument type mismatch',
      fixes: [
        'Check function parameter types',
        'Add type assertions if needed',
        'Update function signature'
      ]
    },
    'TS2339': {
      title: 'Property does not exist',
      fixes: [
        'Check property name spelling',
        'Add property to interface/type',
        'Use optional chaining (?.) if property might not exist'
      ]
    },
    'TS2322': {
      title: 'Type assignment mismatch',
      fixes: [
        'Update variable type annotation',
        'Change assigned value type',
        'Add type assertion if safe'
      ]
    }
  };
}

// Main execution
async function main() {
  console.log('🚀 Starting TypeScript health check...\n');

  // Check if TypeScript is available
  try {
    execSync('npx tsc --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('❌ TypeScript compiler not found. Please install TypeScript.');
    return;
  }

  // Run TypeScript check
  const result = runTypeScriptCheck();
  
  if (result.success && !result.output.trim()) {
    console.log('✅ No TypeScript errors found! Your codebase is healthy.');
    return;
  }

  // Parse errors
  const errors = parseTypeScriptErrors(result.output);
  const stats = getErrorStats(errors);
  const groupedErrors = groupErrorsByFile(errors);
  const commonFixes = generateCommonFixes();

  console.log(`📊 TypeScript Health Summary:`);
  console.log(`   Total errors: ${stats.total}`);
  console.log(`   Files affected: ${stats.files}`);
  console.log(`   High priority: ${stats.high}`);
  console.log(`   Medium priority: ${stats.medium}`);
  console.log(`   Low priority: ${stats.low}\n`);

  // Show top problematic files
  const fileStats = Object.entries(groupedErrors)
    .map(([file, errors]) => ({ file, count: errors.length, errors }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  console.log('🔥 Top 10 files with most TypeScript errors:\n');
  fileStats.forEach((file, index) => {
    console.log(`${index + 1}. ${file.file} (${file.count} errors)`);
    
    // Show first few errors for context
    file.errors.slice(0, 3).forEach(error => {
      const severity = error.severity === 'high' ? '🔴' : error.severity === 'medium' ? '🟡' : '🟢';
      console.log(`   ${severity} Line ${error.line}: ${error.message.substring(0, 80)}...`);
    });
    console.log('');
  });

  // Generate report
  const report = `# TypeScript Health Report

Generated: ${new Date().toISOString()}

## Summary
- **Total Errors:** ${stats.total}
- **Files Affected:** ${stats.files}
- **High Priority:** ${stats.high}
- **Medium Priority:** ${stats.medium}  
- **Low Priority:** ${stats.low}

## Error Breakdown by File

${Object.entries(groupedErrors).map(([file, errors]) => `
### ${file} (${errors.length} errors)

${errors.map(error => `
- **Line ${error.line}:${error.column}** - ${error.code}: ${error.message}
  - *Severity:* ${error.severity}
`).join('')}
`).join('')}

## Common Fixes

${Object.entries(commonFixes).map(([code, fix]) => `
### ${code}: ${fix.title}
${fix.fixes.map(f => `- ${f}`).join('\n')}
`).join('')}

## Recommended Action Plan

1. **Phase 1 (High Priority):** Fix ${stats.high} high-priority errors first
   - These are typically missing imports, undefined variables, or major type mismatches
   
2. **Phase 2 (Medium Priority):** Address ${stats.medium} medium-priority errors  
   - These are usually type assignment issues or incorrect function calls
   
3. **Phase 3 (Low Priority):** Clean up ${stats.low} low-priority errors
   - These are minor type inconsistencies that don't affect functionality

4. **Ongoing:** Enable stricter TypeScript rules gradually
   - Consider enabling additional strict flags in tsconfig.json
   - Add type checking to CI/CD pipeline

## Files Requiring Immediate Attention

${fileStats.slice(0, 5).map((file, i) => `${i + 1}. **${file.file}** - ${file.count} errors`).join('\n')}

## Next Steps

1. Fix high-priority errors in top problematic files
2. Update Next.js config to stop ignoring TypeScript errors in production
3. Set up pre-commit hooks to prevent new TypeScript errors
4. Consider adding stricter TypeScript configurations incrementally
`;

  fs.writeFileSync(path.join(projectRoot, 'TYPESCRIPT_HEALTH_REPORT.md'), report);

  console.log('✅ Health check complete!');
  console.log('📄 Detailed report saved to: TYPESCRIPT_HEALTH_REPORT.md');
  console.log(`\n🎯 Recommended: Focus on ${stats.high} high-priority errors first.`);
}

main().catch(console.error);
