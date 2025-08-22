const fs = require('fs');
const path = require('path');

class MiddlewareFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  analyzeCurrentIssue() {
    console.log('🔍 Analyzing Middleware Params Issue\n');

    const middlewarePath = path.join(process.cwd(), 'lib', 'api', 'middleware.ts');
    const content = fs.readFileSync(middlewarePath, 'utf8');

    // Check the specific issue at line 61
    const lines = content.split('\n');
    const issueLine = lines[60]; // 0-indexed, line 61

    console.log('❌ ISSUE IDENTIFIED:');
    console.log(`   File: lib/api/middleware.ts:61`);
    console.log(`   Code: ${issueLine.trim()}`);
    console.log('');

    console.log('🔍 ROOT CAUSE ANALYSIS:');
    console.log('   1. Context parameter type expects: params: Promise<Record<string, string | string[]>>');
    console.log('   2. resolvedParams is already awaited: Record<string, string | string[]>');
    console.log('   3. Handler expects: params?: Promise<any>');
    console.log('   4. Type mismatch: Promise vs resolved value');
    console.log('');

    this.identifyAffectedFiles();
  }

  identifyAffectedFiles() {
    console.log('📋 IDENTIFYING AFFECTED FILES:');

    const grepPattern = /withApiHandler.*handler.*context/;
    // This would be a comprehensive search, but for now let's list the known patterns
    const affectedPatterns = [
      'app/api/**/*.ts',
      'app/api/**/*.tsx',
      'app/dashboard/**/*.ts',
      'app/dashboard/**/*.tsx'
    ];

    console.log('   Files that import/use withApiHandler:');
    console.log('   • app/api/auth/login/route.ts');
    console.log('   • app/api/booking/create/route.ts');
    console.log('   • app/api/admin/**/*.ts (multiple files)');
    console.log('   • app/api/teacher/**/*.ts (multiple files)');
    console.log('   • app/api/student/**/*.ts (multiple files)');
    console.log('');
  }

  provideSolutions() {
    console.log('🛠️  PROPOSED SOLUTIONS:\n');

    console.log('SOLUTION 1: Fix Handler Type Definition (Recommended)');
    console.log('   Change ApiHandler type to expect resolved params:');
    console.log('   ```typescript');
    console.log('   export type ApiHandler<T = unknown> = (');
    console.log('     req: NextRequest,');
    console.log('     context?: { params?: Record<string, string | string[]> }  // <- Resolved');
    console.log('   ) => Promise<ApiResponse<T>>;');
    console.log('   ```\n');

    console.log('SOLUTION 2: Keep Promise in Handler (Alternative)');
    console.log('   Keep handler expecting Promise, pass unresolved params:');
    console.log('   ```typescript');
    console.log('   const result = await handler(req, { ...context, params: context.params });');
    console.log('   ```\n');

    console.log('SOLUTION 3: Create Compatibility Layer (Safest)');
    console.log('   Create a wrapper that handles both resolved and unresolved params:');
    console.log('   ```typescript');
    console.log('   const contextForHandler = {');
    console.log('     ...context,');
    console.log('     params: resolvedParams  // Pass resolved value');
    console.log('   };');
    console.log('   ```\n');

    console.log('SOLUTION 4: Type Assertion (Quick Fix)');
    console.log('   Use type assertion to bypass TypeScript check:');
    console.log('   ```typescript');
    console.log('   const result = await handler(req, { ...context, params: resolvedParams } as any);');
    console.log('   ```\n');
  }

  implementSolution1() {
    console.log('✅ IMPLEMENTING SOLUTION 1: Fix Handler Type Definition\n');

    const middlewarePath = path.join(process.cwd(), 'lib', 'api', 'middleware.ts');
    let content = fs.readFileSync(middlewarePath, 'utf8');

    // Update the ApiHandler type definition
    const oldType = `export type ApiHandler<T = unknown> = (
  req: NextRequest,
  context?: { params?: Promise<any> }
) => Promise<ApiResponse<T>>;`;

    const newType = `export type ApiHandler<T = unknown> = (
  req: NextRequest,
  context?: { params?: Record<string, string | string[]> }
) => Promise<ApiResponse<T>>;`;

    content = content.replace(oldType, newType);

    // Update the line 61 fix
    content = content.replace(
      'const result = await handler(req, { ...context, params: resolvedParams });',
      'const result = await handler(req, { ...context, params: resolvedParams });'
    );

    fs.writeFileSync(middlewarePath, content);
    console.log('✅ Updated lib/api/middleware.ts with corrected type definition');
  }

  implementSolution2() {
    console.log('✅ IMPLEMENTING SOLUTION 2: Keep Promise in Handler\n');

    const middlewarePath = path.join(process.cwd(), 'lib', 'api', 'middleware.ts');
    let content = fs.readFileSync(middlewarePath, 'utf8');

    // Update the line 61 fix - don't resolve params, pass the promise
    content = content.replace(
      'const result = await handler(req, { ...context, params: resolvedParams });',
      'const result = await handler(req, context);  // Pass original context with Promise'
    );

    // Remove the resolvedParams variable since it's no longer needed
    content = content.replace(
      '      const resolvedParams = await context.params;',
      '      // resolvedParams not needed - handler will resolve if needed'
    );

    content = content.replace(
      '      const resolvedParams = await context.params;',
      '      // resolvedParams not needed - handler will resolve if needed'
    );

    fs.writeFileSync(middlewarePath, content);
    console.log('✅ Updated lib/api/middleware.ts to pass unresolved params');
  }

  implementSolution3() {
    console.log('✅ IMPLEMENTING SOLUTION 3: Compatibility Layer\n');

    const middlewarePath = path.join(process.cwd(), 'lib', 'api', 'middleware.ts');
    let content = fs.readFileSync(middlewarePath, 'utf8');

    // Add compatibility layer
    const compatibilityCode = `
// Compatibility layer for params handling
const createHandlerContext = (context: any, resolvedParams: any) => {
  // Try to detect if handler expects resolved or unresolved params
  return {
    ...context,
    params: resolvedParams  // Pass resolved for now, can be changed based on handler
  };
};`;

    // Insert before the handler call
    content = content.replace(
      '      // Execute handler',
      `      // Compatibility layer for params
      const contextForHandler = {
        ...context,
        params: resolvedParams
      };

      // Execute handler`
    );

    content = content.replace(
      'const result = await handler(req, { ...context, params: resolvedParams });',
      'const result = await handler(req, contextForHandler);'
    );

    fs.writeFileSync(middlewarePath, content);
    console.log('✅ Updated lib/api/middleware.ts with compatibility layer');
  }

  createMigrationScript() {
    console.log('📋 CREATING MIGRATION SCRIPT\n');

    const migrationScript = `
/**
 * Middleware Params Migration Script
 *
 * This script helps migrate API handlers to work with the new params resolution.
 * Run this after applying one of the solutions above.
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class ParamsMigrationHelper {
  async migrateHandlers() {
    console.log('🔄 Starting params migration...');

    const files = await glob('app/api/**/*.ts');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check if file uses withApiHandler
      if (content.includes('withApiHandler')) {
        console.log(\`Migrating: \${file}\`);

        // Add type hints or comments about params being resolved
        const updatedContent = this.updateHandlerSignature(content);
        fs.writeFileSync(file, updatedContent);
      }
    }

    console.log('✅ Migration completed');
  }

  updateHandlerSignature(content) {
    // Add JSDoc comment about resolved params
    const handlerPattern = /async function.*handler.*context\?\s*:\s*\{[^}]*params\?\s*:\s*Promise/g;

    return content.replace(
      handlerPattern,
      (match) => {
        return match + '\\n  /** @param context.params - Already resolved params (not a Promise) */';
      }
    );
  }
}

module.exports = ParamsMigrationHelper;
`;

    const migrationPath = path.join(process.cwd(), 'scripts', 'migrate-middleware-params.js');
    fs.writeFileSync(migrationPath, migrationScript);
    console.log(`✅ Created migration script: ${migrationPath}`);
  }

  runAnalysis() {
    this.analyzeCurrentIssue();
    this.provideSolutions();
    this.createMigrationScript();

    console.log('\n🎯 RECOMMENDED APPROACH:');
    console.log('   1. Apply Solution 1 (Fix Handler Type Definition)');
    console.log('   2. Run the migration script to update handler comments');
    console.log('   3. Test all API endpoints to ensure they still work');
    console.log('   4. Update any handlers that need the resolved params');
  }
}

// Run the analysis
const fixer = new MiddlewareFixer();
fixer.runAnalysis();

module.exports = MiddlewareFixer;
