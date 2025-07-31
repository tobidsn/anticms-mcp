# AntiCMS v3 MCP Server

A Model Context Protocol (MCP) server for generating AntiCMS v3 JSON component templates. This server provides tools to create, validate, and manage custom field templates that comply with the AntiCMS v3 schema.

## Features

- 🏗️ **Template Generation**: Generate complete AntiCMS v3 templates with multiple sections
- 🔧 **Custom Fields**: Create individual fields with proper validation and attributes
- ✅ **Validation**: Validate existing templates against AntiCMS v3 schema
- 📚 **Field Types**: Support for all AntiCMS v3 field types (input, textarea, media, repeater, etc.)
- 🌐 **Multilanguage**: Built-in support for multilanguage content
- 🎯 **Pre-built Sections**: Ready-to-use components (hero, features, contact, gallery)

## Supported Field Types

| Field Type | Description | Status |
|------------|-------------|---------|
| `input` | Single-line text, number, email, URL | ✅ Active |
| `textarea` | Multi-line text input | ✅ Active |
| `texteditor` | WYSIWYG editor (full/simple) | ✅ Active |
| `select` | Dropdown selector with options | ✅ Active |
| `toggle` | Boolean on/off switch | ✅ Active |
| `media` | Upload images, videos, audio, documents | ✅ Active |
| `repeater` | Repeatable group of fields (array) | ✅ Active |
| `group` | Non-repeatable group of fields (object) | ✅ Active |
| `relationship` | Reference other posts by type/status | ✅ Active |
| `post_object` | Select one or more posts as objects | ✅ Active |
| `post_related` | Configure related post settings | ✅ Active |
| `table` | Tabular data with custom columns | ✅ Active |

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Anticms-MCP
```

2. Install dependencies:
```bash
npm install
```

3. Make the script executable:
```bash
chmod +x index.js
```

## Usage

### Running the Server

Start the MCP server:
```bash
npm start
# or
node index.js
```

### Available Tools

#### 1. `generate_template`
Generate a complete AntiCMS v3 template with multiple sections.

**Parameters:**
- `name` (string, required): Template identifier (snake_case)
- `label` (string, required): Human-readable template name
- `sections` (array, required): Section types to include: ['hero', 'features', 'contact', 'gallery']
- `description` (string): Template description
- `is_content` (boolean): Whether this is a content template (default: false)
- `multilanguage` (boolean): Enable multilanguage support (default: true)
- `is_multiple` (boolean): Allow multiple instances (default: false)
- `include_cta` (boolean): Include call-to-action in hero section (default: false)
- `max_features` (number): Maximum number of features (default: 6)
- `max_gallery_images` (number): Maximum number of gallery images (default: 12)

**Example:**
```json
{
  "name": "company_about",
  "label": "About Company Page",
  "description": "Template for company about page with hero and features",
  "sections": ["hero", "features", "contact"],
  "include_cta": true,
  "max_features": 4
}
```

#### 2. `generate_custom_field`
Generate a custom field with specific type and attributes.

**Parameters:**
- `name` (string, required): Field identifier (snake_case)
- `label` (string, required): Human-readable field label
- `field_type` (string, required): AntiCMS v3 field type
- `multilanguage` (boolean): Enable multilanguage support (default: false)
- `attributes` (object): Field-specific attributes

**Example:**
```json
{
  "name": "company_logo",
  "label": "Company Logo",
  "field_type": "media",
  "attributes": {
    "accept": ["image"],
    "resolution": {
      "minWidth": 200,
      "maxWidth": 400,
      "minHeight": 100,
      "maxHeight": 200
    }
  }
}
```

#### 3. `validate_template`
Validate an AntiCMS v3 template JSON structure.

**Parameters:**
- `template_json` (object, required): The template JSON to validate

#### 4. `list_field_types`
List all supported AntiCMS v3 field types with their attributes.

## Examples

### Generated Hero Section
```json
{
  "keyName": "hero_section",
  "label": "Hero Section",
  "section": "1",
  "fields": [
    {
      "name": "status",
      "label": "Status",
      "field": "toggle",
      "attribute": {
        "caption": "Enable or disable the hero section",
        "defaultValue": true
      }
    },
    {
      "name": "title",
      "label": "Title",
      "field": "input",
      "multilanguage": true,
      "attribute": {
        "type": "text",
        "is_required": true,
        "placeholder": "Enter main title",
        "maxLength": 100
      }
    },
    {
      "name": "background_image",
      "label": "Background Image",
      "field": "media",
      "attribute": {
        "accept": ["image"],
        "resolution": {
          "minWidth": 1200,
          "maxWidth": 1920,
          "minHeight": 600,
          "maxHeight": 1080
        }
      }
    }
  ]
}
```

### Complete Template Example
```json
{
  "name": "landing_page",
  "label": "Landing Page",
  "is_content": false,
  "multilanguage": true,
  "is_multiple": false,
  "description": "Template for Landing Page",
  "components": [
    {
      "keyName": "hero_section",
      "label": "Hero Section",
      "section": "1",
      "fields": [...]
    },
    {
      "keyName": "features_section",
      "label": "Features Section",
      "section": "2",
      "fields": [...]
    }
  ]
}
```

## File Structure

```
Anticms-MCP/
├── index.js              # Main MCP server implementation
├── package.json          # Node.js dependencies and metadata
├── README.md             # This file
└── .cursor/
    └── docs/
        └── project.mdc    # Schema documentation
```

## AntiCMS v3 File Locations

Generated templates should be saved to:
- **Page Templates**: `storage/app/json/pages/`
- **Post Templates**: `storage/app/json/posts/`

## Development

### Adding New Field Types

To add support for new field types:

1. Add the field type to `FIELD_TYPES` object in `index.js`
2. Define required and optional attributes
3. Update the validation logic
4. Add any special handling in `generateField` method

### Adding New Pre-built Sections

To add new pre-built sections:

1. Create a static method in `AntiCMSComponentGenerator` class
2. Define the fields for the section
3. Return the component using `generateComponent`
4. Add the section to the switch statement in `generate_template` tool

## Schema Compliance

This MCP server generates JSON that complies with the AntiCMS v3 custom fields schema. The generated templates include:

- Proper field types and attributes
- Validation rules and constraints
- Multilanguage support where appropriate
- Nested field structures (groups and repeaters)
- Required vs optional field properties

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the `.cursor/docs/project.mdc` file for detailed schema documentation
- Review the AntiCMS v3 documentation
- Open an issue in the repository 