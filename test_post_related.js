const { generateTemplate } = require('./src/tools/templateGenerator.js');

async function testPostRelated() {
  try {
    const result = await generateTemplate({
      name: 'our_stories_test',
      sections: ['our_stories'],
      figma_metadata_file: 'storage/app/json/figma/homepage_metadata.json'
    });
    
    const text = result.content[0].text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    
    if (jsonMatch) {
      const template = JSON.parse(jsonMatch[1]);
      const ourStoriesSection = template.components.find(c => c.keyName === 'our_stories_section');
      
      if (ourStoriesSection) {
        console.log('✅ Our Stories Section Fields:');
        ourStoriesSection.fields.forEach(field => {
          console.log(`- ${field.name}: ${field.field}`);
        });
        
        const hasPostRelated = ourStoriesSection.fields.some(f => f.field === 'post_related');
        console.log('Has post_related field:', hasPostRelated);
        
        if (hasPostRelated) {
          const postRelatedField = ourStoriesSection.fields.find(f => f.field === 'post_related');
          console.log('Post Related Field Details:', JSON.stringify(postRelatedField, null, 2));
        }
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testPostRelated();
