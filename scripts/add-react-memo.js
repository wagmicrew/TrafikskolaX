#!/usr/bin/env node

/**
 * Script to identify expensive components and add React.memo optimization
 * Focuses on components with complex props, frequent re-renders, or heavy computations
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Patterns that indicate expensive components
const expensivePatterns = [
  /useEffect.*\[\]/,  // Components with many useEffects
  /useState.*\(/,     // Components with lots of state
  /useMemo.*\(/,      // Already using memoization
  /useCallback.*\(/,  // Already using callbacks
  /\.map\(/,          // Rendering lists
  /fetch\(/,          // API calls
  /JSON\.parse/,      // JSON processing
  /\.filter\(/,       // Array operations
  /\.sort\(/,         // Sorting operations
];

// Components that should NOT be memoized
const skipPatterns = [
  /export default function.*Page/i,  // Next.js pages
  /function.*Layout/i,               // Layout components
  /function.*Provider/i,             // Context providers
  /function.*Wrapper/i,              // Wrapper components
];

console.log('🔍 Analyzing components for React.memo optimization...');

function analyzeComponent(filePath, content) {
  // Check if already memoized
  if (content.includes('React.memo') || content.includes('memo(')) {
    return { shouldMemo: false, reason: 'Already memoized' };
  }

  // Skip if it's a page or layout
  const skip = skipPatterns.some(pattern => pattern.test(content));
  if (skip) {
    return { shouldMemo: false, reason: 'Page/Layout/Provider component' };
  }

  // Count expensive patterns
  let expensiveScore = 0;
  expensivePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) expensiveScore += matches.length;
  });

  // Check for complex props
  const propsComplexity = (content.match(/props\./g) || []).length;
  if (propsComplexity > 5) expensiveScore += 2;

  // Check for component size (rough indicator)
  const lineCount = content.split('\n').length;
  if (lineCount > 100) expensiveScore += 1;

  return {
    shouldMemo: expensiveScore >= 3,
    reason: `Score: ${expensiveScore} (props: ${propsComplexity}, lines: ${lineCount})`,
    score: expensiveScore
  };
}

// Find component files to analyze
const componentDirs = [
  'components/',
  'app/dashboard/'
];

const candidateComponents = [];

componentDirs.forEach(dir => {
  const fullDir = path.join(projectRoot, dir);
  if (!fs.existsSync(fullDir)) return;

  function scanDirectory(directory) {
    const items = fs.readdirSync(directory);
    
    items.forEach(item => {
      const itemPath = path.join(directory, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        scanDirectory(itemPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
        const content = fs.readFileSync(itemPath, 'utf8');
        
        // Only analyze React components
        if (content.includes('export default function') || content.includes('const ') && content.includes('= ()')) {
          const relativePath = path.relative(projectRoot, itemPath);
          const analysis = analyzeComponent(relativePath, content);
          
          if (analysis.shouldMemo) {
            candidateComponents.push({
              file: relativePath,
              ...analysis
            });
          }
        }
      }
    });
  }
  
  scanDirectory(fullDir);
});

// Sort by score (highest first)
candidateComponents.sort((a, b) => b.score - a.score);

console.log(`\n📊 Found ${candidateComponents.length} components that could benefit from React.memo:\n`);

candidateComponents.slice(0, 10).forEach((component, index) => {
  console.log(`${index + 1}. ${component.file}`);
  console.log(`   ${component.reason}`);
  console.log('');
});

// Generate example memo implementation
const memoExample = `
// Example: Adding React.memo to a component

// Before:
export default function ExpensiveComponent({ data, onUpdate }) {
  // ... component logic
}

// After:
import React from 'react';

const ExpensiveComponent = React.memo(function ExpensiveComponent({ data, onUpdate }) {
  // ... component logic
});

export default ExpensiveComponent;

// With custom comparison (for complex props):
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data, onUpdate }) {
  // ... component logic
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return prevProps.data.id === nextProps.data.id &&
         prevProps.onUpdate === nextProps.onUpdate;
});
`;

// Write detailed report
const reportContent = `# React.memo Optimization Report

Generated: ${new Date().toISOString()}

## Top Components for Memoization

${candidateComponents.map((component, index) => `
### ${index + 1}. ${component.file}
- **Score:** ${component.score}
- **Analysis:** ${component.reason}
- **Recommended:** Add React.memo wrapper
`).join('')}

## Implementation Guide

\`\`\`typescript${memoExample}\`\`\`

## When to Use React.memo:
1. Components that receive the same props frequently
2. Components with expensive rendering logic
3. Components with many child components
4. Components that re-render due to parent updates

## When NOT to Use React.memo:
1. Components that always receive different props
2. Very simple components with minimal logic
3. Components that already re-render infrequently

## Next Steps:
1. Start with highest scoring components
2. Add React.memo wrapper
3. Test performance improvements
4. Consider custom comparison functions for complex props
5. Monitor for any behavioral changes
`;

fs.writeFileSync(path.join(projectRoot, 'REACT_MEMO_ANALYSIS.md'), reportContent);

console.log('✅ Analysis complete!');
console.log('📄 Report saved to: REACT_MEMO_ANALYSIS.md');
console.log('\n🚀 Consider memoizing the top 5-10 components for best impact.');
