#!/usr/bin/env node

async function debugDetailedSmartGenerate() {
  console.log('🧪 Detailed Debug of Smart Generate\n');
  
  const prompt = 'Create an AntiCMS v3 template called "agency" with hero, features, projects showcase with see more button, testimonials, and contact sections';
  const figmaData = { sections: ['hero', 'features', 'projects', 'testimonials', 'contact'] };
  const sections = figmaData.sections;
  
  console.log('📋 Input Data:');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Sections: ${JSON.stringify(sections)}\n`);
  
  // Test the detection logic step by step
  let detectedPostTypes = [];
  let processedSections = [];
  
  console.log('🔍 Section Analysis:');
  sections.forEach(sectionName => {
    console.log(`\n--- Analyzing: ${sectionName} ---`);
    
    // Only if "see more" appears near the section name or if it's a known collection type
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
      
      console.log(`Context: "${sectionContext}"`);
      console.log(`Has See More: ${promptHasSeeMoreForSection}`);
    }
    
    const isKnownCollectionSection = ['projects', 'portfolio', 'testimonials', 'team', 'work', 'case_studies'].includes(sectionName.toLowerCase());
    console.log(`Known Collection: ${isKnownCollectionSection}`);
    
    if (promptHasSeeMoreForSection || isKnownCollectionSection) {
      // This section represents a post collection
      const postTypeName = `${sectionName}_posts`;
      const postType = {
        name: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        slug: sectionName.toLowerCase().replace(/_/g, '-'),
        originalSection: sectionName
      };
      detectedPostTypes.push(postType);
      
      console.log(`✅ POST COLLECTION: ${JSON.stringify(postType)}`);
      processedSections.push(sectionName + '_reference');
    } else {
      // Regular section
      console.log(`📄 REGULAR SECTION`);
      processedSections.push(sectionName);
    }
  });
  
  console.log(`\n📊 Final Results:`);
  console.log(`Detected Post Types: ${JSON.stringify(detectedPostTypes, null, 2)}`);
  console.log(`Processed Sections: ${JSON.stringify(processedSections)}`);
  console.log(`Template Sections (should exclude post collections): ${JSON.stringify(processedSections.filter(s => !s.endsWith('_reference')))}`);
}

debugDetailedSmartGenerate(); 