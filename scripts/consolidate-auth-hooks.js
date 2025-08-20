#!/usr/bin/env node

/**
 * Script to consolidate duplicate auth hooks safely
 * Replaces imports of the simplified use-auth.ts with the full useAuth.tsx
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Files that use the simplified auth hook
const filesToUpdate = [
  'app/dashboard/student/meddelande/messages-client.tsx',
  'app/dashboard/student/meddelande/message-composer.tsx'
];

// Interface mapping for compatibility
const interfaceMapping = {
  'User': 'JWTPayload',
  'loading': 'isLoading',
  'user.name': 'user ? `${user.firstName} ${user.lastName}` : ""'
};

console.log('🔄 Starting auth hooks consolidation...');

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace import statement
  if (content.includes("from '@/lib/hooks/use-auth'")) {
    content = content.replace(
      "from '@/lib/hooks/use-auth'",
      "from '@/lib/hooks/useAuth'"
    );
    modified = true;
    console.log(`✅ Updated import in: ${filePath}`);
  }

  // Replace interface usage if needed
  if (content.includes('User')) {
    // Add a comment for manual review of User interface usage
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      if (line.includes('User') && !line.includes('// TODO: Review User -> JWTPayload')) {
        return line + ' // TODO: Review User -> JWTPayload conversion if needed';
      }
      return line;
    });
    content = updatedLines.join('\n');
    modified = true;
  }

  // Replace loading with isLoading
  if (content.includes('loading')) {
    content = content.replace(/\bloading\b/g, 'isLoading');
    modified = true;
    console.log(`✅ Updated 'loading' -> 'isLoading' in: ${filePath}`);
  }

  if (modified) {
    // Create backup
    fs.writeFileSync(`${fullPath}.backup`, fs.readFileSync(fullPath));
    
    // Write updated content
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Successfully updated: ${filePath}`);
    console.log(`📁 Backup created: ${filePath}.backup`);
  } else {
    console.log(`ℹ️  No changes needed in: ${filePath}`);
  }
});

console.log('\n🎉 Auth hooks consolidation completed!');
console.log('📝 Next steps:');
console.log('1. Review files with TODO comments for interface compatibility');
console.log('2. Test the affected components');
console.log('3. Remove backup files once verified working');
console.log('4. Delete the simplified use-auth.ts file');
