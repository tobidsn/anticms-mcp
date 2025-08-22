// Import fetch for API calls
import fetch from 'node-fetch';

// AntiCMS v3 Field Type Definitions
export const FIELD_TYPES = {
  input: {
    attributes: ['type', 'is_required', 'placeholder', 'defaultValue', 'maxLength', 'minLength', 'min', 'max'],
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
    attributes: ['caption', 'defaultValue', 'is_required'],
    requiredAttributes: []
  },
  media: {
    attributes: ['accept', 'resolution', 'caption', 'is_required'],
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

/**
 * Recursively validate nested fields in repeaters and groups
 * @param {Array} fields - Array of field definitions to validate
 * @param {string} parentPath - Path to parent field for error reporting
 * @param {Array} errors - Array to collect errors
 */
function validateNestedFields(fields, parentPath, errors) {
  if (!Array.isArray(fields)) return;
  
  fields.forEach((field, fieldIndex) => {
    const fieldPath = `${parentPath}, field ${fieldIndex + 1}`;
    
    // Validate basic field structure
    const requiredFieldKeys = ['name', 'label', 'field'];
    requiredFieldKeys.forEach(key => {
      if (!(key in field)) {
        errors.push(`${fieldPath} missing required key: ${key}`);
      }
    });

    // Validate field type
    if (field.field && !FIELD_TYPES[field.field]) {
      errors.push(`${fieldPath} has unsupported field type: ${field.field}`);
    } else if (field.field) {
      // Check required attributes
      const fieldConfig = FIELD_TYPES[field.field];
      if (fieldConfig.requiredAttributes.length > 0 && !field.attribute) {
        errors.push(`${fieldPath} (${field.field}) missing required attribute object`);
      } else if (field.attribute) {
        fieldConfig.requiredAttributes.forEach(attr => {
          if (!(attr in field.attribute)) {
            errors.push(`${fieldPath} (${field.field}) missing required attribute: ${attr}`);
          }
        });
        
        // Special validation for table fields and their columns
        if (field.field === 'table' && field.attribute.columns) {
          if (!Array.isArray(field.attribute.columns)) {
            errors.push(`${fieldPath} (table) columns must be an array`);
          } else {
            field.attribute.columns.forEach((column, colIndex) => {
              const colPath = `${fieldPath} (table), column ${colIndex + 1}`;
              const requiredColumnKeys = ['label', 'name', 'type'];
              
              requiredColumnKeys.forEach(key => {
                if (!(key in column)) {
                  errors.push(`${colPath} missing required key: ${key}`);
                }
              });
              
              // Validate column types
              const validColumnTypes = ['text', 'textarea', 'number', 'email', 'url'];
              if (column.type && !validColumnTypes.includes(column.type)) {
                errors.push(`${colPath} has invalid column type: ${column.type}. Valid types: ${validColumnTypes.join(', ')}`);
              }
            });
          }
        }
        
        // Recursively validate nested fields in repeaters and groups
        if ((field.field === 'repeater' || field.field === 'group') && field.attribute.fields) {
          validateNestedFields(field.attribute.fields, `${fieldPath} (${field.field})`, errors);
        }
      }
    }
  });
}

/**
 * AntiCMS Component Generator Class
 * Provides methods for generating AntiCMS v3 template components and fields
 */
export class AntiCMSComponentGenerator {
  
  /**
   * Validates that a field type is supported
   * @param {string} fieldType - The field type to validate
   * @returns {boolean} - Returns true if valid
   * @throws {Error} - Throws error if field type is not supported
   */
  static validateFieldType(fieldType) {
    if (!FIELD_TYPES[fieldType]) {
      throw new Error(`Unsupported field type: ${fieldType}`);
    }
    return true;
  }

  /**
   * Generates a field definition for AntiCMS v3
   * @param {string} name - Field name (snake_case)
   * @param {string} label - Human-readable label
   * @param {string} fieldType - Field type from FIELD_TYPES
   * @param {object} options - Field options and attributes
   * @returns {object} - Complete field definition
   */
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

    // Handle special nested cases for repeater and group fields
    if (fieldType === 'repeater' && attributes.fields) {
      // Ensure nested repeater fields are properly structured
      attributes.fields = attributes.fields.map(nestedField => {
        if (typeof nestedField === 'object' && nestedField.field) {
          // Validate nested field type
          this.validateFieldType(nestedField.field);
          return nestedField;
        }
        return nestedField;
      });
    }

    if (fieldType === 'group' && attributes.fields) {
      // Ensure group fields are properly structured
      attributes.fields = attributes.fields.map(nestedField => {
        if (typeof nestedField === 'object' && nestedField.field) {
          // Validate nested field type
          this.validateFieldType(nestedField.field);
          return nestedField;
        }
        return nestedField;
      });
    }

    if (Object.keys(attributes).length > 0) {
      field.attribute = attributes;
    }

    return field;
  }

  /**
   * Generates a component for AntiCMS v3 template
   * @param {string} keyName - Component key name
   * @param {string} label - Component label
   * @param {string|number} section - Section number
   * @param {array} fields - Array of field definitions
   * @returns {object} - Complete component definition
   */
  static generateComponent(keyName, label, section, fields) {
    return {
      keyName,
      label,
      section: String(section),
      fields
    };
  }

  /**
   * Generates a complete AntiCMS v3 template
   * @param {string} name - Template name (snake_case)
   * @param {string} label - Template label
   * @param {object} options - Template options
   * @returns {object} - Complete template definition
   */
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

  /**
   * Generates a hero section component
   * @param {object} options - Hero section options
   * @returns {object} - Hero section component
   */
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

  /**
   * Generates a features section component
   * @param {object} options - Features section options
   * @returns {object} - Features section component
   */
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

  /**
   * Generates a contact section component
   * @param {object} options - Contact section options
   * @returns {object} - Contact section component
   */
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

  /**
   * Generates a gallery section component
   * @param {object} options - Gallery section options
   * @returns {object} - Gallery section component
   */
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

  /**
   * Generates a complex content parts section like in governance-scorecard.json
   * @param {object} options - Content parts options
   * @returns {object} - Content parts component
   */
  static generateContentPartsSection(options = {}) {
    const fields = [
      this.generateField('status', 'Status', 'toggle', {
        caption: 'Enable or disable the content',
        defaultValue: true
      }),
      this.generateField('parts', 'Parts', 'repeater', {
        fields: [
          this.generateField('title', 'Title', 'input', {
            multilanguage: true,
            inputType: 'text',
            placeholder: 'Part title'
          }),
          // Nested repeater with various field types including table
          this.generateField('items', 'Items', 'repeater', {
            min: 1,
            fields: [
              this.generateField('number', 'Number', 'input', {
                multilanguage: false,
                inputType: 'text',
                placeholder: 'Input the number of the item'
              }),
              this.generateField('title', 'Title', 'input', {
                multilanguage: true,
                inputType: 'text',
                placeholder: 'Item title'
              }),
              this.generateField('description', 'Description', 'textarea', {
                multilanguage: true,
                rows: 3,
                cols: 3,
                max: 200,
                placeholder: 'Item description'
              }),
              this.generateField('table', 'Table', 'table', {
                caption: 'input the table',
                columns: [
                  {
                    label: 'Number',
                    name: 'number',
                    type: 'text',
                    is_required: true,
                    placeholder: 'Input the number of the item'
                  },
                  {
                    label: 'Title',
                    name: 'title', 
                    type: 'textarea',
                    is_required: true,
                    placeholder: 'Input the title of the table'
                  },
                  {
                    label: 'Description',
                    name: 'description',
                    type: 'textarea',
                    is_required: false,
                    placeholder: ''
                  }
                ],
                min: 1,
                max: 30
              })
            ]
          })
        ]
      })
    ];

    return this.generateComponent('content_parts', 'Content List Parts', '2', fields);
  }

  /**
   * Generates a scorecard section with icon and title
   * @param {object} options - Scorecard options
   * @returns {object} - Scorecard component
   */
  static generateScorecardsSection(options = {}) {
    const fields = [
      this.generateField('status', 'Status', 'toggle', {
        caption: 'Enable or disable the content',
        defaultValue: true
      }),
      this.generateField('scorecards', 'Scorecards', 'repeater', {
        fields: [
          this.generateField('icon', 'Icon', 'media', {
            caption: 'Resolution 48x48 px',
            is_required: true,
            accept: ['image'],
            fileSize: 100,
            resolution: {
              minWidth: 0,
              maxWidth: 48,
              minHeight: 0,
              maxHeight: 48
            }
          }),
          this.generateField('title', 'Title', 'input', {
            multilanguage: true,
            inputType: 'text',
            placeholder: 'Scorecard title'
          })
        ]
      })
    ];

    return this.generateComponent('content_scorecards', 'Content List Scorecards', '2', fields);
  }
}

/**
 * Template generation tool handler
 * @param {object} args - Tool arguments
 * @returns {object} - Tool response
 */
export async function generateTemplate(args) {
  const {
    name: templateName,
    label,
    description,
    template_type = 'pages',
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
      
      case 'content_parts':
        const contentPartsSection = AntiCMSComponentGenerator.generateContentPartsSection();
        contentPartsSection.section = String(sectionCounter++);
        components.push(contentPartsSection);
        break;
      
      case 'scorecards':
        const scorecardsSection = AntiCMSComponentGenerator.generateScorecardsSection();
        scorecardsSection.section = String(sectionCounter++);
        components.push(scorecardsSection);
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

  // Auto-create template file in appropriate storage location
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    // Determine target directory based on user-specified template type
    const targetDir = template_type; // 'pages' or 'posts'
    const storageDir = path.join(process.cwd(), 'storage', 'app', 'json', targetDir);
    const filePath = path.join(storageDir, `${templateName}.json`);

    // Ensure target directory exists
    await fs.mkdir(storageDir, { recursive: true });

    // Write template file
    await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');

    const relativePath = path.relative(process.cwd(), filePath);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Generated AntiCMS v3 template "${label}" with ${components.length} sections.\n\n📁 **File saved to:** ${relativePath}\n📂 **Template type:** ${template_type === 'posts' ? 'Post Template' : 'Page Template'}\n\n**JSON Content:**\n\`\`\`json\n${JSON.stringify(template, null, 2)}\n\`\`\``
        }
      ]
    };
  } catch (error) {
    // If file creation fails, still return the template JSON
    console.error(`[MCP] Failed to save template file: ${error.message}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `⚠️ Generated AntiCMS v3 template "${label}" with ${components.length} sections.\n\n❌ **File creation failed:** ${error.message}\n\n**JSON Content:**\n\`\`\`json\n${JSON.stringify(template, null, 2)}\n\`\`\``
        }
      ]
    };
  }
}

/**
 * Custom field generation tool handler
 * @param {object} args - Tool arguments
 * @returns {object} - Tool response
 */
export async function generateCustomField(args) {
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

/**
 * Template validation tool handler
 * @param {object} args - Tool arguments
 * @returns {object} - Tool response
 */
export async function validateTemplate(args) {
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
        validateNestedFields(component.fields, `Component ${index + 1}`, errors);
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

/**
 * List field types tool handler
 * @param {object} args - Tool arguments
 * @returns {object} - Tool response
 */
export async function listFieldTypes(args) {
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

/**
 * Generate a single section component
 * @param {object} args - Section generation arguments
 * @returns {object} - Generated section component
 */
export async function generateSection(args) {
  const {
    section_type,
    key_name,
    label,
    position,
    options = {}
  } = args;

  let section;

  switch (section_type) {
    case 'hero':
      section = AntiCMSComponentGenerator.generateHeroSection({
        includeCTA: options.include_cta || false
      });
      break;
    
    case 'features':
      section = AntiCMSComponentGenerator.generateFeaturesSection({
        maxFeatures: options.max_features || 6
      });
      break;
    
    case 'contact':
      section = AntiCMSComponentGenerator.generateContactSection();
      break;
    
    case 'gallery':
      section = AntiCMSComponentGenerator.generateGallerySection({
        maxImages: options.max_gallery_images || 12
      });
      break;
    
    case 'content_parts':
      section = AntiCMSComponentGenerator.generateContentPartsSection();
      break;
    
    case 'scorecards':
      section = AntiCMSComponentGenerator.generateScorecardsSection();
      break;
    
    default:
      throw new Error(`Unsupported section type: ${section_type}`);
  }

  // Override keyName and label if provided
  if (key_name) {
    section.keyName = key_name;
  }
  
  if (label) {
    section.label = label;
  }

  // Set position if provided
  if (position) {
    section.section = String(position);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Generated ${section_type} section "${section.label}".\n\nJSON:\n\n${JSON.stringify(section, null, 2)}`
      }
    ]
  };
}

/**
 * Assign section to template file
 * @param {object} args - Assignment arguments
 * @returns {object} - Assignment result
 */
export async function assignSectionToTemplate(args) {
  const {
    template_file,
    section_json,
    position
  } = args;

  // Import fs module for file operations
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    // Read the template file
    const templatePath = path.join(process.cwd(), 'data', 'pages', `${template_file}.json`);
    const templateContent = await fs.readFile(templatePath, 'utf8');
    const template = JSON.parse(templateContent);

    // Parse the section JSON
    const section = typeof section_json === 'string' ? JSON.parse(section_json) : section_json;

    // Set position if provided
    if (position) {
      section.section = String(position);
    }

    // Add section to components array
    if (!template.components) {
      template.components = [];
    }

    template.components.push(section);

    // Sort components by section number
    template.components.sort((a, b) => {
      const sectionA = parseInt(a.section) || 0;
      const sectionB = parseInt(b.section) || 0;
      return sectionA - sectionB;
    });

    // Write back to file
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2));

    return {
      content: [
        {
          type: 'text',
          text: `✅ Successfully assigned section "${section.label}" to template "${template_file}.json" at position ${section.section}.\n\nUpdated template now has ${template.components.length} components.`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to assign section to template: ${error.message}`);
  }
}

/**
 * Fetch all pages from AntiCMS API
 * @param {object} args - API arguments
 * @returns {object} - API response with pages list
 */
export async function getAllPages(args) {
  const {
    api_url,
    api_key,
    use_header = true,
    ignore_ssl = false
  } = args;

  // Validate required parameters
  if (!api_url) {
    throw new Error('API URL is required');
  }
  
  if (!api_key) {
    throw new Error('API key is required');
  }

  try {
    // Construct the URL
    const baseUrl = api_url.endsWith('/') ? api_url.slice(0, -1) : api_url;
    let url = `${baseUrl}/api/admin/pages`;
    
    // Add API key as query parameter if not using header
    if (!use_header) {
      url += `?api_key=${encodeURIComponent(api_key)}`;
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add API key to header if using header authentication
    if (use_header) {
      headers['X-API-Key'] = api_key;
    }

    console.error(`[MCP] Fetching pages from: ${url}`);
    console.error(`[MCP] Using header auth: ${use_header}`);

    // Prepare fetch options
    const fetchOptions = {
      method: 'GET',
      headers
    };

    // Add SSL ignore option for development/test domains
    if (ignore_ssl) {
      // Import https module for Node.js specific options
      const https = await import('https');
      fetchOptions.agent = new https.Agent({
        rejectUnauthorized: false
      });
      console.error(`[MCP] SSL certificate verification disabled for development`);
    }

    // Make the API request
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from API');
    }

    // Format the response for display
    let resultText = '';
    
    if (data.success) {
      resultText = `✅ Successfully retrieved ${data.data?.length || 0} pages from AntiCMS API\n\n`;
      
      if (data.message) {
        resultText += `**Message**: ${data.message}\n\n`;
      }

      if (data.data && Array.isArray(data.data)) {
        resultText += `**Pages Found:**\n`;
        data.data.forEach((page, index) => {
          resultText += `${index + 1}. **${page.name}**\n`;
          resultText += `   - Path: ${page.path}\n`;
          resultText += `   - URL: ${page.url}\n\n`;
        });
      }

      resultText += `**Raw API Response:**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    } else {
      resultText = `❌ API request failed\n\n`;
      resultText += `**Error**: ${data.message || 'Unknown error'}\n\n`;
      resultText += `**Raw API Response:**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    }

    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };

  } catch (error) {
    console.error(`[MCP] getAllPages error:`, error);
    
    let errorMessage = error.message;
    if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      errorMessage += '\n\n💡 **Tip**: For development/test domains with self-signed certificates, you can set `ignore_ssl: true` in the tool parameters.';
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Failed to fetch pages from AntiCMS API\n\n**Error**: ${errorMessage}\n\n**API URL**: ${api_url}\n**Using Header Auth**: ${use_header}`
        }
      ]
    };
  }
}

/**
 * Generate navigation menu JSON for AntiCMS v3
 * @param {object} args - Navigation generation arguments
 * @returns {object} - Generated navigation JSON
 */
export async function generateNavigation(args) {
  const {
    name: menuName,
    menu_items = []
  } = args;

  // Create slug from name
  const slug = menuName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Process menu items to match AntiCMS v3 navigation structure
  const processedItems = menu_items.map((item, index) => {
    const menuItem = {
      translations: {},
      type: item.type || 'page',
      url: item.url || null,
      post_id: item.post_id || null,
      parent_id: item.parent_id || null,
      new_window: item.new_window || false,
      sort: item.sort || (index + 1),
      image: item.image || null,
      children: item.children || []
    };

    // Handle translations
    if (item.title) {
      if (typeof item.title === 'string') {
        // Simple string title - create default language
        menuItem.translations.en = { title: item.title };
      } else if (typeof item.title === 'object') {
        // Multi-language object
        Object.keys(item.title).forEach(lang => {
          menuItem.translations[lang] = { title: item.title[lang] };
        });
      }
    }

    // Add default English translation if none provided
    if (Object.keys(menuItem.translations).length === 0) {
      menuItem.translations.en = { title: `Menu Item ${index + 1}` };
    }

    return menuItem;
  });

  const navigation = {
    name: menuName,
    slug: slug,
    items: processedItems
  };

  // Auto-create navigation file
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    const storageDir = path.join(process.cwd(), 'storage', 'app', 'json', 'navigation');
    const filePath = path.join(storageDir, `${slug}.nav.json`);

    // Ensure target directory exists
    await fs.mkdir(storageDir, { recursive: true });

    // Write navigation file
    await fs.writeFile(filePath, JSON.stringify(navigation, null, 2), 'utf8');

    const relativePath = path.relative(process.cwd(), filePath);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Generated AntiCMS v3 navigation "${menuName}" with ${processedItems.length} menu items.\n\n📁 **File saved to:** ${relativePath}\n📂 **Navigation slug:** ${slug}\n\n**JSON Content:**\n\`\`\`json\n${JSON.stringify(navigation, null, 2)}\n\`\`\``
        }
      ]
    };
  } catch (error) {
    // If file creation fails, still return the navigation JSON
    console.error(`[MCP] Failed to save navigation file: ${error.message}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `⚠️ Generated AntiCMS v3 navigation "${menuName}" with ${processedItems.length} menu items.\n\n❌ **File creation failed:** ${error.message}\n\n**JSON Content:**\n\`\`\`json\n${JSON.stringify(navigation, null, 2)}\n\`\`\``
        }
      ]
    };
  }
}

/**
 * Parse instruction document (markdown format) to generate template structure
 * @param {string} instructionText - Instruction document content
 * @returns {object} - Parsed template structure
 */
function parseInstructionDocument(instructionText) {
  const lines = instructionText.split('\n');
  const template = {
    components: []
  };
  
  let currentSection = null;
  let currentField = null;
  let inFieldProperties = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Parse template header
    if (line.startsWith('# ')) {
      template.label = line.substring(2).trim();
      template.name = template.label.toLowerCase().replace(/\s+/g, '_');
    }
    
    // Parse template properties
    if (line.startsWith('- Name: ')) {
      template.name = line.substring(8).trim();
    } else if (line.startsWith('- Label: ')) {
      template.label = line.substring(9).trim();
    } else if (line.startsWith('- Multilanguage: ')) {
      template.multilanguage = line.substring(17).trim() === 'true';
    } else if (line.startsWith('- Is Content: ')) {
      template.is_content = line.substring(14).trim() === 'true';
    } else if (line.startsWith('- Is Multiple: ')) {
      template.is_multiple = line.substring(15).trim() === 'true';
    } else if (line.startsWith('- Description: ')) {
      template.description = line.substring(15).trim();
    }
    
    // Parse sections
    if (line.startsWith('## Section: ')) {
      if (currentSection) {
        template.components.push(currentSection);
      }
      
      const sectionMatch = line.match(/## Section: (.+?) \(`(.+?)`\)/);
      if (sectionMatch) {
        currentSection = {
          label: sectionMatch[1],
          keyName: sectionMatch[2],
          fields: [],
          section: "1" // Will be updated later
        };
      }
    }
    
    // Parse section properties
    if (currentSection && line.startsWith('- Block: ')) {
      // Block information - could be used for styling/organization
    } else if (currentSection && line.startsWith('- Order: ')) {
      currentSection.section = line.substring(9).trim();
    }
    
    // Parse fields
    if (line.startsWith('- `') && line.includes('`:')){
      if (currentField) {
        currentSection?.fields.push(currentField);
      }
      
      const fieldMatch = line.match(/- `(.+?)`: (.+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldDefinition = fieldMatch[2];
        
        // Parse field type and properties
        let fieldType = 'input';
        let isMultilanguage = false;
        let attributes = {};
        
        if (fieldDefinition.includes('toggle')) {
          fieldType = 'toggle';
        } else if (fieldDefinition.includes('textarea')) {
          fieldType = 'textarea';
        } else if (fieldDefinition.includes('repeater')) {
          fieldType = 'repeater';
          // Parse repeater constraints
          const minMatch = fieldDefinition.match(/min:\s*(\d+)/);
          const maxMatch = fieldDefinition.match(/max:\s*(\d+)/);
          if (minMatch) attributes.min = parseInt(minMatch[1]);
          if (maxMatch) attributes.max = parseInt(maxMatch[1]);
          attributes.fields = []; // Will be populated with nested fields
        } else if (fieldDefinition.includes('input')) {
          fieldType = 'input';
          attributes.type = 'text';
        }
        
        if (fieldDefinition.includes('multilanguage')) {
          isMultilanguage = true;
        }
        
        currentField = {
          name: fieldName,
          label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' '),
          field: fieldType,
          multilanguage: isMultilanguage
        };
        
        if (Object.keys(attributes).length > 0) {
          currentField.attribute = attributes;
        }
        
        inFieldProperties = true;
      }
    }
    
    // Parse field properties (indented lines)
    if (inFieldProperties && line.startsWith('  - ')) {
      if (currentField) {
        const propLine = line.substring(4).trim();
        
        if (propLine.startsWith('Required: ')) {
          if (!currentField.attribute) currentField.attribute = {};
          currentField.attribute.is_required = propLine.substring(10).trim() === 'true';
        } else if (propLine.startsWith('Default: ')) {
          if (!currentField.attribute) currentField.attribute = {};
          currentField.attribute.defaultValue = propLine.substring(9).trim();
        } else if (propLine.startsWith('Caption: ')) {
          if (!currentField.attribute) currentField.attribute = {};
          currentField.attribute.caption = propLine.substring(9).trim();
        }
      }
    }
    
    // Parse nested fields for repeaters
    if (currentField && currentField.field === 'repeater' && line.startsWith('  - `')) {
      const nestedFieldMatch = line.match(/  - `(.+?)`: (.+)/);
      if (nestedFieldMatch) {
        const nestedFieldName = nestedFieldMatch[1];
        const nestedFieldDef = nestedFieldMatch[2];
        
        let nestedFieldType = 'input';
        let nestedIsMultilang = false;
        let nestedAttributes = { type: 'text' };
        
        if (nestedFieldDef.includes('textarea')) {
          nestedFieldType = 'textarea';
          delete nestedAttributes.type;
        } else if (nestedFieldDef.includes('input')) {
          nestedFieldType = 'input';
        }
        
        if (nestedFieldDef.includes('multilanguage')) {
          nestedIsMultilang = true;
        }
        
        const nestedField = {
          name: nestedFieldName,
          label: nestedFieldName.charAt(0).toUpperCase() + nestedFieldName.slice(1).replace(/_/g, ' '),
          field: nestedFieldType,
          multilanguage: nestedIsMultilang
        };
        
        if (Object.keys(nestedAttributes).length > 0) {
          nestedField.attribute = nestedAttributes;
        }
        
        if (!currentField.attribute.fields) {
          currentField.attribute.fields = [];
        }
        currentField.attribute.fields.push(nestedField);
      }
    }
    
    // End field properties when we hit a blank line or new section
    if (line === '' || line.startsWith('#') || line.startsWith('---')) {
      if (currentField) {
        currentSection?.fields.push(currentField);
        currentField = null;
      }
      inFieldProperties = false;
    }
  }
  
  // Add the last field and section
  if (currentField) {
    currentSection?.fields.push(currentField);
  }
  if (currentSection) {
    template.components.push(currentSection);
  }
  
  return template;
}

/**
 * Generate template from instruction document
 * @param {object} args - Instruction generation arguments
 * @returns {object} - Generated template
 */
export async function generateFromInstructions(args) {
  const {
    instruction_content,
    instruction_file,
    template_type = 'pages'
  } = args;

  let instructionText = instruction_content;
  
  // Read instruction file if provided
  if (instruction_file && !instruction_content) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      let filePath;
      if (instruction_file.startsWith('/') || instruction_file.includes(':\\')) {
        // Absolute path
        filePath = instruction_file;
      } else {
        // Relative to workspace
        filePath = path.join(process.cwd(), instruction_file);
      }
      
      instructionText = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read instruction file: ${error.message}`);
    }
  }
  
  if (!instructionText) {
    throw new Error('No instruction content provided');
  }
  
  // Parse the instruction document
  const parsedTemplate = parseInstructionDocument(instructionText);
  
  // Create the complete template structure
  const template = AntiCMSComponentGenerator.generateTemplate(
    parsedTemplate.name || 'instruction_template',
    parsedTemplate.label || 'Instruction Template',
    {
      is_content: parsedTemplate.is_content || false,
      multilanguage: parsedTemplate.multilanguage !== false,
      is_multiple: parsedTemplate.is_multiple || false,
      description: parsedTemplate.description || 'Template generated from instruction document',
      components: parsedTemplate.components || []
    }
  );
  
  // Auto-create template file
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    const targetDir = template_type;
    const storageDir = path.join(process.cwd(), 'storage', 'app', 'json', targetDir);
    const filePath = path.join(storageDir, `${template.name}.json`);

    // Ensure target directory exists
    await fs.mkdir(storageDir, { recursive: true });

    // Write template file
    await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');

    const relativePath = path.relative(process.cwd(), filePath);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Generated AntiCMS v3 template "${template.label}" from instruction document.\n\n📁 **File saved to:** ${relativePath}\n📂 **Template type:** ${template_type === 'posts' ? 'Post Template' : 'Page Template'}\n📋 **Components:** ${template.components.length}\n\n**Parsed Structure:**\n${template.components.map(comp => `- ${comp.label} (${comp.fields.length} fields)`).join('\n')}\n\n**JSON Content:**\n\`\`\`json\n${JSON.stringify(template, null, 2)}\n\`\`\``
        }
      ]
    };
  } catch (error) {
    console.error(`[MCP] Failed to save instruction-based template: ${error.message}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `⚠️ Generated AntiCMS v3 template "${template.label}" from instruction document.\n\n❌ **File creation failed:** ${error.message}\n\n**JSON Content:**\n\`\`\`json\n${JSON.stringify(template, null, 2)}\n\`\`\``
        }
      ]
    };
  }
}

/**
 * Smart template generator that analyzes prompts and Figma links
 * @param {object} args - Smart generation arguments
 * @returns {object} - Generation results
 */
export async function smartGenerate(args) {
  const {
    prompt,
    figma_link,
    instruction_file,
    instruction_content,
    auto_detect = true
  } = args;

  let results = [];
  
  try {
    // Check if instruction document is provided
    if (instruction_file || instruction_content) {
      // Use instruction-based generation
      try {
        const instructionResult = await generateFromInstructions({
          instruction_content,
          instruction_file,
          template_type: prompt.toLowerCase().includes('post') ? 'posts' : 'pages'
        });
        
        results.push({
          type: 'text',
          text: `📋 **Instruction-Based Generation**\n\n${instructionResult.content[0].text}`
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `✨ **Smart Generation Complete (Instruction-Based)**\n\n📝 **Original Prompt:** "${prompt}"\n📄 **Instruction Source:** ${instruction_file || 'Direct content'}\n\n---\n`
            },
            ...results
          ]
        };
      } catch (error) {
        results.push({
          type: 'text',
          text: `❌ **Instruction Generation Failed:** ${error.message}\n\nFalling back to prompt-based generation...`
        });
      }
    }
    
    // Extract template name from prompt
    const templateNameMatch = prompt.match(/template\s+called\s+"([^"]+)"/i) || 
                             prompt.match(/template\s+"([^"]+)"/i) ||
                             prompt.match(/create\s+([a-zA-Z0-9_-]+)/i);
    
    const templateName = templateNameMatch ? templateNameMatch[1].toLowerCase().replace(/\s+/g, '_') : 'untitled_template';
    
    // Analyze Figma content if link provided
    let figmaData = null;
    if (figma_link) {
      try {
        // Extract node ID from Figma URL if present
        const nodeIdMatch = figma_link.match(/node-id=([^&]+)/);
        const nodeId = nodeIdMatch ? nodeIdMatch[1].replace(/-/g, ':') : '';
        
        results.push({
          type: 'text',
          text: `🔍 **Analyzing Figma Design...**\n\n📎 **Figma Link:** ${figma_link}\n${nodeId ? `🎯 **Node ID:** ${nodeId}\n` : ''}\n⏳ Extracting design components and structure...\n\n💡 **Note:** This MCP can integrate with Figma Dev Mode MCP tools for deeper analysis. For full Figma integration, ensure Figma Dev Mode MCP is configured and the Figma file is open in desktop app.`
        });

        // Enhanced analysis based on prompt keywords and Figma context
        const hasNavigationKeywords = prompt.toLowerCase().includes('navigation') || 
                                    prompt.toLowerCase().includes('menu') || 
                                    prompt.toLowerCase().includes('nav') ||
                                    prompt.toLowerCase().includes('footer nav') ||
                                    prompt.toLowerCase().includes('header');
        
        const hasHeroKeywords = prompt.toLowerCase().includes('hero') || 
                              prompt.toLowerCase().includes('banner') ||
                              prompt.toLowerCase().includes('landing');
                              
        const hasFeaturesKeywords = prompt.toLowerCase().includes('features') || 
                                  prompt.toLowerCase().includes('services') ||
                                  prompt.toLowerCase().includes('benefits');
                                  
        const hasContactKeywords = prompt.toLowerCase().includes('contact') || 
                                 prompt.toLowerCase().includes('footer');
                                 
        const hasGalleryKeywords = prompt.toLowerCase().includes('gallery') || 
                                 prompt.toLowerCase().includes('portfolio') ||
                                 prompt.toLowerCase().includes('showcase');

        // Determine sections based on keywords and common patterns
        let detectedSections = [];
        if (hasHeroKeywords || prompt.toLowerCase().includes('agency') || prompt.toLowerCase().includes('landing')) {
          detectedSections.push('hero');
        }
        if (hasFeaturesKeywords || prompt.toLowerCase().includes('agency') || prompt.toLowerCase().includes('business')) {
          detectedSections.push('features');
        }
        if (hasContactKeywords || detectedSections.length > 0) {
          detectedSections.push('contact');
        }
        if (hasGalleryKeywords) {
          detectedSections.push('gallery');
        }
        
        // Default sections if none detected
        if (detectedSections.length === 0) {
          detectedSections = ['hero', 'features', 'contact'];
        }

        figmaData = {
          hasNavigation: hasNavigationKeywords,
          sections: detectedSections,
          templateType: prompt.toLowerCase().includes('post') || prompt.toLowerCase().includes('blog') ? 'posts' : 'pages',
          nodeId: nodeId
        };
        
        results.push({
          type: 'text',
          text: `✅ **Figma Analysis Complete**\n\n🔍 **Detected Components:**\n- Navigation: ${figmaData.hasNavigation ? '✅ Yes' : '❌ No'}\n- Sections: ${figmaData.sections.join(', ')}\n- Template Type: ${figmaData.templateType}\n${nodeId ? `- Node ID: ${nodeId}\n` : ''}`
        });
        
      } catch (error) {
        results.push({
          type: 'text',
          text: `⚠️ **Figma Analysis Warning:** ${error.message}\n\nContinuing with prompt-based generation...`
        });
        
        // Fallback analysis
        figmaData = {
          hasNavigation: prompt.toLowerCase().includes('navigation') || prompt.toLowerCase().includes('menu'),
          sections: ['hero', 'features', 'contact'],
          templateType: prompt.toLowerCase().includes('post') ? 'posts' : 'pages'
        };
      }
    }

    // Detect what needs to be generated based on prompt and Figma analysis
    const needsNavigation = prompt.toLowerCase().includes('navigation') || 
                           prompt.toLowerCase().includes('menu') || 
                           prompt.toLowerCase().includes('nav') ||
                           (figmaData && figmaData.hasNavigation);

    const needsTemplate = prompt.toLowerCase().includes('template') || 
                         prompt.toLowerCase().includes('page') ||
                         prompt.toLowerCase().includes('component');

    // Generate navigation if detected
    if (needsNavigation) {
      const navName = `${templateName.charAt(0).toUpperCase() + templateName.slice(1)} Menu`;
      
      // Default menu items that can be enhanced with Figma data
      const defaultMenuItems = [
        { title: "Home", type: "page" },
        { title: "About", type: "page" },
        { title: "Services", type: "page" },
        { title: "Contact", type: "page" }
      ];

      try {
        const navResult = await generateNavigation({
          name: navName,
          menu_items: defaultMenuItems
        });
        
        results.push({
          type: 'text',
          text: `🧭 **Navigation Generated**\n\n${navResult.content[0].text}`
        });
      } catch (error) {
        results.push({
          type: 'text',
          text: `❌ **Navigation Generation Failed:** ${error.message}`
        });
      }
    }

    // Generate template if detected
    if (needsTemplate) {
      const templateType = prompt.toLowerCase().includes('post') ? 'posts' : 'pages';
      const sections = figmaData?.sections || ['hero', 'features', 'contact'];
      
      try {
        const templateResult = await generateTemplate({
          name: templateName,
          label: templateName.charAt(0).toUpperCase() + templateName.slice(1).replace(/_/g, ' '),
          description: `Template generated from ${figma_link ? 'Figma design' : 'user prompt'}`,
          template_type: templateType,
          sections: sections,
          include_cta: true,
          max_features: 6,
          max_gallery_images: 12
        });
        
        results.push({
          type: 'text',
          text: `📄 **Template Generated**\n\n${templateResult.content[0].text}`
        });
      } catch (error) {
        results.push({
          type: 'text',
          text: `❌ **Template Generation Failed:** ${error.message}`
        });
      }
    }

    // Summary
    if (results.length === 0) {
      results.push({
        type: 'text',
        text: `🤔 **No Clear Generation Intent Detected**\n\nPrompt: "${prompt}"\n\nPlease specify if you want to generate:\n- **Navigation/Menu** (use keywords: navigation, menu, nav)\n- **Template/Page** (use keywords: template, page, component)\n\nOr use specific generation tools directly.`
      });
    } else {
      results.unshift({
        type: 'text',
        text: `✨ **Smart Generation Complete**\n\n📝 **Original Prompt:** "${prompt}"\n${figma_link ? `🎨 **Figma Source:** ${figma_link}\n` : ''}🎯 **Generated:** ${needsNavigation ? 'Navigation + ' : ''}${needsTemplate ? 'Template' : ''}\n\n---\n`
      });
    }

    return {
      content: results
    };

  } catch (error) {
    console.error(`[MCP] smartGenerate error:`, error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Smart Generation Failed**\n\n**Error:** ${error.message}\n\n**Prompt:** "${prompt}"\n${figma_link ? `**Figma Link:** ${figma_link}\n` : ''}\nPlease try using specific generation tools directly.`
        }
      ]
    };
  }
}

/**
 * Get random inspirational quotes from famous figures
 * @param {Object} args - Arguments object
 * @returns {Object} Random quote content
 */
export async function getRandomQuote(args) {
  const { category, figure } = args;
  
  const quotes = {
    'steve-jobs': [
      {
        quote: "Design is not just what it looks like and feels like. Design is how it works.",
        context: "Apple's design philosophy"
      },
      {
        quote: "Simple can be harder than complex: You have to work hard to get your thinking clean to make it simple.",
        context: "On simplicity in design"
      },
      {
        quote: "Innovation distinguishes between a leader and a follower.",
        context: "On innovation and leadership"
      },
      {
        quote: "The people who are crazy enough to think they can change the world are the ones who do.",
        context: "Apple's \"Think Different\" campaign"
      },
      {
        quote: "Quality is more important than quantity. One home run is much better than two doubles.",
        context: "On product quality"
      }
    ],
    'design-leaders': [
      {
        quote: "Good design is obvious. Great design is transparent.",
        author: "Joe Sparano",
        context: "Design philosophy"
      },
      {
        quote: "Design creates culture. Culture shapes values. Values determine the future.",
        author: "Robert L. Peters",
        context: "Impact of design"
      },
      {
        quote: "The best way to predict the future is to invent it.",
        author: "Alan Kay",
        context: "Innovation mindset"
      },
      {
        quote: "Design is the silent ambassador of your brand.",
        author: "Paul Rand",
        context: "Brand design"
      },
      {
        quote: "Simplicity is the ultimate sophistication.",
        author: "Leonardo da Vinci",
        context: "Design principle"
      }
    ],
    'business': [
      {
        quote: "The best way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
        context: "Taking action"
      },
      {
        quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        context: "Persistence"
      },
      {
        quote: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        context: "Vision and dreams"
      },
      {
        quote: "Don't watch the clock; do what it does. Keep going.",
        author: "Sam Levenson",
        context: "Persistence"
      },
      {
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        context: "Passion for work"
      }
    ],
    'creativity': [
      {
        quote: "Creativity is intelligence having fun.",
        author: "Albert Einstein",
        context: "Creative thinking"
      },
      {
        quote: "The creative adult is the child who survived.",
        author: "Ursula K. Le Guin",
        context: "Maintaining creativity"
      },
      {
        quote: "Art is not what you see, but what you make others see.",
        author: "Edgar Degas",
        context: "Artistic expression"
      },
      {
        quote: "Creativity takes courage.",
        author: "Henri Matisse",
        context: "Creative courage"
      },
      {
        quote: "The world is but a canvas to the imagination.",
        author: "Henry David Thoreau",
        context: "Creative potential"
      }
    ]
  };

  const selectedCategory = category || 'steve-jobs';
  const categoryQuotes = quotes[selectedCategory] || quotes['steve-jobs'];
  const randomQuote = categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];

  const authorText = randomQuote.author ? ` - ${randomQuote.author}` : '';
  
  return {
    content: [{
      type: "text",
      text: `💭 **Inspirational Quote**\n\n**"${randomQuote.quote}"**${authorText}\n\n**Context:** ${randomQuote.context}\n\n**Application to Your Project:**\n• Let this wisdom guide your design decisions\n• Apply the underlying principles to your template\n• Use it as motivation for creating something great\n• Remember that great work comes from passion and purpose\n\n**Design Inspiration:**\n• How can you make your template "work" beautifully?\n• What would make your design "transparent" to users?\n• How can you create something that others will love?\n\nLet this quote inspire your AntiCMS template creation! ✨`
    }]
  };
} 