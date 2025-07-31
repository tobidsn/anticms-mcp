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

## 🚀 MCP Installation & Configuration

### 1. Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "anticms-mcp": {
      "command": "npx",
      "args": ["@tobidsn/anticms-mcp@latest"]
    }
  }
}
```

### 2. Cursor IDE

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "anticms-mcp": {
      "command": "npx",
      "args": ["@tobidsn/anticms-mcp@latest"]
    }
  }
}
```

### 3. Direct Usage

```bash
# Use with npx (no installation needed)
npx @tobidsn/anticms-mcp@latest

# Or install globally
npm install -g @tobidsn/anticms-mcp
anticms-mcp
```
### 4. Local Usage

```json
"anticms-mcp": {
  "command": "node",
  "args": [
    "/folder/user/location/Anticms-MCP/index.js"
  ]
}
```

#### Basic Landing Page
```
Create an AntiCMS v3 template for a landing page called "product_landing" with a hero section, features section, and contact section. Include a call-to-action button in the hero section.
```

#### Company About Page
```
Generate an AntiCMS v3 template named "company_about" for an About Us page. I need:
- Hero section with CTA
- Features section (max 4 features)
- Contact section
- Gallery section (max 8 images)
Make it multilanguage enabled.
```

#### Blog Post Template
```
Create a blog post template called "blog_article" with:
- Hero section (no CTA needed)
- Contact section for author info
Set it as a content template that allows multiple instances.
```

### Custom Field Generation Prompts

#### Company Logo Field
```
Create a custom field for company logo upload. Name it "company_logo", make it a media field that only accepts images with resolution between 200x100 and 400x200 pixels.
```

#### Product Price Field
```
Generate a custom field called "product_price" as an input field for numbers. Make it required with placeholder "Enter price in USD".
```

#### Team Member Repeater
```
Create a repeater field named "team_members" for a team section. Each team member should have:
- Name (text input, multilanguage, required)
- Position (text input, multilanguage)
- Bio (textarea, multilanguage, max 300 characters)
- Photo (media field for images)
Set minimum 1 and maximum 10 team members.
```

### Validation Prompts

#### Validate Template
```
Please validate this AntiCMS template JSON structure for any errors:
[paste your JSON here]
```

#### Check Compliance
```
I have an existing template JSON. Can you check if it follows the AntiCMS v3 schema correctly and point out any issues?
```

### Information Requests

#### Field Types Reference
```
Show me all available AntiCMS v3 field types and their attributes.
```

#### Field Type Details
```
What attributes are available for the media field type in AntiCMS v3?
```

## 🎯 Advanced Use Cases

### E-commerce Product Template
```
Create an AntiCMS template for "ecommerce_product" with:
- Hero section (no CTA)
- Features section for product specifications (max 8 features)
- Gallery section for product images (max 15 images)
- Contact section for support info
Make it a content template that allows multiple instances and enable multilanguage support.
```

### Event Page Template
```
Generate a template called "event_page" for events with:
- Hero section with registration CTA
- Features section for event highlights (max 5 features)
Set description as "Template for event landing pages with registration"
```

### Portfolio Project Template
```
Create a portfolio template "portfolio_project" with:
- Hero section (include CTA for "View Live Site")
- Gallery section (max 20 images for project screenshots)
- Features section for project details (max 6 features)
```

### Custom News Article Field
```
Create a custom field setup for news articles:
1. Article title (text input, multilanguage, required, max 100 chars)
2. Article excerpt (textarea, multilanguage, max 200 chars)
3. Featured image (media field, images only, min 800x400, max 1200x600)
4. Article tags (repeater with text inputs for each tag, max 10 tags)
```

## 🔄 Complete Workflow Examples

### Corporate Website Setup
```
I'm building a corporate website. Create these templates:
1. Homepage template with hero, features, and contact sections
2. About page template with hero (with CTA), features (max 4), and contact
3. Services template with hero (with CTA), features (max 6), and gallery (max 8)

Name them "homepage", "about_page", and "services_page" respectively.
```

### Validation Workflow
```
First, show me all available field types. Then create a custom field for testimonials (repeater with name, position, company, testimonial text, and photo). Finally, validate this existing template I have: [JSON]
```

## 📋 Generated JSON Examples

### Example 1: Landing Page Template
```json
{
  "name": "product_landing",
  "label": "Product Landing Page",
  "is_content": false,
  "multilanguage": true,
  "is_multiple": false,
  "description": "Template for product landing pages with hero, features, and contact sections",
  "components": [
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
          "name": "subtitle",
          "label": "Subtitle",
          "field": "textarea",
          "multilanguage": true,
          "attribute": {
            "rows": 3,
            "max": 200,
            "placeholder": "Enter subtitle"
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
        },
        {
          "name": "cta_button",
          "label": "Call to Action",
          "field": "group",
          "attribute": {
            "fields": [
              {
                "name": "label",
                "label": "Button Label",
                "field": "input",
                "multilanguage": true,
                "attribute": {
                  "type": "text",
                  "placeholder": "Button text"
                }
              },
              {
                "name": "url",
                "label": "URL",
                "field": "input",
                "attribute": {
                  "type": "url",
                  "placeholder": "https://example.com"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Example 2: Custom Media Field
```json
{
  "name": "company_logo",
  "label": "Company Logo",
  "field": "media",
  "attribute": {
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

### Example 3: Team Members Repeater
```json
{
  "name": "team_members",
  "label": "Team Members",
  "field": "repeater",
  "attribute": {
    "min": 1,
    "max": 10,
    "fields": [
      {
        "name": "name",
        "label": "Name",
        "field": "input",
        "multilanguage": true,
        "attribute": {
          "type": "text",
          "is_required": true,
          "placeholder": "Team member name"
        }
      },
      {
        "name": "position",
        "label": "Position",
        "field": "input",
        "multilanguage": true,
        "attribute": {
          "type": "text",
          "placeholder": "Job title"
        }
      },
      {
        "name": "bio",
        "label": "Bio",
        "field": "textarea",
        "multilanguage": true,
        "attribute": {
          "rows": 4,
          "max": 300,
          "placeholder": "Short bio"
        }
      },
      {
        "name": "photo",
        "label": "Photo",
        "field": "media",
        "attribute": {
          "accept": ["image"]
        }
      }
    ]
  }
}
```

## 📂 File Storage Locations

Generated templates should be saved to:
- **Page Templates**: `storage/app/json/pages/`
- **Post Templates**: `storage/app/json/posts/`

## 💡 Tips for Better Prompts

1. **Be Specific**: Include exact field names, limits, and requirements
2. **Mention Multilanguage**: Specify if you need multilanguage support
3. **Set Constraints**: Include min/max values, character limits, image resolutions
4. **Describe Purpose**: Explain what the template/field will be used for
5. **Request Validation**: Always ask for validation if you're unsure about structure

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