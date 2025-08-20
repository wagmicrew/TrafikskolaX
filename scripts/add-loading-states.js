#!/usr/bin/env node

/**
 * Script to identify and add proper loading states to components missing them
 * Focuses on components that make API calls but lack loading indicators
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const projectRoot = process.cwd();

// Patterns that indicate API calls
const apiCallPatterns = [
  /fetch\s*\(/,
  /axios\./,
  /\.get\(/,
  /\.post\(/,
  /\.put\(/,
  /\.delete\(/,
  /useQuery\(/,
  /useMutation\(/
];

// Patterns that indicate loading states already exist
const loadingStatePatterns = [
  /useState.*loading/i,
  /useState.*isLoading/i,
  /\.loading/,
  /\.isLoading/,
  /LoadingSpinner/,
  /Loader2/,
  /loading.*true/i,
  /isLoading.*true/i
];

console.log('🔍 Scanning for components missing loading states...');

// Find all React component files
const componentFiles = glob.sync('**/*.{tsx,jsx}', {
  cwd: projectRoot,
  ignore: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    '**/*.test.*',
    '**/*.spec.*'
  ]
});

const componentsNeedingLoading = [];

componentFiles.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if component makes API calls
  const hasApiCalls = apiCallPatterns.some(pattern => pattern.test(content));
  
  if (!hasApiCalls) return;
  
  // Check if component already has loading states
  const hasLoadingState = loadingStatePatterns.some(pattern => pattern.test(content));
  
  if (!hasLoadingState) {
    // Additional checks to avoid false positives
    if (content.includes('export default function') || content.includes('const ') && content.includes('= ()')) {
      componentsNeedingLoading.push({
        file: filePath,
        apiCalls: apiCallPatterns.filter(pattern => pattern.test(content)).length
      });
    }
  }
});

console.log(`\n📊 Found ${componentsNeedingLoading.length} components that may need loading states:\n`);

componentsNeedingLoading.forEach((component, index) => {
  console.log(`${index + 1}. ${component.file} (${component.apiCalls} API call patterns)`);
});

// Generate loading state template
const loadingStateTemplate = `
// Add loading state
const [isLoading, setIsLoading] = useState(false);

// In your async function:
setIsLoading(true);
try {
  // ... your API call
} catch (error) {
  // ... error handling
} finally {
  setIsLoading(false);
}

// In your JSX:
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}
`;

// Write report to file
const reportContent = `# Loading States Audit Report

Generated: ${new Date().toISOString()}

## Components Missing Loading States

${componentsNeedingLoading.map((component, index) => `
### ${index + 1}. ${component.file}
- API call patterns detected: ${component.apiCalls}
- Recommended: Add loading state with proper UI feedback
`).join('')}

## Recommended Loading State Pattern

\`\`\`typescript${loadingStateTemplate}\`\`\`

## Import needed:
\`\`\`typescript
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
\`\`\`

## Next Steps:
1. Review each component manually
2. Add appropriate loading states
3. Test user experience improvements
4. Consider skeleton loading for better UX
`;

fs.writeFileSync(path.join(projectRoot, 'LOADING_STATES_AUDIT.md'), reportContent);

console.log('\n✅ Audit complete!');
console.log('📄 Report saved to: LOADING_STATES_AUDIT.md');
console.log('\n🛠️  Manual review recommended for each component.');
