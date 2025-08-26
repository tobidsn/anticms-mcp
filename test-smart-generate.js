#!/usr/bin/env node

import { smartGenerate } from './src/tools/templateGenerator.js';

async function testSmartGenerate() {
  console.log('🧪 Testing Smart Generate - Projects Detection\n');
  
  try {
    // Test the agency template with projects section
    const result = await smartGenerate({
      prompt: 'Create an AntiCMS v3 template called "agency" with hero, features, projects showcase with see more button, testimonials, and contact sections',
      auto_detect: true
    });
    
    console.log('✅ Smart Generate Result:');
    result.content.forEach((item, index) => {
      console.log(`${index + 1}. ${item.text}\n`);
    });
    
  } catch (error) {
    console.error('❌ Smart Generate Test Failed:', error);
  }
}

testSmartGenerate(); 