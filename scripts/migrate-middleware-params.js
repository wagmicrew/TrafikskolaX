
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
        console.log(`Migrating: ${file}`);

        // Add type hints or comments about params being resolved
        const updatedContent = this.updateHandlerSignature(content);
        fs.writeFileSync(file, updatedContent);
      }
    }

    console.log('✅ Migration completed');
  }

  updateHandlerSignature(content) {
    // Add JSDoc comment about resolved params
    const handlerPattern = /async function.*handler.*context?s*:s*{[^}]*params?s*:s*Promise/g;

    return content.replace(
      handlerPattern,
      (match) => {
        return match + '\n  /** @param context.params - Already resolved params (not a Promise) */';
      }
    );
  }
}

module.exports = ParamsMigrationHelper;
