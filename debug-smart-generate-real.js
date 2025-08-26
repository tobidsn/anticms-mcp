#!/usr/bin/env node

// Patch the smart generate function to add debugging
import fs from 'fs/promises';

const originalCode = await fs.readFile('src/tools/templateGenerator.js', 'utf8');

// Add debugging logs
const debuggedCode = originalCode.replace(
  'let detectedPostTypes = [];',
  'let detectedPostTypes = []; console.log("🔍 DEBUG: detectedPostTypes initialized");'
).replace(
  'detectedPostTypes.push({',
  'console.log("🔍 DEBUG: Adding post type:", sectionName); detectedPostTypes.push({'
).replace(
  'for (const postType of detectedPostTypes) {',
  'console.log("🔍 DEBUG: detectedPostTypes before generation:", detectedPostTypes); for (const postType of detectedPostTypes) {'
);

// Write the debugged version
await fs.writeFile('src/tools/templateGenerator-debug.js', debuggedCode);

console.log('✅ Created debug version of templateGenerator.js');
console.log('📁 File: src/tools/templateGenerator-debug.js'); 