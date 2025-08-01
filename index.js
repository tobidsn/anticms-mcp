#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// AntiCMS v3 Field Type Definitions
const FIELD_TYPES = {
  input: {
    attributes: ['type', 'is_required', 'placeholder', 'defaultValue', 'maxLength', 'minLength'],
    requiredAttributes: ['type']
  },
  textarea: {
    attributes: ['rows', 'cols', 'max', 'min', 'placeholder', 'is_required', 'defaultValue', 'caption'],
    requiredAttributes: []
  },
  texteditor: {
    attributes: ['type', 'rows', 'cols', 'max', 'min', 'placeholder', 'is_required', 'defaultValue', 'caption'],
    requiredAttributes: ['type']
  },
  select: {
    attributes: ['options', 'is_required', 'placeholder', 'caption', 'defaultValue'],
    requiredAttributes: ['options']
  },
  toggle: {
    attributes: ['caption', 'defaultValue'],
    requiredAttributes: []
  },
  media: {
    attributes: ['accept', 'resolution'],
    requiredAttributes: ['accept']
  },
  repeater: {
    attributes: ['fields', 'min', 'max', 'caption'],
    requiredAttributes: ['fields']
  },
  group: {
    attributes: ['fields', 'caption'],
    requiredAttributes: ['fields']
  },
  relationship: {
    attributes: ['filter', 'min', 'max', 'api_url', 'caption', 'is_required'],
    requiredAttributes: ['filter']
  },
  post_object: {
    attributes: ['filter', 'multiple', 'caption', 'is_required'],
    requiredAttributes: ['filter']
  },
  post_related: {
    attributes: ['api_prefix', 'caption', 'is_required'],
    requiredAttributes: ['api_prefix']
  },
  table: {
    attributes: ['columns', 'min', 'max', 'caption', 'is_required'],
    requiredAttributes: ['columns']
  }
};

// Helper functions for component generation
class AntiCMSComponentGenerator {
  
  static validateFieldType(fieldType) {
    if (!FIELD_TYPES[fieldType]) {
      throw new Error(`Unsupported field type: ${fieldType}`);
    }
    return true;
  }

  static generateField(name, label, fieldType, options = {}) {
    this.validateFieldType(fieldType);
    
    const field = {
      name,
      label,
      field: fieldType
    };

    // Add multilanguage if specified
    if (options.multilanguage !== undefined) {
      field.multilanguage = options.multilanguage;
    }

    // Generate attributes based on field type
    const fieldConfig = FIELD_TYPES[fieldType];
    const attributes = {};

    // Add required attributes with defaults
    fieldConfig.requiredAttributes.forEach(attr => {
      switch (attr) {
        case 'type':
          attributes.type = options.inputType || 'text';
          break;
        case 'accept':
          attributes.accept = options.accept || ['image'];
          break;
        case 'options':
          attributes.options = options.options || [];
          break;
        case 'fields':
          attributes.fields = options.fields || [];
          break;
        case 'filter':
          attributes.filter = options.filter || { post_type: ['post'], post_status: 'publish' };
          break;
        case 'api_prefix':
          attributes.api_prefix = options.api_prefix || '/api/v1/';
          break;
        case 'columns':
          attributes.columns = options.columns || [];
          break;
      }
    });

    // Add optional attributes if provided
    Object.keys(options).forEach(key => {
      if (fieldConfig.attributes.includes(key) && options[key] !== undefined) {
        attributes[key] = options[key];
      }
    });

    if (Object.keys(attributes).length > 0) {
      field.attribute = attributes;
    }

    return field;
  }

  static generateComponent(keyName, label, section, fields) {
    return {
      keyName,
      label,
      section: String(section),
      fields
    };
  }

  static generateTemplate(name, label, options = {}) {
    return {
      name,
      label,
      is_content: options.is_content || false,
      multilanguage: options.multilanguage || true,
      is_multiple: options.is_multiple || false,
      description: options.description || `Template for ${label}`,
      components: options.components || []
    };
  }

  // Pre-built component generators
  static generateHeroSection(options = {}) {
    const fields = [
      this.generateField('status', 'Status', 'toggle', {
        caption: 'Enable or disable the hero section',
        defaultValue: true
      }),
      this.generateField('title', 'Title', 'input', {
        multilanguage: true,
        inputType: 'text',
        is_required: true,
        placeholder: 'Enter main title',
        maxLength: 100
      }),
      this.generateField('subtitle', 'Subtitle', 'textarea', {
        multilanguage: true,
        rows: 3,
        max: 200,
        placeholder: 'Enter subtitle'
      }),
      this.generateField('background_image', 'Background Image', 'media', {
        accept: ['image'],
        resolution: {
          minWidth: 1200,
          maxWidth: 1920,
          minHeight: 600,
          maxHeight: 1080
        }
      })
    ];

    if (options.includeCTA) {
      fields.push(
        this.generateField('cta_button', 'Call to Action', 'group', {
          fields: [
            this.generateField('label', 'Button Label', 'input', {
              multilanguage: true,
              inputType: 'text',
              placeholder: 'Button text'
            }),
            this.generateField('url', 'URL', 'input', {
              inputType: 'url',
              placeholder: 'https://example.com'
            })
          ]
        })
      );
    }

    return this.generateComponent('hero_section', 'Hero Section', '1', fields);
  }

  static generateFeaturesSection(options = {}) {
    const maxFeatures = options.maxFeatures || 6;
    
    const fields = [
      this.generateField('section_title', 'Section Title', 'input', {
        multilanguage: true,
        inputType: 'text',
        placeholder: 'Features section title'
      }),
      this.generateField('features', 'Features', 'repeater', {
        min: 1,
        max: maxFeatures,
        fields: [
          this.generateField('feature_title', 'Feature Title', 'input', {
            multilanguage: true,
            inputType: 'text',
            is_required: true,
            placeholder: 'Feature name'
          }),
          this.generateField('feature_description', 'Feature Description', 'textarea', {
            multilanguage: true,
            rows: 3,
            max: 150,
            placeholder: 'Feature description'
          }),
          this.generateField('feature_icon', 'Feature Icon', 'media', {
            accept: ['image']
          })
        ]
      })
    ];

    return this.generateComponent('features_section', 'Features Section', '2', fields);
  }

  static generateContactSection(options = {}) {
    const fields = [
      this.generateField('section_title', 'Section Title', 'input', {
        multilanguage: true,
        inputType: 'text',
        placeholder: 'Contact section title'
      }),
      this.generateField('contact_info', 'Contact Information', 'group', {
        fields: [
          this.generateField('email', 'Email', 'input', {
            inputType: 'email',
            placeholder: 'contact@example.com'
          }),
          this.generateField('phone', 'Phone', 'input', {
            inputType: 'text',
            placeholder: '+1 (555) 123-4567'
          }),
          this.generateField('address', 'Address', 'textarea', {
            multilanguage: true,
            rows: 3,
            placeholder: 'Company address'
          })
        ]
      })
    ];

    return this.generateComponent('contact_section', 'Contact Section', '3', fields);
  }

  static generateGallerySection(options = {}) {
    const maxImages = options.maxImages || 12;
    
    const fields = [
      this.generateField('section_title', 'Gallery Title', 'input', {
        multilanguage: true,
        inputType: 'text',
        placeholder: 'Gallery section title'
      }),
      this.generateField('gallery_images', 'Gallery Images', 'repeater', {
        min: 1,
        max: maxImages,
        fields: [
          this.generateField('image', 'Image', 'media', {
            accept: ['image'],
            resolution: {
              minWidth: 400,
              maxWidth: 1200,
              minHeight: 300,
              maxHeight: 800
            }
          }),
          this.generateField('caption', 'Image Caption', 'input', {
            multilanguage: true,
            inputType: 'text',
            placeholder: 'Optional image caption'
          })
        ]
      })
    ];

    return this.generateComponent('gallery_section', 'Gallery Section', '4', fields);
  }
}

// Create server instance
const server = new Server(
  {
    name: 'anticms-json-generator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
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
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate_template': {
        const {
          name: templateName,
          label,
          description,
          is_content = false,
          multilanguage = true,
          is_multiple = false,
          sections = [],
          include_cta = false,
          max_features = 6,
          max_gallery_images = 12
        } = args;

        const components = [];
        let sectionCounter = 1;

        // Generate requested sections
        sections.forEach(sectionType => {
          switch (sectionType) {
            case 'hero':
              const heroSection = AntiCMSComponentGenerator.generateHeroSection({
                includeCTA: include_cta
              });
              heroSection.section = String(sectionCounter++);
              components.push(heroSection);
              break;
            
            case 'features':
              const featuresSection = AntiCMSComponentGenerator.generateFeaturesSection({
                maxFeatures: max_features
              });
              featuresSection.section = String(sectionCounter++);
              components.push(featuresSection);
              break;
            
            case 'contact':
              const contactSection = AntiCMSComponentGenerator.generateContactSection();
              contactSection.section = String(sectionCounter++);
              components.push(contactSection);
              break;
            
            case 'gallery':
              const gallerySection = AntiCMSComponentGenerator.generateGallerySection({
                maxImages: max_gallery_images
              });
              gallerySection.section = String(sectionCounter++);
              components.push(gallerySection);
              break;
          }
        });

        const template = AntiCMSComponentGenerator.generateTemplate(templateName, label, {
          is_content,
          multilanguage,
          is_multiple,
          description,
          components
        });

        return {
          content: [
            {
              type: 'text',
              text: `Generated AntiCMS v3 template "${label}" with ${components.length} sections.\n\nJSON:\n\n${JSON.stringify(template, null, 2)}`
            }
          ]
        };
      }

      case 'generate_custom_field': {
        const {
          name: fieldName,
          label,
          field_type,
          multilanguage = false,
          attributes = {}
        } = args;

        const field = AntiCMSComponentGenerator.generateField(
          fieldName,
          label,
          field_type,
          { multilanguage, ...attributes }
        );

        return {
          content: [
            {
              type: 'text',
              text: `Generated ${field_type} field "${label}".\n\nJSON:\n\n${JSON.stringify(field, null, 2)}`
            }
          ]
        };
      }

      case 'validate_template': {
        const { template_json } = args;
        
        const errors = [];
        const warnings = [];

        // Basic structure validation
        const requiredKeys = ['name', 'label', 'is_content', 'multilanguage', 'is_multiple', 'description', 'components'];
        requiredKeys.forEach(key => {
          if (!(key in template_json)) {
            errors.push(`Missing required key: ${key}`);
          }
        });

        // Validate components
        if (Array.isArray(template_json.components)) {
          template_json.components.forEach((component, index) => {
            const requiredComponentKeys = ['keyName', 'label', 'section', 'fields'];
            requiredComponentKeys.forEach(key => {
              if (!(key in component)) {
                errors.push(`Component ${index + 1} missing required key: ${key}`);
              }
            });

            // Validate fields
            if (Array.isArray(component.fields)) {
              component.fields.forEach((field, fieldIndex) => {
                const requiredFieldKeys = ['name', 'label', 'field'];
                requiredFieldKeys.forEach(key => {
                  if (!(key in field)) {
                    errors.push(`Component ${index + 1}, field ${fieldIndex + 1} missing required key: ${key}`);
                  }
                });

                // Validate field type
                if (field.field && !FIELD_TYPES[field.field]) {
                  errors.push(`Component ${index + 1}, field ${fieldIndex + 1} has unsupported field type: ${field.field}`);
                } else if (field.field) {
                  // Check required attributes
                  const fieldConfig = FIELD_TYPES[field.field];
                  if (fieldConfig.requiredAttributes.length > 0 && !field.attribute) {
                    errors.push(`Component ${index + 1}, field ${fieldIndex + 1} (${field.field}) missing required attribute object`);
                  } else if (field.attribute) {
                    fieldConfig.requiredAttributes.forEach(attr => {
                      if (!(attr in field.attribute)) {
                        errors.push(`Component ${index + 1}, field ${fieldIndex + 1} (${field.field}) missing required attribute: ${attr}`);
                      }
                    });
                  }
                }
              });
            }
          });
        } else {
          errors.push('Components must be an array');
        }

        const result = {
          valid: errors.length === 0,
          errors,
          warnings
        };

        return {
          content: [
            {
              type: 'text',
              text: `Template validation ${result.valid ? 'PASSED' : 'FAILED'}.\n\n${JSON.stringify(result, null, 2)}`
            }
          ]
        };
      }

      case 'list_field_types': {
        const fieldTypesList = Object.keys(FIELD_TYPES).map(type => ({
          type,
          attributes: FIELD_TYPES[type].attributes,
          required_attributes: FIELD_TYPES[type].requiredAttributes
        }));

        return {
          content: [
            {
              type: 'text',
              text: `AntiCMS v3 Supported Field Types:\n\n${JSON.stringify(fieldTypesList, null, 2)}`
            }
          ]
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${error.message}`
    );
  }
});

// Start server
async function main() {
const transport = new StdioServerTransport();
await server.connect(transport);
  console.error('AntiCMS v3 JSON Generator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});