# Figma Metadata Integration for AntiCMS MCP

## Overview

The AntiCMS MCP server now supports generating templates directly from Figma metadata JSON files. This feature allows you to create AntiCMS v3 templates by analyzing Figma design metadata, providing 100% accurate section mapping based on the design structure.

## New Tool: `generate_template_from_figma_metadata`

### Description
Generate a complete AntiCMS v3 template from Figma metadata JSON file.

### Parameters
- `metadata_file_path` (required): Path to the Figma metadata JSON file
- `template_name` (optional): Template identifier (will be auto-generated if not provided)
- `template_label` (optional): Template label (will be auto-generated if not provided)
- `template_type` (optional): Template type - "pages" or "posts" (default: "pages")
- `multilanguage` (optional): Enable multilanguage support (default: true)
- `is_multiple` (optional): Allow multiple instances (default: false)

### Usage Example

```javascript
// Using the MCP tool
await mcp_anticms-mcp_generate_template_from_figma_metadata({
  metadata_file_path: "./storage/app/json/figma/homepage_metadata.json",
  template_name: "homepage_figma",
  template_label: "Homepage from Figma",
  template_type: "pages",
  multilanguage: true,
  is_multiple: false
});
```

## Figma Metadata Structure

The tool expects a JSON file with the following structure:

```json
{
  "figma_code_response": {
    "sections": {
      "hero": { /* hero section data */ },
      "services": { /* services section data */ },
      "contact": { /* contact section data */ }
    }
  },
  "figma_metadata_response": {
    "name": "Homepage",
    "dimensions": { "width": 1440, "height": 4579 }
  },
  "anticms_analysis": {
    "template_type": "pages",
    "identified_sections": {
      "hero": {
        "matched": true,
        "confidence": "high",
        "anticms_mapping": "built-in"
      },
      "services": {
        "matched": true,
        "confidence": "high",
        "anticms_mapping": "built-in"
      }
    }
  }
}
```

## Section Mapping Logic

The tool uses intelligent section mapping based on the `anticms_analysis` data:

### Built-in Sections
- `hero` → Hero section with navigation, main content, and CTA buttons
- `services` → Features section with service cards
- `testimonials` → Testimonials section with client quotes
- `contact` → Contact section with form fields
- `footer` → Footer section with links and social media

### Custom Sections
- `partners` → Partners section with company logos
- `why_choose_us` → Features section with checklist items
- `work` → Gallery section with project showcase

### Fallback Mapping
If no analysis data is available, the tool uses a fallback mapping:
- `partners` → `partners`
- `services` → `features`
- `why_choose_us` → `features`
- `work` → `gallery`
- `projects` → `gallery`
- `testimonials` → `testimonials`
- `contact` → `contact`
- `contact_us` → `contact`
- `footer` → `footer`

## Features

### 1. Automatic Section Detection
- Analyzes Figma metadata to identify section types
- Uses confidence scoring to determine best mappings
- Supports both built-in and custom section types

### 2. Intelligent Field Generation
- Creates appropriate field types based on section content
- Generates repeater fields for collections
- Adds proper validation and constraints

### 3. CTA Button Detection
- Automatically detects CTA buttons in sections
- Enables CTA functionality in hero sections
- Identifies "See More" buttons for post collections

### 4. Multilanguage Support
- Configurable multilanguage support
- Proper field labeling for internationalization
- Content field optimization for multiple languages

## Generated Template Structure

The tool generates a complete AntiCMS v3 template with:

```json
{
  "name": "template_name",
  "label": "Template Label",
  "is_content": false,
  "multilanguage": true,
  "is_multiple": false,
  "description": "Template generated from Figma metadata",
  "components": [
    {
      "keyName": "section_name",
      "label": "Section Label",
      "section": "1",
      "fields": [/* generated fields */],
      "block": "Section Type"
    }
  ]
}
```

## Error Handling

The tool includes comprehensive error handling:
- File not found errors
- Invalid JSON format errors
- Missing required metadata errors
- Fallback generation for incomplete data

## Integration with Existing Tools

The new tool integrates seamlessly with existing AntiCMS MCP tools:
- Uses the same field type system
- Generates compatible template structures
- Supports all existing validation rules
- Works with the template storage system

## Best Practices

1. **Metadata Quality**: Ensure your Figma metadata includes the `anticms_analysis` section for best results
2. **Section Naming**: Use clear, descriptive section names in your Figma designs
3. **Content Structure**: Organize content logically to enable proper field generation
4. **Testing**: Always test generated templates before production use

## Example Workflow

1. Create Figma design with proper section structure
2. Export metadata JSON with AntiCMS analysis
3. Use `generate_template_from_figma_metadata` tool
4. Review generated template structure
5. Customize fields as needed
6. Deploy to AntiCMS

## Troubleshooting

### Common Issues
- **Empty sections**: Check that Figma metadata includes section data
- **Missing fields**: Verify that content is properly structured in Figma
- **Mapping errors**: Review the `anticms_analysis` section for correct mappings

### Debug Information
The tool provides detailed console logging for debugging:
- Section mapping decisions
- Field generation process
- Error details and fallback actions

## Future Enhancements

Planned improvements include:
- Support for more complex Figma components
- Advanced field type detection
- Custom field generation rules
- Integration with Figma API for real-time updates
