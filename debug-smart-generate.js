#!/usr/bin/env node

import { smartGenerate } from './src/tools/templateGenerator.js';

async function debugSmartGenerate() {
  console.log('🧪 Debugging Smart Generate - Section Detection\n');
  
  // Let's test the core detection logic first
  console.log('--- Testing Section Detection Logic ---');
  
  const testSections = ['hero', 'features', 'projects', 'testimonials', 'contact'];
  const prompt = 'Create an AntiCMS v3 template called "agency" with hero, features, projects showcase with see more button, testimonials, and contact sections';
  
  testSections.forEach(sectionName => {
    const promptLower = prompt.toLowerCase();
    const sectionIndex = promptLower.indexOf(sectionName.toLowerCase());
    let promptHasSeeMoreForSection = false;
    
    if (sectionIndex !== -1) {
      // Check if "see more" appears within 50 characters of the section name
      const sectionContext = promptLower.substring(Math.max(0, sectionIndex - 25), sectionIndex + sectionName.length + 25);
             promptHasSeeMoreForSection = sectionContext.includes('see more') || 
                                   sectionContext.includes('view more');
       
       // Special case: if section contains "showcase" directly with the section name
       if (sectionContext.includes(`${sectionName} showcase`) || sectionContext.includes(`${sectionName}showcase`)) {
         promptHasSeeMoreForSection = true;
       }
      
      console.log(`${sectionName}:`);
      console.log(`  - context: "${sectionContext}"`);
      console.log(`  - hasSeeMore: ${promptHasSeeMoreForSection}`);
    }
    
    const isKnownCollectionSection = ['projects', 'portfolio', 'testimonials', 'team', 'work', 'case_studies'].includes(sectionName.toLowerCase());
    
    const isPostCollection = promptHasSeeMoreForSection || isKnownCollectionSection;
    
    console.log(`  - isKnownCollection: ${isKnownCollectionSection}`);
    console.log(`  - RESULT: ${isPostCollection ? 'POST COLLECTION' : 'REGULAR SECTION'}\n`);
  });
}

debugSmartGenerate(); 