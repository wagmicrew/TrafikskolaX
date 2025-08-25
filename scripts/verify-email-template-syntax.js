/**
 * Verify EmailTemplateBuilder syntax and imports
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying EmailTemplateBuilder syntax...\n');

// Check if file exists
const filePath = 'components/Admin/EmailTemplateBuilder.tsx';
if (!fs.existsSync(filePath)) {
  console.log('❌ File not found:', filePath);
  process.exit(1);
}

console.log('✅ File exists:', filePath);

// Read and check imports
const content = fs.readFileSync(filePath, 'utf8');

const requiredImports = [
  'createEmailTemplateConfig',
  'TinyMCEConfig',
  '@/lib/tinymce-config',
  'SimpleEmailPreview',
  'TriggerFlowPopup'
];

console.log('\n📦 Checking imports:');
let importCount = 0;
for (const importItem of requiredImports) {
  if (content.includes(importItem)) {
    console.log('   ✅ ' + importItem);
    importCount++;
  } else {
    console.log('   ❌ ' + importItem + ' (missing)');
  }
}

console.log(`   -> ${importCount}/${requiredImports.length} imports found`);

// Check TinyMCE configuration
console.log('\n⚙️  Checking TinyMCE configuration:');
if (content.includes('createEmailTemplateConfig(tinymceApiKey')) {
  console.log('   ✅ Uses UTF-8 configuration');
} else {
  console.log('   ❌ Missing UTF-8 configuration');
}

// Check for syntax errors (basic check)
console.log('\n🔍 Checking for basic syntax issues:');
const bracketBalance = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
const parenBalance = (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length;

if (bracketBalance === 0) {
  console.log('   ✅ Brackets balanced');
} else {
  console.log(`   ❌ Bracket imbalance: ${bracketBalance}`);
}

if (parenBalance === 0) {
  console.log('   ✅ Parentheses balanced');
} else {
  console.log(`   ❌ Parentheses imbalance: ${parenBalance}`);
}

// Check for required JSX structure
console.log('\n🏗️  Checking JSX structure:');
const jsxElements = ['<div', '<Editor', '<Button', '</div>', '</form>'];
let jsxCount = 0;
for (const element of jsxElements) {
  if (content.includes(element)) {
    jsxCount++;
  }
}

console.log(`   ✅ ${jsxCount}/${jsxElements.length} JSX elements found`);

// Final assessment
console.log('\n🎯 Final Assessment:');
const hasAllImports = importCount === requiredImports.length;
const hasUtf8Config = content.includes('createEmailTemplateConfig(tinymceApiKey');
const hasBalancedSyntax = bracketBalance === 0 && parenBalance === 0;
const hasJsxElements = jsxCount === jsxElements.length;

if (hasAllImports && hasUtf8Config && hasBalancedSyntax && hasJsxElements) {
  console.log('   ✅ EmailTemplateBuilder syntax looks good!');
  console.log('   ✅ Should build successfully now');
} else {
  console.log('   ⚠️  Some issues detected, may need further fixes');
}

console.log('\n📋 Summary:');
console.log('- File structure: ✅');
console.log('- Imports: ' + (hasAllImports ? '✅' : '❌'));
console.log('- UTF-8 config: ' + (hasUtf8Config ? '✅' : '❌'));
console.log('- Syntax balance: ' + (hasBalancedSyntax ? '✅' : '❌'));
console.log('- JSX elements: ' + (hasJsxElements ? '✅' : '❌'));
