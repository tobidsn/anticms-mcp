/**
 * Tool definitions for AntiCMS v3 JSON Generator
 * Based on Model Context Protocol (MCP) specifications
 */

export const TOOL_DEFINITIONS = [
  {
    name: 'generate_template',
    description: 'Generate a complete AntiCMS v3 template with multiple sections',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Template identifier (snake_case)',
        },
        label: {
          type: 'string',
          description: 'Human-readable template name',
        },
        description: {
          type: 'string',
          description: 'Template description',
        },
        is_content: {
          type: 'boolean',
          description: 'Whether this is a content template',
          default: false,
        },
        multilanguage: {
          type: 'boolean',
          description: 'Enable multilanguage support',
          default: true,
        },
        is_multiple: {
          type: 'boolean',
          description: 'Allow multiple instances',
          default: false,
        },
        sections: {
          type: 'array',
          description: 'Array of section types to include: hero, features, contact, gallery',
          items: {
            type: 'string',
            enum: ['hero', 'features', 'contact', 'gallery']
          }
        },
        include_cta: {
          type: 'boolean',
          description: 'Include call-to-action in hero section',
          default: false,
        },
        max_features: {
          type: 'number',
          description: 'Maximum number of features (default: 6)',
          default: 6,
        },
        max_gallery_images: {
          type: 'number',
          description: 'Maximum number of gallery images (default: 12)',
          default: 12,
        }
      },
      required: ['name', 'label', 'sections'],
    },
  },
  {
    name: 'generate_custom_field',
    description: 'Generate a custom field with specific type and attributes',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Field identifier (snake_case)',
        },
        label: {
          type: 'string',
          description: 'Human-readable field label',
        },
        field_type: {
          type: 'string',
          enum: ['input', 'textarea', 'texteditor', 'select', 'toggle', 'media', 'repeater', 'group', 'relationship', 'post_object', 'post_related', 'table'],
          description: 'AntiCMS v3 field type',
        },
        multilanguage: {
          type: 'boolean',
          description: 'Enable multilanguage support',
          default: false,
        },
        attributes: {
          type: 'object',
          description: 'Field-specific attributes (varies by field type)',
        }
      },
      required: ['name', 'label', 'field_type'],
    },
  },
  {
    name: 'validate_template',
    description: 'Validate an AntiCMS v3 template JSON structure',
    inputSchema: {
      type: 'object',
      properties: {
        template_json: {
          type: 'object',
          description: 'The template JSON to validate',
        }
      },
      required: ['template_json'],
    },
  },
  {
    name: 'list_field_types',
    description: 'List all supported AntiCMS v3 field types with their attributes',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  }
]; 