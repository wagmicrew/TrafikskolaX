#!/usr/bin/env node

/**
 * Script to apply standardized API middleware to existing API routes
 * Updates routes to use the new withApiHandler wrapper and validation
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const apiDir = path.join(projectRoot, 'app', 'api');

// Routes to update with their validation schemas
const routesToUpdate = [
  {
    file: 'app/api/admin/users/route.ts',
    method: 'POST',
    schema: 'registerSchema',
    requireAuth: true,
    requiredRole: 'admin'
  },
  {
    file: 'app/api/admin/bookings/route.ts', 
    method: 'POST',
    schema: 'createBookingSchema',
    requireAuth: true,
    requiredRole: 'admin'
  },
  {
    file: 'app/api/auth/register/route.ts',
    method: 'POST', 
    schema: 'registerSchema',
    requireAuth: false
  },
  {
    file: 'app/api/booking/create/route.ts',
    method: 'POST',
    schema: 'createBookingSchema', 
    requireAuth: true
  }
];

console.log('🔄 Applying standardized API middleware to routes...');

function updateApiRoute(routeConfig) {
  const fullPath = path.join(projectRoot, routeConfig.file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Route not found: ${routeConfig.file}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Skip if already using withApiHandler
  if (content.includes('withApiHandler')) {
    console.log(`✅ Already updated: ${routeConfig.file}`);
    return;
  }

  // Add imports
  const importStatement = `import { withApiHandler } from '@/lib/api/middleware';
import { ${routeConfig.schema} } from '@/lib/validation/schemas';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/types';
`;

  // Add import after existing imports
  if (content.includes('import { NextRequest')) {
    content = content.replace(
      /import { NextRequest[^}]+} from 'next\/server';/,
      `$&\n${importStatement}`
    );
  } else {
    content = `${importStatement}\n${content}`;
  }

  // Find the main handler function
  const handlerRegex = new RegExp(`export async function ${routeConfig.method}\\s*\\([^{]+\\{`, 'g');
  const match = handlerRegex.exec(content);
  
  if (!match) {
    console.log(`⚠️  Could not find ${routeConfig.method} handler in: ${routeConfig.file}`);
    return;
  }

  // Extract handler function name
  const handlerStart = match.index;
  let braceCount = 1;
  let handlerEnd = handlerStart + match[0].length;
  
  // Find the end of the function
  while (braceCount > 0 && handlerEnd < content.length) {
    if (content[handlerEnd] === '{') braceCount++;
    if (content[handlerEnd] === '}') braceCount--;
    handlerEnd++;
  }
  
  const originalHandler = content.substring(handlerStart, handlerEnd);
  
  // Create new handler function
  const newHandlerName = `handle${routeConfig.method}`;
  const newHandler = originalHandler
    .replace(`export async function ${routeConfig.method}`, `async function ${newHandlerName}`)
    .replace('NextRequest', 'NextRequest');

  // Create export with middleware wrapper
  const middlewareOptions = {
    requireAuth: routeConfig.requireAuth,
    requiredRole: routeConfig.requiredRole,
    validate: {
      body: routeConfig.schema
    }
  };

  const exportStatement = `\n// Apply standardized middleware
export const ${routeConfig.method} = withApiHandler(${newHandlerName}, ${JSON.stringify(middlewareOptions, null, 2)});`;

  // Replace the original handler
  content = content.substring(0, handlerStart) + newHandler + exportStatement + content.substring(handlerEnd);

  // Create backup
  fs.writeFileSync(`${fullPath}.backup`, fs.readFileSync(fullPath));
  
  // Write updated content
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Updated: ${routeConfig.file}`);
  console.log(`📁 Backup: ${routeConfig.file}.backup`);
}

// Process each route
routesToUpdate.forEach(updateApiRoute);

// Create migration guide
const migrationGuide = `# API Middleware Migration Guide

Generated: ${new Date().toISOString()}

## Updated Routes

${routesToUpdate.map(route => `
### ${route.file}
- **Method:** ${route.method}
- **Schema:** ${route.schema}
- **Auth Required:** ${route.requireAuth}
- **Required Role:** ${route.requiredRole || 'none'}
- **Status:** Updated with withApiHandler wrapper
`).join('')}

## Benefits of New Middleware:

1. **Standardized Error Handling:** Consistent error responses across all routes
2. **Automatic Validation:** Request validation using Zod schemas  
3. **Built-in Authentication:** JWT token validation and user extraction
4. **Role-based Authorization:** Automatic role checking
5. **Centralized Logging:** Request/response logging for debugging
6. **Rate Limiting:** Built-in protection against abuse
7. **Security Headers:** Automatic security headers

## Next Steps:

1. **Test Updated Routes:** Verify functionality hasn't changed
2. **Remove Backup Files:** After confirming everything works
3. **Update Frontend:** Use new standardized error responses
4. **Monitor Logs:** Check for any issues with new middleware
5. **Add More Routes:** Apply middleware to remaining routes

## Rollback Instructions:

If issues occur, restore from backup files:
\`\`\`bash
cp app/api/auth/login/route.ts.backup app/api/auth/login/route.ts
\`\`\`

## Manual Review Required:

- Check that all error handling works correctly
- Verify authentication flows still function
- Test validation error messages
- Ensure backward compatibility with existing clients
`;

fs.writeFileSync(path.join(projectRoot, 'API_MIDDLEWARE_MIGRATION.md'), migrationGuide);

console.log('\n🎉 API middleware migration completed!');
console.log('📄 Migration guide saved to: API_MIDDLEWARE_MIGRATION.md');
console.log('\n📝 Next steps:');
console.log('1. Test the updated API routes');
console.log('2. Remove backup files once verified');
console.log('3. Apply middleware to remaining routes');
console.log('4. Update frontend error handling if needed');
