const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function batchUpdateParams() {
  console.log('🔄 Starting batch update of context.params...\n');

  const files = await glob('app/api/**/*.ts', {
    ignore: ['**/node_modules/**', '**/*.d.ts']
  });

  let updatedCount = 0;

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check if file uses context.params with Promise type
      if (content.includes('context: { params: Promise<')) {
        console.log(`📄 Updating: ${filePath}`);

        // Add JSDoc comment
        const functionMatch = content.match(/(export async function \w+\([^)]+context: \{ params: Promise<[^}]+>\s*\})/);
        if (functionMatch) {
          const functionSignature = functionMatch[1];
          const comment = `/**\\n * @param context.params - Already resolved by middleware (not a Promise)\\n */\\n`;

          // Replace the function signature with comment + updated signature
          const updatedSignature = functionSignature
            .replace('Promise<{', '{')
            .replace('Promise<Record<', 'Record<');

          const newContent = content.replace(
            functionSignature,
            comment + updatedSignature
          );

          // Also remove await from context.params usage
          const updatedContent = newContent.replace(
            /const\s*\{\s*[^}]*\}\s*=\s*await\s*context\.params/g,
            (match) => match.replace('await ', '')
          );

          fs.writeFileSync(filePath, updatedContent);
          updatedCount++;
          console.log(`   ✅ Updated successfully`);
        }
      }
    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
    }
  }

  console.log(`\\n✅ Batch update completed! Updated ${updatedCount} files.`);
}

// Run the batch update
batchUpdateParams().catch(console.error);
