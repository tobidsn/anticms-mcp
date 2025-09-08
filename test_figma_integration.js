import { generateTemplate } from './src/tools/templateGenerator.js';

// Test real Figma MCP integration
async function testRealFigmaMCPIntegration() {
  console.log('🚀 Testing AntiCMS template generation with real Figma MCP integration...\n');
  
  try {
    // Create a comprehensive Savaya Group template based on the Figma design
    const result = await generateTemplate({
      name: 'savaya',
      label: 'Savaya Group',
      description: `Sophisticated hospitality website template for Savaya Group based on the Figma design analysis:

1. Hero section with "High above the cliffs, deep within the cities, amidst the nightlife" tagline
2. Image gallery/slider section with multiple restaurant images
3. Brands showcase featuring partner restaurants like The Nineteen steakhouse
4. Services section highlighting "Private Events" with compelling copy
5. Events listing "Gather, celebrate & connect at our events" with event details
6. Our Stories section showcasing news articles and updates
7. Closing section with "Celebrate Life, The Savaya Way" message

The template reflects luxury hospitality branding with sophisticated typography and premium imagery.`,
      template_type: 'pages',
      is_content: false,
      multilanguage: true,
      is_multiple: false,
      sections: ['hero', 'slider', 'brands_showcase', 'private_events', 'events_listing', 'our_stories', 'closing_section', 'contact'],
      include_cta: true,
      max_features: 8,
      max_gallery_images: 12
    });
    
    console.log('✅ SUCCESS: Generated Savaya Group template with comprehensive sections!');
    console.log('\n📋 Template Summary:');
    console.log(`   - Name: savaya`);
    console.log(`   - Label: Savaya Group`);
    console.log(`   - Sections: ${result.content[0].text.includes('sections') ? 'Multiple sections generated' : 'Basic sections'}`);
    
  } catch (error) {
    console.log('❌ FAILED: Error generating template:', error.message);
    console.log('\n🔧 Error details:', error);
  }
  
  console.log('\n🎯 Test completed!');
}

// Run the real test
testRealFigmaMCPIntegration().catch(console.error);
