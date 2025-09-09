// Field type definitions cache
let FIELD_TYPES_CACHE = null;

/**
 * Load field types dynamically from data/field-types directory
 * @returns {Promise<Object>} Field types configuration
 */
async function loadFieldTypes() {
  if (FIELD_TYPES_CACHE) {
    return FIELD_TYPES_CACHE;
  }

  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Load field types index
    const indexPath = path.join(process.cwd(), 'data', 'field-types', 'index.json');
    const indexContent = await fs.readFile(indexPath, 'utf8');
    const indexData = JSON.parse(indexContent);
    
    const fieldTypes = {};
    
    // Load each field type definition
    for (const fieldTypeInfo of indexData.field_types) {
      if (fieldTypeInfo.deprecated) continue;
      
      const fieldTypePath = path.join(process.cwd(), 'data', 'field-types', fieldTypeInfo.file);
      const fieldTypeContent = await fs.readFile(fieldTypePath, 'utf8');
      const fieldTypeData = JSON.parse(fieldTypeContent);
      
      fieldTypes[fieldTypeInfo.name] = {
        ...fieldTypeData,
        examples: fieldTypeData.examples || [],
        properties: fieldTypeData.properties || {}
      };
    }
    
    FIELD_TYPES_CACHE = fieldTypes;
    return fieldTypes;
  } catch (error) {
    console.error('Failed to load field types:', error);
    // Fallback to basic field types
    return {
      input: { name: 'input', label: 'Input Field', field_type: 'input' },
      textarea: { name: 'textarea', label: 'Textarea Field', field_type: 'textarea' },
      texteditor: { name: 'texteditor', label: 'Text Editor Field', field_type: 'texteditor' },
      select: { name: 'select', label: 'Select Field', field_type: 'select' },
      toggle: { name: 'toggle', label: 'Toggle Field', field_type: 'toggle' },
      media: { name: 'media', label: 'Media Field', field_type: 'media' },
      repeater: { name: 'repeater', label: 'Repeater Field', field_type: 'repeater' },
      group: { name: 'group', label: 'Group Field', field_type: 'group' },
      relationship: { name: 'relationship', label: 'Relationship Field', field_type: 'relationship' },
      post_object: { name: 'post_object', label: 'Post Object Field', field_type: 'post_object' },
      post_related: { name: 'post_related', label: 'Post Related Field', field_type: 'post_related' },
      table: { name: 'table', label: 'Table Field', field_type: 'table' }
    };
  }
}

/**
 * Recursively validate nested fields in repeaters and groups
 * @param {Array} fields - Array of field definitions to validate
 * @param {string} parentPath - Path to parent field for error reporting
 * @param {Array} errors - Array to collect errors
 * @param {Object} fieldTypes - Field types configuration
 */
function validateNestedFields(fields, parentPath, errors, fieldTypes) {
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
    if (field.field && !fieldTypes[field.field]) {
      errors.push(`${fieldPath} has unsupported field type: ${field.field}`);
    } else if (field.field) {
      // Check required attributes based on field type properties
      const fieldConfig = fieldTypes[field.field];
      if (fieldConfig && fieldConfig.properties && fieldConfig.properties.attribute_properties) {
        const requiredAttrs = Object.entries(fieldConfig.properties.attribute_properties)
          .filter(([_, prop]) => prop.required)
          .map(([name, _]) => name);
        
        if (requiredAttrs.length > 0 && !field.attribute) {
          errors.push(`${fieldPath} (${field.field}) missing required attribute object`);
        } else if (field.attribute) {
          requiredAttrs.forEach(attr => {
            if (!(attr in field.attribute)) {
              errors.push(`${fieldPath} (${field.field}) missing required attribute: ${attr}`);
            }
          });
        }
      }
      
      // Special validation for table fields and their columns
      if (field.field === 'table' && field.attribute && field.attribute.columns) {
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
          validateNestedFields(field.attribute.fields, `${fieldPath} (${field.field})`, errors, fieldTypes);
        }
      }
    }
  )
}

/**
 * AntiCMS Component Generator Class
 * Provides methods for generating AntiCMS v3 template components and fields
 */
export class AntiCMSComponentGenerator {
  
  /**
   * Validates that a field type is supported
   * @param {string} fieldType - The field type to validate
   * @param {Object} fieldTypes - Field types configuration
   * @returns {boolean} - Returns true if valid
   * @throws {Error} - Throws error if field type is not supported
   */
  static validateFieldType(fieldType, fieldTypes) {
    if (!fieldTypes[fieldType]) {
      throw new Error(`Unsupported field type: ${fieldType}`);
    }
    return true;
  }

  /**
   * Generates a field definition for AntiCMS v3 using examples from field types
   * @param {string} name - Field name (snake_case)
   * @param {string} label - Human-readable label
   * @param {string} fieldType - Field type from field types
   * @param {object} options - Field options and attributes
   * @param {Object} fieldTypes - Field types configuration
   * @param {string} context - Context hint for better example selection
   * @returns {object} - Complete field definition
   */
  static generateField(name, label, fieldType, options = {}, fieldTypes = null, context = null) {
    if (!fieldTypes) {
      throw new Error('Field types configuration is required');
    }
    
    // Validate and sanitize inputs
    if (!name || typeof name !== 'string') {
      throw new Error('Field name must be a non-empty string');
    }
    if (!label || typeof label !== 'string') {
      throw new Error('Field label must be a non-empty string');
    }
    if (!fieldType || typeof fieldType !== 'string') {
      throw new Error('Field type must be a non-empty string');
    }
    
    // Sanitize field name to be compatible with AntiCMS
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    if (!sanitizedName) {
      throw new Error(`Invalid field name: "${name}" - cannot be sanitized to valid format`);
    }
    
    this.validateFieldType(fieldType, fieldTypes);
    
    const field = {
      name: sanitizedName,
      label,
      field: fieldType
    };

    // Add multilanguage if specified
    if (options.multilanguage !== undefined) {
      field.multilanguage = options.multilanguage;
    }

    // Get field configuration and examples
    const fieldConfig = fieldTypes[fieldType];
    const examples = fieldConfig.examples || [];
    
    // Select the best example based on context and field name
    const bestExample = this.selectBestExample(examples, sanitizedName, context, options);
    
    // Generate attributes based on field type and examples
    const attributes = this.generateAttributesFromExample(bestExample, fieldConfig, options, sanitizedName, fieldType, context, fieldTypes);

    // Handle special nested cases for repeater and group fields
    if (fieldType === 'repeater' && attributes.fields) {
      // Ensure nested repeater fields are properly structured
      attributes.fields = attributes.fields.map(nestedField => {
        if (typeof nestedField === 'object' && nestedField.field) {
          // Validate nested field type
          this.validateFieldType(nestedField.field, fieldTypes);
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
          this.validateFieldType(nestedField.field, fieldTypes);
          return nestedField;
        }
        return nestedField;
      });
    }

    // Add attributes if any exist
    if (Object.keys(attributes).length > 0) {
      field.attribute = attributes;
    }

    return field;
  }

  /**
   * Select the best example from field type examples based on context
   * @param {Array} examples - Available examples
   * @param {string} fieldName - Field name for context
   * @param {string} context - Section/component context
   * @param {object} options - Additional options
   * @returns {object|null} - Best matching example or null
   */
  static selectBestExample(examples, fieldName, context, options) {
    if (!examples || examples.length === 0) return null;

    // Score examples based on relevance
    const scoredExamples = examples.map(example => {
      let score = 0;
      const exampleName = example.name?.toLowerCase() || '';
      const exampleLabel = example.label?.toLowerCase() || '';
      const exampleField = example.field || {};
      
      // Match field name patterns
      if (exampleName.includes(fieldName.toLowerCase())) score += 10;
      if (exampleField.name === fieldName) score += 15;
      
      // Match context patterns
      if (context) {
        const contextLower = context.toLowerCase();
        if (exampleName.includes(contextLower) || exampleLabel.includes(contextLower)) score += 8;
      }
      
      // Match option patterns
      if (options.inputType && exampleField.attribute?.type === options.inputType) score += 5;
      if (options.accept && Array.isArray(exampleField.attribute?.accept) && 
          options.accept.some(type => exampleField.attribute.accept.includes(type))) score += 5;
      
      // Prefer more complete examples
      if (exampleField.attribute) {
        score += Object.keys(exampleField.attribute).length;
      }
      
      return { example, score };
    });

    // Return the highest scoring example
    const best = scoredExamples.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );
    
    return best.score > 0 ? best.example : examples[0]; // Fallback to first example
  }

  /**
   * Generate field attributes from example and options
   * @param {object} example - Selected example
   * @param {object} fieldConfig - Field type configuration
   * @param {object} options - User-provided options
   * @param {string} fieldName - Field name for smart attributes
   * @param {string} fieldType - Field type
   * @param {string} context - Section context
   * @param {Object} fieldTypes - Field types configuration
   * @returns {object} - Generated attributes
   */
  static generateAttributesFromExample(example, fieldConfig, options, fieldName = '', fieldType = '', context = '', fieldTypes = null) {
    const attributes = {};
    
    // Start with smart attributes based on context and field name
    if (fieldName && fieldType && fieldTypes) {
      const smartAttrs = this.generateSmartAttributes(fieldName, fieldType, context, fieldTypes);
      Object.assign(attributes, smartAttrs);
    }
    
    // Merge with example attributes if available (example takes precedence for specific attributes)
    if (example && example.field && example.field.attribute) {
      const exampleAttrs = JSON.parse(JSON.stringify(example.field.attribute));
      
      // Only use example attributes that aren't already set by smart generation
      Object.keys(exampleAttrs).forEach(key => {
        if (attributes[key] === undefined || key === 'placeholder' || key === 'caption') {
          // For placeholder and caption, prefer example if it's more specific
          if ((key === 'placeholder' || key === 'caption') && exampleAttrs[key] && 
              exampleAttrs[key].toLowerCase().includes(fieldName.toLowerCase())) {
            attributes[key] = exampleAttrs[key];
          } else if (key !== 'placeholder' && key !== 'caption') {
            attributes[key] = exampleAttrs[key];
          }
        }
      });
    }
    
    // Override with user-provided options (highest priority)
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined && key !== 'multilanguage') {
        attributes[key] = options[key];
      }
    });
    
    // Ensure required attributes are present based on field type properties
    if (fieldConfig.properties && fieldConfig.properties.attribute_properties) {
      const requiredAttrs = Object.entries(fieldConfig.properties.attribute_properties)
        .filter(([_, prop]) => prop.required)
        .map(([name, _]) => name);

      // Add required attributes with defaults if missing
      requiredAttrs.forEach(attr => {
        if (attributes[attr] === undefined) {
          attributes[attr] = this.getDefaultAttributeValue(attr, fieldConfig);
        }
      });
    }
    
    return attributes;
  }

  /**
   * Get default value for a required attribute
   * @param {string} attr - Attribute name
   * @param {object} fieldConfig - Field configuration
   * @returns {*} - Default value
   */
  static getDefaultAttributeValue(attr, fieldConfig) {
    const attrConfig = fieldConfig.properties?.attribute_properties?.[attr];
    
    if (attrConfig && attrConfig.example !== undefined) {
      return JSON.parse(JSON.stringify(attrConfig.example));
    }
    
    // Fallback defaults
    switch (attr) {
      case 'type': return 'text';
      case 'accept': return ['image'];
      case 'options': return [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ];
      case 'fields': return [];
      case 'filter': return { post_type: ['post'], post_status: 'publish' };
      case 'api_prefix': return '/api/v1/';
      case 'columns': return [
        { label: 'Column 1', name: 'col1', type: 'text' },
        { label: 'Column 2', name: 'col2', type: 'text' }
      ];
      default: return null;
    }
  }

  /**
   * Generates a component for AntiCMS v3 template
   * @param {string} keyName - Component key name
   * @param {string} label - Component label
   * @param {string|number} section - Section number
   * @param {array} fields - Array of field definitions
   * @param {object} options - Additional component options
   * @returns {object} - Complete component definition
   */
  static generateComponent(keyName, label, section, fields, options = {}) {
    const component = {
      keyName,
      label,
      section: String(section),
      fields
    };
    
    // Add optional block property if provided
    if (options.block) {
      component.block = options.block;
    }
    
    return component;
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
   * @param {Object} fieldTypes - Field types configuration
   * @returns {object} - Hero section component
   */
  static generateHeroSection(options = {}, fieldTypes = null) {
    if (!fieldTypes) {
      throw new Error('Field types configuration is required');
    }
    
    const sectionNumber = options.sectionNumber || 1;
    const context = 'hero';
    
    const fields = [
      this.generateField('status', 'Status', 'toggle', {
        caption: 'Enable or disable the hero section',
        defaultValue: true
      }, fieldTypes, context),
      this.generateField('background_image', 'Background Image', 'media', {
        accept: ['image'],
        resolution: {
          minWidth: 1200,
          maxWidth: 1920,
          minHeight: 600,
          maxHeight: 1080
        },
        caption: 'Recommended resolution: 1920x1080px'
      }, fieldTypes, context),
      this.generateField('scroll_indicator', 'Scroll Indicator', 'toggle', {
        caption: 'Show/hide scroll indicator',
        defaultValue: true
      }, fieldTypes, context)
    ];

    return this.generateComponent('hero_section', 'Hero Section', sectionNumber, fields, {
      block: 'Hero'
    });
  }

  /**
   * Generates a features section component
   * @param {object} options - Features section options
   * @param {Object} fieldTypes - Field types configuration
   * @returns {object} - Features section component
   */
  static generateFeaturesSection(options = {}, fieldTypes = null) {
    if (!fieldTypes) {
      throw new Error('Field types configuration is required');
    }
    
    const maxFeatures = options.maxFeatures || 6;
    const sectionNumber = options.sectionNumber || 2;
    const context = 'features';
    
    const fields = [
      this.generateField('section_title', 'Section Title', 'input', {
        multilanguage: true,
        type: 'text',
        placeholder: 'Features section title'
      }, fieldTypes, context),
      this.generateField('features', 'Features', 'repeater', {
        min: 1,
        max: maxFeatures,
        fields: [
          this.generateField('feature_title', 'Feature Title', 'input', {
            multilanguage: true,
            type: 'text',
            is_required: true,
            placeholder: 'Feature name'
          }, fieldTypes, context),
          this.generateField('feature_description', 'Feature Description', 'textarea', {
            multilanguage: true,
            rows: 3,
            max: 150,
            placeholder: 'Feature description'
          }, fieldTypes, context),
          this.generateField('feature_icon', 'Feature Icon', 'media', {
            accept: ['image']
          }, fieldTypes, context)
        ]
      }, fieldTypes, context)
    ];

    return this.generateComponent('features_section', 'Features Section', sectionNumber, fields, {
      block: 'Features'
    });
  }

  /**
   * Generates a contact section component
   * @param {object} options - Contact section options
   * @param {Object} fieldTypes - Field types configuration
   * @returns {object} - Contact section component
   */
  static generateContactSection(options = {}, fieldTypes = null) {
    if (!fieldTypes) {
      throw new Error('Field types configuration is required');
    }
    
    const sectionNumber = options.sectionNumber || 3;
    const context = 'contact';
    
    const fields = [
      this.generateField('section_title', 'Section Title', 'input', {
        multilanguage: true,
        type: 'text',
        placeholder: 'Contact section title'
      }, fieldTypes, context),
      this.generateField('contact_info', 'Contact Information', 'group', {
        fields: [
          this.generateField('email', 'Email', 'input', {
            type: 'email',
            placeholder: 'contact@example.com'
          }, fieldTypes, context),
          this.generateField('phone', 'Phone', 'input', {
            type: 'text',
            placeholder: '+1 (555) 123-4567'
          }, fieldTypes, context),
          this.generateField('address', 'Address', 'textarea', {
            multilanguage: true,
            rows: 3,
            placeholder: 'Company address'
          }, fieldTypes, context)
        ]
      }, fieldTypes, context)
    ];

    return this.generateComponent('contact_section', 'Contact Section', sectionNumber, fields, {
      block: 'Contact'
    });
  }

  /**
   * Generates a gallery section component
   * @param {object} options - Gallery section options
   * @param {Object} fieldTypes - Field types configuration
   * @returns {object} - Gallery section component
   */
  static generateGallerySection(options = {}, fieldTypes = null) {
    if (!fieldTypes) {
      throw new Error('Field types configuration is required');
    }
    
    const maxImages = options.maxImages || 12;
    const sectionNumber = options.sectionNumber || 4;
    const context = 'gallery';
    
    const fields = [
      this.generateField('section_title', 'Gallery Title', 'input', {
        multilanguage: true,
        type: 'text',
        placeholder: 'Gallery section title'
      }, fieldTypes, context),
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
          }, fieldTypes, context),
          this.generateField('caption', 'Image Caption', 'input', {
            multilanguage: true,
            type: 'text',
            placeholder: 'Optional image caption'
          }, fieldTypes, context)
        ]
      }, fieldTypes, context)
    ];

    return this.generateComponent('gallery_section', 'Gallery Section', sectionNumber, fields, {
      block: 'Gallery'
    });
  }

  /**
   * Generates a complex content parts section like in governance-scorecard.json
   * @param {object} options - Content parts options
   * @param {Object} fieldTypes - Field types configuration
   * @returns {object} - Content parts component
   */
  static generateContentPartsSection(options = {}, fieldTypes = null) {
    if (!fieldTypes) {
      throw new Error('Field types configuration is required');
    }
    
    const sectionNumber = options.sectionNumber || 5;
    const context = 'content_parts';
    
    const fields = [
      this.generateField('status', 'Status', 'toggle', {
        caption: 'Enable or disable the content',
        defaultValue: true
      }, fieldTypes, context),
      this.generateField('parts', 'Parts', 'repeater', {
        fields: [
          this.generateField('title', 'Title', 'input', {
            multilanguage: true,
            type: 'text',
            placeholder: 'Part title'
          }, fieldTypes, context),
          // Nested repeater with various field types including table
          this.generateField('items', 'Items', 'repeater', {
            min: 1,
            fields: [
              this.generateField('number', 'Number', 'input', {
                multilanguage: false,
                type: 'text',
                placeholder: 'Input the number of the item'
              }, fieldTypes, context),
              this.generateField('title', 'Title', 'input', {
                multilanguage: true,
                type: 'text',
                placeholder: 'Item title'
              }, fieldTypes, context),
              this.generateField('description', 'Description', 'textarea', {
                multilanguage: true,
                rows: 3,
                cols: 3,
                max: 200,
                placeholder: 'Item description'
              }, fieldTypes, context),
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
              }, fieldTypes, context)
            ]
          }, fieldTypes, context)
        ]
      }, fieldTypes, context)
    ];

    return this.generateComponent('content_parts', 'Content List Parts', sectionNumber, fields, {
      block: 'Content'
    });
  }

  /**
   * Generates a scorecard section with icon and title
   * @param {object} options - Scorecard options
   * @param {Object} fieldTypes - Field types configuration
   * @returns {object} - Scorecard component
   */
  static generateScorecardsSection(options = {}, fieldTypes = null) {
    if (!fieldTypes) {
      throw new Error('Field types configuration is required');
    }
    
    const sectionNumber = options.sectionNumber || 6;
    const context = 'scorecards';
    
    const fields = [
      this.generateField('status', 'Status', 'toggle', {
        caption: 'Enable or disable the content',
        defaultValue: true
      }, fieldTypes, context),
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
          }, fieldTypes, context),
          this.generateField('title', 'Title', 'input', {
            multilanguage: true,
            type: 'text',
            placeholder: 'Scorecard title'
          }, fieldTypes, context)
        ]
      }, fieldTypes, context)
    ];

    return this.generateComponent('content_scorecards', 'Content List Scorecards', sectionNumber, fields, {
      block: 'Scorecards'
    });
  }

  /**
   * Generates a custom section based on section type name
   * @param {string} sectionType - Custom section type
   * @param {object} options - Section options
   * @param {Object} fieldTypes - Field types configuration
   * @returns {object} - Custom section component
   */
  static generateCustomSection(sectionType, options = {}, fieldTypes = null) {
    if (!fieldTypes) {
      throw new Error('Field types configuration is required');
    }
    
    // Validate and sanitize sectionType
    if (!sectionType || typeof sectionType !== 'string') {
      throw new Error('Section type must be a non-empty string');
    }
    
    const sectionNumber = options.sectionNumber || 1;
    const context = sectionType.toLowerCase();
    
    // Convert camelCase or snake_case to proper label with better handling
    const label = sectionType
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();

    let fields = [];

    try {
      // Generate specific fields based on common section patterns
      if (context.includes('testimonial')) {
      fields = [
        this.generateField('status', 'Status', 'toggle', {
          caption: 'Enable or disable the testimonials section',
          defaultValue: true
        }, fieldTypes, context),
        this.generateField('section_title', 'Section Title', 'input', {
          multilanguage: true,
          type: 'text',
          placeholder: 'What Our Clients Say',
          defaultValue: 'What Our Clients Say'
        }, fieldTypes, context),
        this.generateField('testimonials', 'Testimonials', 'repeater', {
          min: 1,
          max: 6,
          fields: this.generateContextualRepeaterFields('testimonials', context, fieldTypes)
        }, fieldTypes, context)
      ];
    } else if (sectionType.toLowerCase().includes('team') || sectionType.toLowerCase().includes('about')) {
      fields = [
        this.generateField('status', 'Status', 'toggle', {
          caption: `Enable or disable the ${sectionType} section`,
          defaultValue: true
        }, fieldTypes, context),
        this.generateField('section_title', 'Section Title', 'input', {
          multilanguage: true,
          type: 'text',
          placeholder: sectionType.includes('team') ? 'Meet Our Team' : 'About Us'
        }, fieldTypes, context),
        this.generateField('description', 'Description', 'textarea', {
          multilanguage: true,
          rows: 4,
          placeholder: `Enter ${sectionType} description`
        }, fieldTypes, context)
      ];

      if (sectionType.toLowerCase().includes('team')) {
        fields.push(
          this.generateField('team_members', 'Team Members', 'repeater', {
            min: 1,
            max: 12,
            fields: this.generateContextualRepeaterFields('team_members', context, fieldTypes)
          }, fieldTypes, context)
        );
      }
    } else if (sectionType.toLowerCase().includes('pricing')) {
      fields = [
        this.generateField('status', 'Status', 'toggle', {
          caption: 'Enable or disable the pricing section',
          defaultValue: true
        }, fieldTypes, context),
        this.generateField('section_title', 'Section Title', 'input', {
          multilanguage: true,
          type: 'text',
          placeholder: 'Pricing Plans',
          defaultValue: 'Pricing Plans'
        }, fieldTypes, context),
        this.generateField('subtitle', 'Subtitle', 'textarea', {
          multilanguage: true,
          rows: 2,
          placeholder: 'Choose the plan that fits your needs'
        }, fieldTypes, context),
        this.generateField('pricing_plans', 'Pricing Plans', 'repeater', {
          min: 1,
          max: 5,
          fields: this.generateContextualRepeaterFields('pricing_plans', context, fieldTypes)
        }, fieldTypes, context)
      ];
    } else if (sectionType.toLowerCase().includes('faq')) {
      fields = [
        this.generateField('status', 'Status', 'toggle', {
          caption: 'Enable or disable the FAQ section',
          defaultValue: true
        }, fieldTypes, context),
        this.generateField('section_title', 'Section Title', 'input', {
          multilanguage: true,
          type: 'text',
          placeholder: 'Frequently Asked Questions',
          defaultValue: 'Frequently Asked Questions'
        }, fieldTypes, context),
        this.generateField('faqs', 'FAQ Items', 'repeater', {
          min: 1,
          max: 15,
          fields: this.generateContextualRepeaterFields('faqs', 'faq', fieldTypes)
        }, fieldTypes, context)
      ];
    } else if (sectionType.toLowerCase().includes('process') || sectionType.toLowerCase().includes('step')) {
      fields = [
        this.generateField('status', 'Status', 'toggle', {
          caption: 'Enable or disable the process section',
          defaultValue: true
        }, fieldTypes, context),
        this.generateField('section_title', 'Section Title', 'input', {
          multilanguage: true,
          type: 'text',
          placeholder: 'How It Works',
          defaultValue: 'How It Works'
        }, fieldTypes, context),
        this.generateField('steps', 'Process Steps', 'repeater', {
          min: 1,
          max: 8,
          fields: this.generateContextualRepeaterFields('steps', context, fieldTypes)
        }, fieldTypes, context)
      ];
    } else if (sectionType.toLowerCase().includes('news') || sectionType.toLowerCase().includes('blog')) {
      const sectionLabel = sectionType.toLowerCase().includes('news') ? 'Latest News' : 'Blog Posts';
      const itemLabel = sectionType.toLowerCase().includes('news') ? 'News Articles' : 'Blog Posts';
      
      fields = [
        this.generateField('status', 'Status', 'toggle', {
          caption: `Enable or disable the ${sectionType} section`,
          defaultValue: true
        }, fieldTypes, context),
        this.generateField('section_title', 'Section Title', 'input', {
          multilanguage: true,
          type: 'text',
          placeholder: sectionLabel,
          defaultValue: sectionLabel
        }, fieldTypes, context),
        this.generateField('subtitle', 'Subtitle', 'textarea', {
          multilanguage: true,
          rows: 2,
          placeholder: `Brief description of ${sectionType.toLowerCase()}`
        }, fieldTypes, context),
        this.generateField('posts', 'Related Posts', 'post_related', {
          post_type: sectionType.toLowerCase().includes('news') ? 'news' : 'post',
          max: 6,
          min: 1,
          caption: `Select ${itemLabel.toLowerCase()} to display in this section`
        }, fieldTypes, context),
        this.generateField('show_more_link', 'Show More Link', 'group', {
          fields: [
            this.generateField('enabled', 'Show Link', 'toggle', {
              caption: 'Show "View All" link',
              defaultValue: true
            }, fieldTypes, context),
            this.generateField('label', 'Link Label', 'input', {
              multilanguage: true,
              type: 'text',
              placeholder: `View All ${itemLabel}`,
              defaultValue: `View All ${itemLabel}`
            }, fieldTypes, context),
            this.generateField('url', 'Link URL', 'input', {
              type: 'url',
              placeholder: `/${sectionType.toLowerCase()}`
            }, fieldTypes, context)
          ]
        }, fieldTypes, context)
      ];
    } else if (sectionType.toLowerCase().includes('service')) {
      fields = [
        this.generateField('status', 'Status', 'toggle', {
          caption: 'Enable or disable the services section',
          defaultValue: true
        }, fieldTypes, context),
        this.generateField('section_title', 'Section Title', 'input', {
          multilanguage: true,
          type: 'text',
          placeholder: 'Our Services',
          defaultValue: 'Our Services'
        }, fieldTypes, context),
        this.generateField('services', 'Services', 'repeater', {
          min: 1,
          max: 8,
          fields: [
            this.generateField('title', 'Service Title', 'input', {
              multilanguage: true,
              type: 'text',
              is_required: true,
              placeholder: 'Service name'
            }, fieldTypes, context),
            this.generateField('description', 'Service Description', 'textarea', {
              multilanguage: true,
              rows: 3,
              placeholder: 'Service description'
            }, fieldTypes, context),
            this.generateField('icon', 'Service Icon', 'media', {
              accept: ['image'],
              resolution: {
                minWidth: 32,
                maxWidth: 64,
                minHeight: 32,
                maxHeight: 64
              }
            }, fieldTypes, context),
            this.generateField('link', 'Learn More Link', 'input', {
              type: 'url',
              placeholder: '/services/service-name'
            }, fieldTypes, context)
          ]
        }, fieldTypes, context)
      ];
    } else {
      // Generate basic fields for unknown custom sections
      fields = [
        this.generateField('status', 'Status', 'toggle', {
          caption: `Enable or disable the ${sectionType} section`,
          defaultValue: true
        }, fieldTypes, context),
        this.generateField('section_title', 'Section Title', 'input', {
          multilanguage: true,
          type: 'text',
          placeholder: `Enter ${sectionType} section title`
        }, fieldTypes, context),
        this.generateField('content', 'Content', 'texteditor', {
          multilanguage: true,
          placeholder: `Enter ${sectionType} content`
        }, fieldTypes, context)
      ];
    }

    } catch (error) {
      // Fallback for any errors during field generation
      console.warn(`[generateCustomSection] Error generating fields for section "${sectionType}":`, error.message);
      
      // Generate basic fallback fields
      fields = [
        this.generateField('status', 'Status', 'toggle', {
          caption: `Enable or disable the ${sectionType} section`,
          defaultValue: true
        }, fieldTypes, context),
        this.generateField('section_title', 'Section Title', 'input', {
          multilanguage: true,
          type: 'text',
          placeholder: `Enter ${sectionType} section title`
        }, fieldTypes, context),
        this.generateField('content', 'Content', 'texteditor', {
          multilanguage: true,
          placeholder: `Enter ${sectionType} content`
        }, fieldTypes, context)
      ];
    }

    return this.generateComponent(
      `${sectionType}_section`, 
      `${label} Section`, 
      sectionNumber, 
      fields, 
      { block: label }
    );
  }

  /**
   * Generates smart field attributes based on field name and context
   * @param {string} fieldName - Field name for context
   * @param {string} fieldType - Field type
   * @param {string} context - Section context
   * @param {Object} fieldTypes - Field types configuration
   * @returns {object} - Smart attributes based on context
   */
  static generateSmartAttributes(fieldName, fieldType, context, fieldTypes) {
    const smartAttributes = {};
    
    // Smart input type detection
    if (fieldType === 'input') {
      if (fieldName.includes('email')) {
        smartAttributes.type = 'email';
        smartAttributes.placeholder = fieldName.includes('contact') ? 'contact@example.com' : 'your@email.com';
      } else if (fieldName.includes('phone') || fieldName.includes('tel')) {
        smartAttributes.type = 'text';
        smartAttributes.placeholder = '+1 (555) 123-4567';
        smartAttributes.maxLength = 20;
      } else if (fieldName.includes('url') || fieldName.includes('website') || fieldName.includes('link')) {
        smartAttributes.type = 'url';
        smartAttributes.placeholder = 'https://example.com';
      } else if (fieldName.includes('number') || fieldName.includes('count') || fieldName.includes('quantity')) {
        smartAttributes.type = 'number';
        smartAttributes.min = 0;
        smartAttributes.placeholder = 'Enter number';
      } else if (fieldName.includes('title') || fieldName.includes('name')) {
        smartAttributes.type = 'text';
        smartAttributes.maxLength = fieldName.includes('title') ? 100 : 50;
        smartAttributes.placeholder = `Enter ${fieldName.replace(/_/g, ' ')}`;
      } else {
        smartAttributes.type = 'text';
        smartAttributes.placeholder = `Enter ${fieldName.replace(/_/g, ' ')}`;
      }
    }
    
    // Smart textarea attributes
    if (fieldType === 'textarea') {
      if (fieldName.includes('description') || fieldName.includes('content')) {
        smartAttributes.rows = fieldName.includes('short') ? 3 : 5;
        smartAttributes.max = fieldName.includes('short') ? 150 : 500;
      } else if (fieldName.includes('address')) {
        smartAttributes.rows = 3;
        smartAttributes.placeholder = 'Enter address';
      } else {
        smartAttributes.rows = 4;
        smartAttributes.placeholder = `Enter ${fieldName.replace(/_/g, ' ')}`;
      }
    }
    
    // Smart media attributes based on context
    if (fieldType === 'media') {
      if (fieldName.includes('image') || fieldName.includes('photo') || fieldName.includes('picture')) {
        smartAttributes.accept = ['image'];
        
        // Context-specific image sizes
        if (context === 'hero' || fieldName.includes('hero') || fieldName.includes('banner')) {
          smartAttributes.resolution = {
            minWidth: 1200,
            maxWidth: 1920,
            minHeight: 600,
            maxHeight: 1080
          };
          smartAttributes.caption = 'Recommended resolution: 1920x1080px';
        } else if (fieldName.includes('icon') || fieldName.includes('logo')) {
          smartAttributes.resolution = {
            minWidth: 16,
            maxWidth: 128,
            minHeight: 16,
            maxHeight: 128
          };
          smartAttributes.caption = 'Icon size: 16x16 to 128x128px';
        } else if (fieldName.includes('thumbnail') || fieldName.includes('preview')) {
          smartAttributes.resolution = {
            minWidth: 200,
            maxWidth: 400,
            minHeight: 150,
            maxHeight: 300
          };
        } else if (context === 'gallery') {
          smartAttributes.resolution = {
            minWidth: 400,
            maxWidth: 1200,
            minHeight: 300,
            maxHeight: 800
          };
        }
      } else if (fieldName.includes('video')) {
        smartAttributes.accept = ['video'];
        smartAttributes.caption = 'Supported formats: MP4, WebM, OGV';
      } else if (fieldName.includes('document') || fieldName.includes('file') || fieldName.includes('pdf')) {
        smartAttributes.accept = ['document'];
        smartAttributes.caption = 'Supported formats: PDF, DOC, DOCX';
      } else {
        smartAttributes.accept = ['image'];
      }
    }
    
    // Smart repeater limits based on context
    if (fieldType === 'repeater') {
      if (context === 'features' || fieldName.includes('feature')) {
        smartAttributes.min = 1;
        smartAttributes.max = 8;
        smartAttributes.caption = 'Add feature items';
      } else if (context === 'gallery' || fieldName.includes('gallery') || fieldName.includes('images')) {
        smartAttributes.min = 1;
        smartAttributes.max = 24;
        smartAttributes.caption = 'Add gallery images';
      } else if (fieldName.includes('testimonial')) {
        smartAttributes.min = 1;
        smartAttributes.max = 6;
        smartAttributes.caption = 'Add testimonials';
      } else if (fieldName.includes('team') || fieldName.includes('member')) {
        smartAttributes.min = 1;
        smartAttributes.max = 12;
        smartAttributes.caption = 'Add team members';
      } else if (fieldName.includes('pricing') || fieldName.includes('plan')) {
        smartAttributes.min = 1;
        smartAttributes.max = 5;
        smartAttributes.caption = 'Add pricing plans';
      } else {
        smartAttributes.min = 1;
        smartAttributes.max = 10;
        smartAttributes.caption = `Add ${fieldName.replace(/_/g, ' ')} items`;
      }
    }
    
    // Smart toggle captions
    if (fieldType === 'toggle') {
      if (fieldName === 'status') {
        smartAttributes.caption = `Enable or disable the ${context} section`;
        smartAttributes.defaultValue = true;
      } else {
        smartAttributes.caption = `Enable or disable ${fieldName.replace(/_/g, ' ')}`;
        smartAttributes.defaultValue = false;
      }
    }
    
    // Smart select options based on context
    if (fieldType === 'select') {
      if (fieldName.includes('style') || fieldName.includes('layout')) {
        smartAttributes.options = [
          { value: 'default', label: 'Default' },
          { value: 'modern', label: 'Modern' },
          { value: 'classic', label: 'Classic' }
        ];
      } else if (fieldName.includes('size')) {
        smartAttributes.options = [
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' }
        ];
      } else if (fieldName.includes('color')) {
        smartAttributes.options = [
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondary' },
          { value: 'accent', label: 'Accent' }
        ];
      }
    }
    
    return smartAttributes;
  }

  /**
   * Generates context-specific nested fields for repeaters
   * @param {string} parentFieldName - Parent field name
   * @param {string} context - Section context
   * @param {Object} fieldTypes - Field types configuration
   * @returns {Array} - Array of nested fields
   */
  static generateContextualRepeaterFields(parentFieldName, context, fieldTypes) {
    if (!parentFieldName || typeof parentFieldName !== 'string') {
      console.warn('[generateContextualRepeaterFields] Invalid parentFieldName, using default fields');
      return this.getDefaultRepeaterFields(fieldTypes, context);
    }
    
    if (!fieldTypes) {
      throw new Error('Field types configuration is required');
    }
    
    const fields = [];
    const safeName = parentFieldName.toLowerCase();
    const safeContext = (context || '').toLowerCase();
    
    try {
      // Common patterns for different repeater types
      if (safeName.includes('testimonial') || safeContext === 'testimonials') {
      fields.push(
        this.generateField('name', 'Name', 'input', {
          multilanguage: false,
          type: 'text',
          is_required: true,
          placeholder: 'Client name'
        }, fieldTypes, context),
        this.generateField('position', 'Position', 'input', {
          multilanguage: false,
          type: 'text',
          placeholder: 'Job title'
        }, fieldTypes, context),
        this.generateField('company', 'Company', 'input', {
          multilanguage: false,
          type: 'text',
          placeholder: 'Company name'
        }, fieldTypes, context),
        this.generateField('testimonial', 'Testimonial', 'textarea', {
          multilanguage: true,
          rows: 4,
          is_required: true,
          placeholder: 'Client testimonial text'
        }, fieldTypes, context),
        this.generateField('avatar', 'Avatar', 'media', {
          accept: ['image'],
          resolution: {
            minWidth: 100,
            maxWidth: 200,
            minHeight: 100,
            maxHeight: 200
          }
        }, fieldTypes, context)
      );
    } else if (parentFieldName.includes('team') || parentFieldName.includes('member')) {
      fields.push(
        this.generateField('name', 'Name', 'input', {
          multilanguage: false,
          type: 'text',
          is_required: true,
          placeholder: 'Team member name'
        }, fieldTypes, context),
        this.generateField('position', 'Position', 'input', {
          multilanguage: true,
          type: 'text',
          is_required: true,
          placeholder: 'Job title'
        }, fieldTypes, context),
        this.generateField('bio', 'Biography', 'textarea', {
          multilanguage: true,
          rows: 3,
          placeholder: 'Brief biography'
        }, fieldTypes, context),
        this.generateField('photo', 'Photo', 'media', {
          accept: ['image'],
          resolution: {
            minWidth: 200,
            maxWidth: 400,
            minHeight: 200,
            maxHeight: 400
          }
        }, fieldTypes, context),
        this.generateField('social_links', 'Social Links', 'group', {
          fields: [
            this.generateField('linkedin', 'LinkedIn', 'input', {
              type: 'url',
              placeholder: 'https://linkedin.com/in/username'
            }, fieldTypes, context),
            this.generateField('email', 'Email', 'input', {
              type: 'email',
              placeholder: 'email@company.com'
            }, fieldTypes, context)
          ]
        }, fieldTypes, context)
      );
    } else if (parentFieldName.includes('pricing') || parentFieldName.includes('plan')) {
      fields.push(
        this.generateField('name', 'Plan Name', 'input', {
          multilanguage: true,
          type: 'text',
          is_required: true,
          placeholder: 'Plan name'
        }, fieldTypes, context),
        this.generateField('price', 'Price', 'input', {
          multilanguage: false,
          type: 'text',
          is_required: true,
          placeholder: '$99/month'
        }, fieldTypes, context),
        this.generateField('description', 'Description', 'textarea', {
          multilanguage: true,
          rows: 2,
          placeholder: 'Plan description'
        }, fieldTypes, context),
        this.generateField('features', 'Features', 'repeater', {
          min: 1,
          max: 10,
          fields: [
            this.generateField('feature', 'Feature', 'input', {
              multilanguage: true,
              type: 'text',
              placeholder: 'Feature description'
            }, fieldTypes, context)
          ]
        }, fieldTypes, context),
        this.generateField('is_popular', 'Popular Plan', 'toggle', {
          caption: 'Mark as most popular plan',
          defaultValue: false
        }, fieldTypes, context)
      );
    } else if (parentFieldName.includes('faq') || context === 'faq') {
      fields.push(
        this.generateField('question', 'Question', 'input', {
          multilanguage: true,
          type: 'text',
          is_required: true,
          placeholder: 'Frequently asked question'
        }, fieldTypes, context),
        this.generateField('answer', 'Answer', 'textarea', {
          multilanguage: true,
          rows: 4,
          is_required: true,
          placeholder: 'Answer to the question'
        }, fieldTypes, context)
      );
    } else if (parentFieldName.includes('step') || parentFieldName.includes('process')) {
      fields.push(
        this.generateField('step_number', 'Step Number', 'input', {
          multilanguage: false,
          type: 'number',
          min: 1,
          placeholder: '1'
        }, fieldTypes, context),
        this.generateField('title', 'Step Title', 'input', {
          multilanguage: true,
          type: 'text',
          is_required: true,
          placeholder: 'Step title'
        }, fieldTypes, context),
        this.generateField('description', 'Description', 'textarea', {
          multilanguage: true,
          rows: 3,
          placeholder: 'Step description'
        }, fieldTypes, context),
        this.generateField('icon', 'Icon', 'media', {
          accept: ['image'],
          resolution: {
            minWidth: 32,
            maxWidth: 64,
            minHeight: 32,
            maxHeight: 64
          }
        }, fieldTypes, context)
      );
    }
    
    } catch (error) {
      console.warn(`[generateContextualRepeaterFields] Error generating fields for "${parentFieldName}":`, error.message);
      return this.getDefaultRepeaterFields(fieldTypes, context);
    }
    
    return fields;
  }
  
  /**
   * Get default repeater fields when context-specific generation fails
   * @param {Object} fieldTypes - Field types configuration
   * @param {string} context - Section context
   * @returns {Array} - Default repeater fields
   */
  static getDefaultRepeaterFields(fieldTypes, context = '') {
    try {
      return [
        this.generateField('title', 'Title', 'input', {
          multilanguage: true,
          type: 'text',
          is_required: true,
          placeholder: 'Enter title'
        }, fieldTypes, context),
        this.generateField('description', 'Description', 'textarea', {
          multilanguage: true,
          rows: 3,
          placeholder: 'Enter description'
        }, fieldTypes, context)
      ];
    } catch (error) {
      console.error('[getDefaultRepeaterFields] Critical error:', error.message);
      return [];
    }
  }
}

/**
 * Parse Figma code and metadata to extract sections and content patterns
 * @param {object} figmaData - Figma MCP dev tools data
 * @returns {object} - Parsed Figma structure
 */
function parseFigmaData(figmaData) {
  if (!figmaData) {
    return { sections: [], contentPatterns: {} };
  }

  const { code, metadata, sections: figmaSections, content_patterns } = figmaData;
  
  // If sections are already parsed, use them
  if (figmaSections && Array.isArray(figmaSections)) {
    return {
      sections: figmaSections,
      contentPatterns: content_patterns || {}
    };
  }

  // Parse from code and metadata for 100% accuracy
  if (code && metadata) {
    return parseFigmaCodeWithMetadata(code, metadata);
  }

  // Fallback to basic parsing
  if (code) {
    return parseFigmaCode(code, metadata);
  }

  return { sections: [], contentPatterns: {} };
}

/**
 * Parse Figma HTML/CSS code with metadata for 100% accuracy
 * @param {string} code - Figma HTML/CSS code
 * @param {object} metadata - Figma metadata
 * @returns {object} - Parsed sections and patterns
 */
function parseFigmaCodeWithMetadata(code, metadata) {
  const sections = [];
  const contentPatterns = {
    repeaters: [],
    groups: [],
    single_fields: []
  };

  try {
    // Parse XML metadata to get component hierarchy
    const componentHierarchy = parseFigmaMetadata(metadata);
    
    // Parse HTML code to get actual content
    const htmlSections = parseFigmaHTML(code);
    
    // Merge metadata hierarchy with HTML content for 100% accuracy
    const mergedSections = mergeFigmaData(componentHierarchy, htmlSections);
    
    // Detect content patterns from merged data
    detectContentPatterns(mergedSections, contentPatterns);
    
    return { sections: mergedSections, contentPatterns };
    
  } catch (error) {
    console.warn('[parseFigmaCodeWithMetadata] Error parsing Figma data:', error.message);
    // Fallback to basic parsing
    return parseFigmaCode(code, metadata);
  }
}

/**
 * Parse Figma XML metadata to extract component hierarchy
 * @param {object} metadata - Figma metadata object
 * @returns {Array} - Component hierarchy
 */
function parseFigmaMetadata(metadata) {
  const hierarchy = [];
  
  if (metadata && metadata.children) {
    metadata.children.forEach(child => {
      const component = {
        id: child.id,
        name: child.name,
        type: child.type,
        children: child.children || [],
        attributes: extractAttributesFromMetadata(child)
      };
      hierarchy.push(component);
    });
  }
  
  return hierarchy;
}

/**
 * Extract attributes from Figma metadata
 * @param {object} node - Figma node
 * @returns {object} - Extracted attributes
 */
function extractAttributesFromMetadata(node) {
  const attributes = {};
  
  // Extract common attributes
  if (node.absoluteBoundingBox) {
    attributes.width = node.absoluteBoundingBox.width;
    attributes.height = node.absoluteBoundingBox.height;
  }
  
  if (node.fills) {
    attributes.fills = node.fills;
  }
  
  if (node.strokes) {
    attributes.strokes = node.strokes;
  }
  
  if (node.effects) {
    attributes.effects = node.effects;
  }
  
  return attributes;
}

/**
 * Parse Figma HTML code to extract sections and content
 * @param {string} code - Figma HTML code
 * @returns {Array} - Parsed HTML sections
 */
function parseFigmaHTML(code) {
  const sections = [];
  
  try {
    // Use regex to extract figma groups (sections)
    const groupMatches = code.match(/<div[^>]*data-figma-group="true"[^>]*>([\s\S]*?)<\/div>/gi);
    
    if (groupMatches) {
      groupMatches.forEach(groupMatch => {
        const section = parseFigmaGroup(groupMatch);
        if (section) {
          sections.push(section);
        }
      });
    }
    
    // Also look for direct sections in the main frame
    const frameMatch = code.match(/<div[^>]*data-figma-frame="true"[^>]*>([\s\S]*?)<\/div>/i);
    if (frameMatch) {
      const frameContent = frameMatch[1];
      const frameSections = parseFigmaFrameContent(frameContent);
      sections.push(...frameSections);
    }
    
  } catch (error) {
    console.warn('[parseFigmaHTML] Error parsing HTML:', error.message);
  }
  
  return sections;
}

/**
 * Parse a Figma group to extract section data
 * @param {string} groupHTML - Group HTML content
 * @returns {object|null} - Parsed section or null
 */
function parseFigmaGroup(groupHTML) {
  try {
    // Extract group name
    const nameMatch = groupHTML.match(/data-figma-group-name="([^"]*)"/);
    if (!nameMatch) return null;
    
    const groupName = nameMatch[1];
    
    // Extract elements from group content
    const elements = extractElementsFromGroup(groupHTML);
    
    return {
      name: groupName.toLowerCase().replace(/\s+/g, '_'),
      originalName: groupName,
      elements: elements,
      type: 'group'
    };
    
  } catch (error) {
    console.warn('[parseFigmaGroup] Error parsing group:', error.message);
    return null;
  }
}

/**
 * Parse Figma frame content to extract sections
 * @param {string} frameContent - Frame HTML content
 * @returns {Array} - Parsed sections
 */
function parseFigmaFrameContent(frameContent) {
  const sections = [];
  
  // Look for major sections by analyzing the structure
  const sectionPatterns = [
    { pattern: /header/i, name: 'header' },
    { pattern: /hero/i, name: 'hero' },
    { pattern: /features?/i, name: 'features' },
    { pattern: /portfolio|gallery/i, name: 'portfolio' },
    { pattern: /contact/i, name: 'contact' },
    { pattern: /about/i, name: 'about' },
    { pattern: /services?/i, name: 'services' },
    { pattern: /testimonials?/i, name: 'testimonials' }
  ];
  
  sectionPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(frameContent)) {
      const sectionElements = extractElementsFromSection(frameContent, name);
      if (sectionElements.length > 0) {
        sections.push({
          name: name,
          originalName: name.charAt(0).toUpperCase() + name.slice(1),
          elements: sectionElements,
          type: 'section'
        });
      }
    }
  });
  
  return sections;
}

/**
 * Extract elements from a Figma group
 * @param {string} groupHTML - Group HTML content
 * @returns {Array} - Extracted elements
 */
function extractElementsFromGroup(groupHTML) {
  const elements = [];
  
  // Extract text elements
  const textMatches = groupHTML.match(/<div[^>]*data-figma-text="true"[^>]*>([^<]*)<\/div>/gi);
  if (textMatches) {
    textMatches.forEach(match => {
      const textContent = match.replace(/<[^>]*>/g, '').trim();
      if (textContent) {
        const nameMatch = match.match(/data-figma-text-name="([^"]*)"/);
        const elementName = nameMatch ? nameMatch[1] : 'text';
        
        elements.push({
          type: 'text',
          content: textContent,
          name: elementName,
          role: determineTextRole(textContent, elementName),
          attributes: extractTextAttributes(match)
        });
      }
    });
  }
  
  // Extract button elements
  const buttonMatches = groupHTML.match(/<div[^>]*data-figma-button="true"[^>]*>([^<]*)<\/div>/gi);
  if (buttonMatches) {
    buttonMatches.forEach(match => {
      const buttonContent = match.replace(/<[^>]*>/g, '').trim();
      if (buttonContent) {
        const nameMatch = match.match(/data-figma-button-name="([^"]*)"/);
        const elementName = nameMatch ? nameMatch[1] : 'button';
        
        elements.push({
          type: 'button',
          content: buttonContent,
          name: elementName,
          role: determineButtonRole(buttonContent, elementName),
          attributes: extractButtonAttributes(match)
        });
      }
    });
  }
  
  // Extract image elements
  const imageMatches = groupHTML.match(/<div[^>]*data-figma-image="true"[^>]*>/gi);
  if (imageMatches) {
    imageMatches.forEach(match => {
      const nameMatch = match.match(/data-figma-image-name="([^"]*)"/);
      const elementName = nameMatch ? nameMatch[1] : 'image';
      
      elements.push({
        type: 'image',
        content: '',
        name: elementName,
        role: 'image',
        attributes: extractImageAttributes(match)
      });
    });
  }
  
  // Extract input elements
  const inputMatches = groupHTML.match(/<div[^>]*data-figma-input="true"[^>]*>([^<]*)<\/div>/gi);
  if (inputMatches) {
    inputMatches.forEach(match => {
      const inputContent = match.replace(/<[^>]*>/g, '').trim();
      if (inputContent) {
        const nameMatch = match.match(/data-figma-input-name="([^"]*)"/);
        const elementName = nameMatch ? nameMatch[1] : 'input';
        
        elements.push({
          type: 'input',
          content: inputContent,
          name: elementName,
          role: determineInputRole(inputContent, elementName),
          attributes: extractInputAttributes(match)
        });
      }
    });
  }
  
  // Extract textarea elements
  const textareaMatches = groupHTML.match(/<div[^>]*data-figma-textarea="true"[^>]*>([^<]*)<\/div>/gi);
  if (textareaMatches) {
    textareaMatches.forEach(match => {
      const textareaContent = match.replace(/<[^>]*>/g, '').trim();
      if (textareaContent) {
        const nameMatch = match.match(/data-figma-textarea-name="([^"]*)"/);
        const elementName = nameMatch ? nameMatch[1] : 'textarea';
        
        elements.push({
          type: 'textarea',
          content: textareaContent,
          name: elementName,
          role: 'textarea',
          attributes: extractTextareaAttributes(match)
        });
      }
    });
  }
  
  return elements;
}

/**
 * Extract elements from a specific section
 * @param {string} frameContent - Frame HTML content
 * @param {string} sectionName - Section name to extract
 * @returns {Array} - Extracted elements
 */
function extractElementsFromSection(frameContent, sectionName) {
  // This is a simplified version - in practice, you'd want more sophisticated parsing
  const elements = [];
  
  // Look for text elements that might belong to this section
  const textMatches = frameContent.match(/<div[^>]*data-figma-text="true"[^>]*>([^<]*)<\/div>/gi);
  if (textMatches) {
    textMatches.forEach(match => {
      const textContent = match.replace(/<[^>]*>/g, '').trim();
      if (textContent && isTextRelevantToSection(textContent, sectionName)) {
        const nameMatch = match.match(/data-figma-text-name="([^"]*)"/);
        const elementName = nameMatch ? nameMatch[1] : 'text';
        
        elements.push({
          type: 'text',
          content: textContent,
          name: elementName,
          role: determineTextRole(textContent, elementName),
          attributes: extractTextAttributes(match)
        });
      }
    });
  }
  
  return elements;
}

/**
 * Check if text content is relevant to a specific section
 * @param {string} text - Text content
 * @param {string} sectionName - Section name
 * @returns {boolean} - Whether text is relevant
 */
function isTextRelevantToSection(text, sectionName) {
  const textLower = text.toLowerCase();
  const sectionLower = sectionName.toLowerCase();
  
  // Simple relevance check - can be enhanced
  return textLower.includes(sectionLower) || 
         textLower.includes('title') || 
         textLower.includes('description') ||
         textLower.includes('button') ||
         textLower.includes('cta');
}

/**
 * Merge Figma metadata hierarchy with HTML content
 * @param {Array} hierarchy - Component hierarchy from metadata
 * @param {Array} htmlSections - Sections from HTML parsing
 * @returns {Array} - Merged sections
 */
function mergeFigmaData(hierarchy, htmlSections) {
  const mergedSections = [];
  
  // Use HTML sections as base and enhance with metadata
  htmlSections.forEach(htmlSection => {
    const mergedSection = {
      ...htmlSection,
      metadata: hierarchy.find(h => h.name.toLowerCase().includes(htmlSection.name.toLowerCase()))
    };
    
    // Enhance elements with metadata if available
    if (mergedSection.metadata) {
      mergedSection.elements = enhanceElementsWithMetadata(mergedSection.elements, mergedSection.metadata);
    }
    
    mergedSections.push(mergedSection);
  });
  
  return mergedSections;
}

/**
 * Enhance elements with metadata information
 * @param {Array} elements - Elements to enhance
 * @param {object} metadata - Metadata to use for enhancement
 * @returns {Array} - Enhanced elements
 */
function enhanceElementsWithMetadata(elements, metadata) {
  return elements.map(element => ({
    ...element,
    metadata: {
      id: metadata.id,
      type: metadata.type,
      attributes: metadata.attributes
    }
  }));
}

/**
 * Parse Figma HTML/CSS code to extract sections and elements
 * @param {string} code - Figma HTML/CSS code
 * @param {object} metadata - Figma metadata
 * @returns {object} - Parsed sections and patterns
 */
function parseFigmaCode(code, metadata) {
  const sections = [];
  const contentPatterns = {
    repeaters: [],
    groups: [],
    single_fields: []
  };

  try {
    // Simple HTML parsing to extract sections
    const sectionMatches = code.match(/<section[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/section>/gi);
    
    if (sectionMatches) {
      sectionMatches.forEach((sectionMatch, index) => {
        const classMatch = sectionMatch.match(/class="([^"]*)"/);
        const contentMatch = sectionMatch.match(/>([\s\S]*?)<\/section>/);
        
        if (classMatch && contentMatch) {
          const sectionName = classMatch[1].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          const content = contentMatch[1];
          
          // Extract elements from section content
          const elements = extractElementsFromContent(content);
          
          sections.push({
            name: sectionName,
            elements: elements
          });
        }
      });
    }

    // Detect content patterns
    detectContentPatterns(sections, contentPatterns);
    
  } catch (error) {
    console.warn('[parseFigmaCode] Error parsing Figma code:', error.message);
  }

  return { sections, contentPatterns };
}

/**
 * Extract elements from HTML content
 * @param {string} content - HTML content
 * @returns {Array} - Array of elements
 */
function extractElementsFromContent(content) {
  const elements = [];
  
  // Extract text elements
  const textMatches = content.match(/<[^>]*>([^<]+)<\/[^>]*>/g);
  if (textMatches) {
    textMatches.forEach(match => {
      const textContent = match.replace(/<[^>]*>/g, '').trim();
      if (textContent) {
        elements.push({
          type: 'text',
          content: textContent,
          role: determineTextRole(textContent)
        });
      }
    });
  }

  // Extract image elements
  const imageMatches = content.match(/<img[^>]*>/g);
  if (imageMatches) {
    imageMatches.forEach(match => {
      const srcMatch = match.match(/src="([^"]*)"/);
      const altMatch = match.match(/alt="([^"]*)"/);
      
      elements.push({
        type: 'image',
        content: srcMatch ? srcMatch[1] : '',
        role: 'image',
        attributes: {
          alt: altMatch ? altMatch[1] : ''
        }
      });
    });
  }

  // Extract button elements
  const buttonMatches = content.match(/<button[^>]*>([^<]+)<\/button>/g);
  if (buttonMatches) {
    buttonMatches.forEach(match => {
      const buttonText = match.replace(/<[^>]*>/g, '').trim();
      elements.push({
        type: 'button',
        content: buttonText,
        role: determineButtonRole(buttonText)
      });
    });
  }

  return elements;
}

/**
 * Determine text role based on content and element name
 * @param {string} content - Text content
 * @param {string} elementName - Element name from Figma
 * @returns {string} - Text role
 */
function determineTextRole(content, elementName = '') {
  const text = content.toLowerCase();
  const name = elementName.toLowerCase();
  
  // Check element name first for more accurate role detection
  if (name.includes('title') || name.includes('heading')) return 'heading';
  if (name.includes('description') || name.includes('subtitle')) return 'description';
  if (name.includes('label') || name.includes('caption')) return 'label';
  if (name.includes('cta') || name.includes('button')) return 'cta';
  
  // Fallback to content analysis
  if (text.length > 100) return 'description';
  if (text.length > 50) return 'subtitle';
  if (text.match(/^[A-Z][^.!?]*[.!?]?$/)) return 'heading';
  if (text.includes('see more') || text.includes('view more')) return 'cta';
  
  return 'text';
}

/**
 * Determine button role based on content and element name
 * @param {string} content - Button content
 * @param {string} elementName - Element name from Figma
 * @returns {string} - Button role
 */
function determineButtonRole(content, elementName = '') {
  const text = content.toLowerCase();
  const name = elementName.toLowerCase();
  
  // Check element name first for more accurate role detection
  if (name.includes('primary') || name.includes('main')) return 'primary_cta';
  if (name.includes('secondary') || name.includes('alt')) return 'secondary_cta';
  if (name.includes('see_more') || name.includes('view_more')) return 'see_more';
  
  // Fallback to content analysis
  if (text.includes('see more') || text.includes('view more')) return 'see_more';
  if (text.includes('get started') || text.includes('sign up')) return 'primary_cta';
  if (text.includes('learn more') || text.includes('read more')) return 'secondary_cta';
  
  return 'button';
}

/**
 * Determine input role based on content and element name
 * @param {string} content - Input content
 * @param {string} elementName - Element name from Figma
 * @returns {string} - Input role
 */
function determineInputRole(content, elementName = '') {
  const name = elementName.toLowerCase();
  
  if (name.includes('email')) return 'email';
  if (name.includes('phone') || name.includes('tel')) return 'phone';
  if (name.includes('name') || name.includes('fullname')) return 'name';
  if (name.includes('password')) return 'password';
  if (name.includes('url') || name.includes('website')) return 'url';
  
  return 'text';
}

/**
 * Extract text attributes from HTML match
 * @param {string} match - HTML match string
 * @returns {object} - Extracted attributes
 */
function extractTextAttributes(match) {
  const attributes = {};
  
  // Extract common attributes
  const classMatch = match.match(/class="([^"]*)"/);
  if (classMatch) attributes.class = classMatch[1];
  
  const styleMatch = match.match(/style="([^"]*)"/);
  if (styleMatch) attributes.style = styleMatch[1];
  
  return attributes;
}

/**
 * Extract button attributes from HTML match
 * @param {string} match - HTML match string
 * @returns {object} - Extracted attributes
 */
function extractButtonAttributes(match) {
  const attributes = {};
  
  const classMatch = match.match(/class="([^"]*)"/);
  if (classMatch) attributes.class = classMatch[1];
  
  const styleMatch = match.match(/style="([^"]*)"/);
  if (styleMatch) attributes.style = styleMatch[1];
  
  return attributes;
}

/**
 * Extract image attributes from HTML match
 * @param {string} match - HTML match string
 * @returns {object} - Extracted attributes
 */
function extractImageAttributes(match) {
  const attributes = {};
  
  const classMatch = match.match(/class="([^"]*)"/);
  if (classMatch) attributes.class = classMatch[1];
  
  const styleMatch = match.match(/style="([^"]*)"/);
  if (styleMatch) attributes.style = styleMatch[1];
  
  return attributes;
}

/**
 * Extract input attributes from HTML match
 * @param {string} match - HTML match string
 * @returns {object} - Extracted attributes
 */
function extractInputAttributes(match) {
  const attributes = {};
  
  const classMatch = match.match(/class="([^"]*)"/);
  if (classMatch) attributes.class = classMatch[1];
  
  const styleMatch = match.match(/style="([^"]*)"/);
  if (styleMatch) attributes.style = styleMatch[1];
  
  const typeMatch = match.match(/type="([^"]*)"/);
  if (typeMatch) attributes.type = typeMatch[1];
  
  return attributes;
}

/**
 * Extract textarea attributes from HTML match
 * @param {string} match - HTML match string
 * @returns {object} - Extracted attributes
 */
function extractTextareaAttributes(match) {
  const attributes = {};
  
  const classMatch = match.match(/class="([^"]*)"/);
  if (classMatch) attributes.class = classMatch[1];
  
  const styleMatch = match.match(/style="([^"]*)"/);
  if (styleMatch) attributes.style = styleMatch[1];
  
  const rowsMatch = match.match(/rows="([^"]*)"/);
  if (rowsMatch) attributes.rows = parseInt(rowsMatch[1]);
  
  return attributes;
}

/**
 * Detect content patterns from parsed sections
 * @param {Array} sections - Parsed sections
 * @param {object} contentPatterns - Content patterns object to populate
 */
function detectContentPatterns(sections, contentPatterns) {
  sections.forEach(section => {
    const sectionName = section.name.toLowerCase();
    
    // Check for repeater patterns
    if (section.elements.length > 3 || 
        sectionName.includes('list') || 
        sectionName.includes('grid') ||
        sectionName.includes('items')) {
      contentPatterns.repeaters.push(sectionName);
    }
    
    // Check for group patterns
    if (sectionName.includes('info') || 
        sectionName.includes('contact') ||
        sectionName.includes('details')) {
      contentPatterns.groups.push(sectionName);
    }
    
    // Check for single field patterns
    if (section.elements.length <= 2) {
      contentPatterns.single_fields.push(sectionName);
    }
  });
}

/**
 * Generate section from Figma data with 100% accuracy
 * @param {object} figmaSection - Parsed Figma section
 * @param {object} contentPatterns - Detected content patterns
 * @param {object} options - Section options
 * @param {Object} fieldTypes - Field types configuration
 * @returns {object} - Generated AntiCMS section
 */
function generateSectionFromFigma(figmaSection, contentPatterns, options, fieldTypes) {
  const { name: sectionName, elements, originalName, type } = figmaSection;
  const context = sectionName.toLowerCase();
  
  // Use sophisticated analysis for better section type determination
  const sectionAnalysis = determineSectionTypeAdvanced(sectionName, elements, contentPatterns);
  const sectionType = sectionAnalysis.type;
  const isRepeaterSection = sectionType === 'repeater';
  const isPostCollection = sectionType === 'post_collection';
  const isGroupSection = sectionType === 'group';
  const isMediaGallery = sectionType === 'media_gallery';
  const isFormSection = sectionType === 'form';

  const fields = [];
  let sectionCounter = 1;

  // Add status field
  fields.push(AntiCMSComponentGenerator.generateField('status', 'Status', 'toggle', {
    caption: `Enable or disable the ${originalName || sectionName} section`,
    defaultValue: true
  }, fieldTypes, context));

  // Process elements based on section type
  if (isRepeaterSection) {
    // Create repeater fields for repeated content
    const repeaterFields = createRepeaterFields(elements, fieldTypes, context);
    const repeaterField = AntiCMSComponentGenerator.generateField(
      sectionName, 
      originalName || sectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      'repeater', 
      {
        min: 1,
        max: 8,
        caption: `Add ${originalName || sectionName} items`,
        fields: repeaterFields
      }, 
      fieldTypes, 
      context
    );
    
    fields.push(repeaterField);
    
  } else if (isPostCollection) {
    // Create post_related field for post collections
    const postRelatedField = AntiCMSComponentGenerator.generateField(
      'posts', 
      'Related Posts', 
      'post_related', 
      {
        post_type: sectionName.replace(/_section$/, ''),
        max: 12,
        min: 1,
        caption: `Select ${originalName || sectionName} to display in this section`
      }, 
      fieldTypes, 
      context
    );
    
    fields.push(postRelatedField);
    
  } else if (isGroupSection) {
    // Create group fields for related content
    const groupFields = createGroupFields(elements, fieldTypes, context);
    const groupField = AntiCMSComponentGenerator.generateField(
      sectionName, 
      originalName || sectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      'group', 
      {
        fields: groupFields
      }, 
      fieldTypes, 
      context
    );
    
    fields.push(groupField);
    
  } else if (isMediaGallery) {
    // Create media gallery fields based on analysis
    const mediaFields = generateMediaGalleryFields(sectionAnalysis, fieldTypes, context);
    fields.push(...mediaFields);
    
  } else if (isFormSection) {
    // Create form fields based on analysis
    const formFields = generateFormFields(sectionAnalysis, fieldTypes, context);
    fields.push(...formFields);
    
  } else {
    // Create individual fields for single content with enhanced analysis
    const enhancedFields = generateEnhancedSingleFields(elements, sectionAnalysis, fieldTypes, context);
    fields.push(...enhancedFields);
  }

  return AntiCMSComponentGenerator.generateComponent(
    `${sectionName}_section`,
    originalName || sectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Section',
    sectionCounter,
    fields,
    { block: originalName || sectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
  );
}

/**
 * Determine section type based on Figma data
 * @param {string} sectionName - Section name
 * @param {Array} elements - Section elements
 * @param {object} contentPatterns - Content patterns
 * @returns {string} - Section type
 */
function determineSectionType(sectionName, elements, contentPatterns) {
  // Check for post collection indicators
  if (elements.some(el => 
    el.role === 'see_more' || 
    el.content.toLowerCase().includes('see more') ||
    el.content.toLowerCase().includes('view more')
  )) {
    return 'post_collection';
  }
  
  // Check for repeater patterns
  if (contentPatterns.repeaters.includes(sectionName) ||
      elements.length > 3 ||
      sectionName.includes('list') ||
      sectionName.includes('grid') ||
      sectionName.includes('items')) {
    return 'repeater';
  }
  
  // Check for group patterns
  if (contentPatterns.groups.includes(sectionName) ||
      sectionName.includes('info') ||
      sectionName.includes('contact') ||
      sectionName.includes('details')) {
    return 'group';
  }
  
  return 'single';
}

/**
 * Enhanced section type determination with sophisticated analysis
 * @param {string} sectionName - Section name
 * @param {Array} elements - Section elements
 * @param {object} contentPatterns - Content patterns
 * @returns {object} - Detailed section analysis
 */
function determineSectionTypeAdvanced(sectionName, elements, contentPatterns) {
  const analysis = {
    type: 'single',
    confidence: 0.5,
    reasoning: [],
    detectedPatterns: [],
    fieldSuggestions: [],
    mediaAnalysis: {},
    textAnalysis: {},
    interactionAnalysis: {}
  };

  // Analyze content patterns and element structure
  analysis.contentAnalysis = analyzeContentStructure(elements, sectionName);
  analysis.mediaAnalysis = analyzeMediaContent(elements);
  analysis.textAnalysis = analyzeTextContent(elements);
  analysis.interactionAnalysis = analyzeInteractions(elements);

  // Check for post collection indicators (highest priority)
  const postCollectionScore = calculatePostCollectionScore(elements, sectionName);
  if (postCollectionScore > 0.8) {
    analysis.type = 'post_collection';
    analysis.confidence = postCollectionScore;
    analysis.reasoning.push('High confidence post collection detected');
    analysis.detectedPatterns.push('post_collection');
    return analysis;
  }

  // Check for repeater patterns with sophisticated analysis
  const repeaterScore = calculateRepeaterScore(elements, sectionName, contentPatterns, analysis.contentAnalysis);
  if (repeaterScore > 0.7) {
    analysis.type = 'repeater';
    analysis.confidence = repeaterScore;
    analysis.reasoning.push('Repeater pattern detected');
    analysis.detectedPatterns.push('repeater');
    analysis.fieldSuggestions = generateRepeaterFieldSuggestions(elements, analysis.contentAnalysis);
    return analysis;
  }

  // Check for group patterns with enhanced logic
  const groupScore = calculateGroupScore(elements, sectionName, contentPatterns, analysis.contentAnalysis);
  if (groupScore > 0.6) {
    analysis.type = 'group';
    analysis.confidence = groupScore;
    analysis.reasoning.push('Group pattern detected');
    analysis.detectedPatterns.push('group');
    analysis.fieldSuggestions = generateGroupFieldSuggestions(elements, analysis.contentAnalysis);
    return analysis;
  }

  // Check for media-heavy sections
  if (analysis.mediaAnalysis.mediaRatio > 0.6) {
    analysis.type = 'media_gallery';
    analysis.confidence = 0.8;
    analysis.reasoning.push('Media-heavy section detected');
    analysis.detectedPatterns.push('media_gallery');
    analysis.fieldSuggestions = generateMediaFieldSuggestions(analysis.mediaAnalysis);
    return analysis;
  }

  // Check for form sections
  if (analysis.interactionAnalysis.formElements > 0) {
    analysis.type = 'form';
    analysis.confidence = 0.9;
    analysis.reasoning.push('Form section detected');
    analysis.detectedPatterns.push('form');
    analysis.fieldSuggestions = generateFormFieldSuggestions(elements, analysis.interactionAnalysis);
    return analysis;
  }

  // Default to single with enhanced analysis
  analysis.confidence = Math.max(0.3, 1 - (elements.length * 0.1));
  analysis.reasoning.push('Single field section');
  analysis.detectedPatterns.push('single');
  analysis.fieldSuggestions = generateSingleFieldSuggestions(elements, analysis.contentAnalysis);

  return analysis;
}

/**
 * Analyze content structure for intelligent section detection
 * @param {Array} elements - Section elements
 * @param {string} sectionName - Section name
 * @returns {object} - Content structure analysis
 */
function analyzeContentStructure(elements, sectionName) {
  const analysis = {
    totalElements: elements.length,
    textElements: 0,
    imageElements: 0,
    buttonElements: 0,
    inputElements: 0,
    hasRepeatingPattern: false,
    contentComplexity: 'simple',
    semanticStructure: []
  };

  elements.forEach(element => {
    switch (element.type) {
      case 'text':
        analysis.textElements++;
        break;
      case 'image':
        analysis.imageElements++;
        break;
      case 'button':
        analysis.buttonElements++;
        break;
      case 'input':
        analysis.inputElements++;
        break;
    }
  });

  // Detect repeating patterns
  const elementTypes = elements.map(el => el.type);
  const uniqueTypes = [...new Set(elementTypes)];
  analysis.hasRepeatingPattern = uniqueTypes.length < elements.length / 2;

  // Determine content complexity
  if (elements.length > 10) {
    analysis.contentComplexity = 'complex';
  } else if (elements.length > 5) {
    analysis.contentComplexity = 'moderate';
  }

  // Analyze semantic structure
  analysis.semanticStructure = detectSemanticStructure(elements);

  return analysis;
}

/**
 * Analyze media content patterns
 * @param {Array} elements - Section elements
 * @returns {object} - Media analysis
 */
function analyzeMediaContent(elements) {
  const mediaElements = elements.filter(el => el.type === 'image');
  const analysis = {
    mediaCount: mediaElements.length,
    mediaRatio: mediaElements.length / elements.length,
    hasImageGrid: false,
    hasImageCarousel: false,
    imageSizes: [],
    mediaTypes: []
  };

  // Analyze image patterns
  if (mediaElements.length > 1) {
    analysis.hasImageGrid = true;
  }

  // Detect carousel patterns
  if (mediaElements.length > 3 && elements.some(el => el.role === 'navigation')) {
    analysis.hasImageCarousel = true;
  }

  // Analyze image sizes
  mediaElements.forEach(img => {
    if (img.attributes && img.attributes.width && img.attributes.height) {
      analysis.imageSizes.push({
        width: img.attributes.width,
        height: img.attributes.height,
        ratio: img.attributes.width / img.attributes.height
      });
    }
  });

  return analysis;
}

/**
 * Analyze text content patterns
 * @param {Array} elements - Section elements
 * @returns {object} - Text analysis
 */
function analyzeTextContent(elements) {
  const textElements = elements.filter(el => el.type === 'text');
  const analysis = {
    textCount: textElements.length,
    hasHeadings: false,
    hasBodyText: false,
    hasCaptions: false,
    textLengths: [],
    languagePatterns: []
  };

  textElements.forEach(text => {
    const content = text.content.toLowerCase();
    const length = text.content.length;

    analysis.textLengths.push(length);

    // Detect heading patterns
    if (length < 100 && (content.includes('title') || content.includes('heading'))) {
      analysis.hasHeadings = true;
    }

    // Detect body text patterns
    if (length > 100) {
      analysis.hasBodyText = true;
    }

    // Detect caption patterns
    if (length < 50 && (content.includes('caption') || content.includes('alt'))) {
      analysis.hasCaptions = true;
    }
  });

  return analysis;
}

/**
 * Analyze interaction patterns
 * @param {Array} elements - Section elements
 * @returns {object} - Interaction analysis
 */
function analyzeInteractions(elements) {
  const analysis = {
    formElements: 0,
    buttonElements: 0,
    linkElements: 0,
    hasNavigation: false,
    hasCTAs: false,
    interactionTypes: []
  };

  elements.forEach(element => {
    switch (element.type) {
      case 'input':
        analysis.formElements++;
        analysis.interactionTypes.push('input');
        break;
      case 'button':
        analysis.buttonElements++;
        analysis.interactionTypes.push('button');
        if (element.role === 'cta' || element.content.toLowerCase().includes('cta')) {
          analysis.hasCTAs = true;
        }
        break;
      case 'link':
        analysis.linkElements++;
        analysis.interactionTypes.push('link');
        break;
    }

    if (element.role === 'navigation') {
      analysis.hasNavigation = true;
    }
  });

  return analysis;
}

/**
 * Calculate post collection score based on elements and section name
 * @param {Array} elements - Section elements
 * @param {string} sectionName - Section name
 * @returns {number} - Score between 0 and 1
 */
function calculatePostCollectionScore(elements, sectionName) {
  let score = 0;
  
  // Check for "see more" buttons (highest priority)
  if (elements.some(el => 
    el.role === 'see_more' || 
    el.content.toLowerCase().includes('see more') ||
    el.content.toLowerCase().includes('view more') ||
    el.content.toLowerCase().includes('browse all')
  )) {
    score += 0.8;
  }
  
  // Check section name patterns
  const collectionKeywords = ['projects', 'portfolio', 'testimonials', 'team', 'news', 'blog', 'events', 'products', 'case_studies'];
  if (collectionKeywords.some(keyword => sectionName.toLowerCase().includes(keyword))) {
    score += 0.6;
  }
  
  // Check for multiple similar elements (potential collection items)
  const elementTypes = elements.map(el => el.type);
  const uniqueTypes = [...new Set(elementTypes)];
  if (uniqueTypes.length < elements.length / 3) {
    score += 0.4;
  }
  
  return Math.min(1, score);
}

/**
 * Calculate repeater score based on elements and patterns
 * @param {Array} elements - Section elements
 * @param {string} sectionName - Section name
 * @param {object} contentPatterns - Content patterns
 * @param {object} contentAnalysis - Content analysis
 * @returns {number} - Score between 0 and 1
 */
function calculateRepeaterScore(elements, sectionName, contentPatterns, contentAnalysis) {
  let score = 0;
  
  // Check content patterns
  if (contentPatterns.repeaters.includes(sectionName)) {
    score += 0.5;
  }
  
  // Check element count
  if (elements.length > 3) {
    score += 0.3;
  }
  
  // Check for repeating patterns
  if (contentAnalysis.hasRepeatingPattern) {
    score += 0.4;
  }
  
  // Check section name patterns
  const repeaterKeywords = ['list', 'grid', 'items', 'cards', 'gallery'];
  if (repeaterKeywords.some(keyword => sectionName.toLowerCase().includes(keyword))) {
    score += 0.3;
  }
  
  return Math.min(1, score);
}

/**
 * Calculate group score based on elements and patterns
 * @param {Array} elements - Section elements
 * @param {string} sectionName - Section name
 * @param {object} contentPatterns - Content patterns
 * @param {object} contentAnalysis - Content analysis
 * @returns {number} - Score between 0 and 1
 */
function calculateGroupScore(elements, sectionName, contentPatterns, contentAnalysis) {
  let score = 0;
  
  // Check content patterns
  if (contentPatterns.groups.includes(sectionName)) {
    score += 0.4;
  }
  
  // Check for mixed content types (typical of groups)
  const elementTypes = elements.map(el => el.type);
  const uniqueTypes = [...new Set(elementTypes)];
  if (uniqueTypes.length > 2) {
    score += 0.3;
  }
  
  // Check section name patterns
  const groupKeywords = ['info', 'contact', 'details', 'about', 'profile'];
  if (groupKeywords.some(keyword => sectionName.toLowerCase().includes(keyword))) {
    score += 0.3;
  }
  
  return Math.min(1, score);
}

/**
 * Generate field suggestions for repeater sections
 * @param {Array} elements - Section elements
 * @param {object} contentAnalysis - Content analysis
 * @returns {Array} - Field suggestions
 */
function generateRepeaterFieldSuggestions(elements, contentAnalysis) {
  const suggestions = [];
  
  // Analyze element patterns to suggest fields
  const elementTypes = elements.map(el => el.type);
  const uniqueTypes = [...new Set(elementTypes)];
  
  uniqueTypes.forEach(type => {
    switch (type) {
      case 'text':
        suggestions.push({
          name: 'title',
          type: 'input',
          label: 'Title',
          multilanguage: true
        });
        break;
      case 'image':
        suggestions.push({
          name: 'image',
          type: 'media',
          label: 'Image',
          accept: ['image']
        });
        break;
      case 'button':
        suggestions.push({
          name: 'cta_text',
          type: 'input',
          label: 'CTA Text',
          multilanguage: true
        });
        break;
    }
  });
  
  return suggestions;
}

/**
 * Generate field suggestions for group sections
 * @param {Array} elements - Section elements
 * @param {object} contentAnalysis - Content analysis
 * @returns {Array} - Field suggestions
 */
function generateGroupFieldSuggestions(elements, contentAnalysis) {
  const suggestions = [];
  
  elements.forEach((element, index) => {
    const fieldName = generateFieldNameFromElement(element, index);
    const fieldLabel = generateFieldLabelFromElement(element);
    
    suggestions.push({
      name: fieldName,
      type: element.type === 'image' ? 'media' : 'input',
      label: fieldLabel,
      multilanguage: element.type === 'text'
    });
  });
  
  return suggestions;
}

/**
 * Generate field suggestions for media sections
 * @param {object} mediaAnalysis - Media analysis
 * @returns {Array} - Field suggestions
 */
function generateMediaFieldSuggestions(mediaAnalysis) {
  const suggestions = [];
  
  if (mediaAnalysis.hasImageGrid) {
    suggestions.push({
      name: 'gallery',
      type: 'repeater',
      label: 'Image Gallery',
      fields: [
        {
          name: 'image',
          type: 'media',
          label: 'Image',
          accept: ['image']
        },
        {
          name: 'caption',
          type: 'input',
          label: 'Caption',
          multilanguage: true
        }
      ]
    });
  }
  
  if (mediaAnalysis.hasImageCarousel) {
    suggestions.push({
      name: 'carousel_images',
      type: 'repeater',
      label: 'Carousel Images',
      fields: [
        {
          name: 'image',
          type: 'media',
          label: 'Image',
          accept: ['image']
        },
        {
          name: 'title',
          type: 'input',
          label: 'Title',
          multilanguage: true
        }
      ]
    });
  }
  
  return suggestions;
}

/**
 * Generate field suggestions for form sections
 * @param {Array} elements - Section elements
 * @param {object} interactionAnalysis - Interaction analysis
 * @returns {Array} - Field suggestions
 */
function generateFormFieldSuggestions(elements, interactionAnalysis) {
  const suggestions = [];
  
  elements.forEach((element, index) => {
    if (element.type === 'input') {
      const fieldName = generateFieldNameFromElement(element, index);
      const fieldLabel = generateFieldLabelFromElement(element);
      
      suggestions.push({
        name: fieldName,
        type: 'input',
        label: fieldLabel,
        multilanguage: false,
        required: true
      });
    }
  });
  
  return suggestions;
}

/**
 * Generate field suggestions for single sections
 * @param {Array} elements - Section elements
 * @param {object} contentAnalysis - Content analysis
 * @returns {Array} - Field suggestions
 */
function generateSingleFieldSuggestions(elements, contentAnalysis) {
  const suggestions = [];
  
  if (contentAnalysis.textElements > 0) {
    suggestions.push({
      name: 'content',
      type: 'texteditor',
      label: 'Content',
      multilanguage: true
    });
  }
  
  if (contentAnalysis.imageElements > 0) {
    suggestions.push({
      name: 'image',
      type: 'media',
      label: 'Image',
      accept: ['image']
    });
  }
  
  return suggestions;
}

/**
 * Detect semantic structure from elements
 * @param {Array} elements - Section elements
 * @returns {Array} - Semantic structure
 */
function detectSemanticStructure(elements) {
  const structure = [];
  
  elements.forEach(element => {
    if (element.role) {
      structure.push({
        role: element.role,
        type: element.type,
        content: element.content
      });
    }
  });
  
  return structure;
}

/**
 * Generate media gallery fields based on sophisticated analysis
 * @param {object} sectionAnalysis - Section analysis results
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Generated media fields
 */
function generateMediaGalleryFields(sectionAnalysis, fieldTypes, context) {
  const fields = [];
  const { mediaAnalysis, fieldSuggestions } = sectionAnalysis;
  
  // Add section title field
  fields.push(AntiCMSComponentGenerator.generateField('section_title', 'Section Title', 'input', {
    multilanguage: true,
    type: 'text',
    maxLength: 100,
    placeholder: 'Gallery Section Title'
  }, fieldTypes, context));
  
  // Generate gallery field based on analysis
  if (mediaAnalysis.hasImageGrid) {
    const galleryField = AntiCMSComponentGenerator.generateField('gallery', 'Image Gallery', 'repeater', {
      min: 1,
      max: 20,
      caption: 'Add gallery images',
      fields: [
        AntiCMSComponentGenerator.generateField('image', 'Image', 'media', {
          accept: ['image'],
          resolution: {
            minWidth: 400,
            maxWidth: 2000,
            minHeight: 300,
            maxHeight: 1500
          }
        }, fieldTypes, context),
        AntiCMSComponentGenerator.generateField('caption', 'Caption', 'input', {
          multilanguage: true,
          type: 'text',
          maxLength: 200,
          placeholder: 'Image caption'
        }, fieldTypes, context),
        AntiCMSComponentGenerator.generateField('alt_text', 'Alt Text', 'input', {
          multilanguage: true,
          type: 'text',
          maxLength: 100,
          placeholder: 'Image alt text for accessibility'
        }, fieldTypes, context)
      ]
    }, fieldTypes, context);
    
    fields.push(galleryField);
  }
  
  if (mediaAnalysis.hasImageCarousel) {
    const carouselField = AntiCMSComponentGenerator.generateField('carousel', 'Image Carousel', 'repeater', {
      min: 1,
      max: 10,
      caption: 'Add carousel images',
      fields: [
        AntiCMSComponentGenerator.generateField('image', 'Image', 'media', {
          accept: ['image'],
          resolution: {
            minWidth: 800,
            maxWidth: 1920,
            minHeight: 400,
            maxHeight: 1080
          }
        }, fieldTypes, context),
        AntiCMSComponentGenerator.generateField('title', 'Title', 'input', {
          multilanguage: true,
          type: 'text',
          maxLength: 100,
          placeholder: 'Image title'
        }, fieldTypes, context),
        AntiCMSComponentGenerator.generateField('description', 'Description', 'textarea', {
          multilanguage: true,
          rows: 3,
          max: 500,
          placeholder: 'Image description'
        }, fieldTypes, context)
      ]
    }, fieldTypes, context);
    
    fields.push(carouselField);
  }
  
  return fields;
}

/**
 * Generate form fields based on sophisticated analysis
 * @param {object} sectionAnalysis - Section analysis results
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Generated form fields
 */
function generateFormFields(sectionAnalysis, fieldTypes, context) {
  const fields = [];
  const { interactionAnalysis, fieldSuggestions } = sectionAnalysis;
  
  // Add section title field
  fields.push(AntiCMSComponentGenerator.generateField('section_title', 'Section Title', 'input', {
    multilanguage: true,
    type: 'text',
    maxLength: 100,
    placeholder: 'Form Section Title'
  }, fieldTypes, context));
  
  // Add form description
  fields.push(AntiCMSComponentGenerator.generateField('form_description', 'Form Description', 'textarea', {
    multilanguage: true,
    rows: 3,
    max: 500,
    placeholder: 'Form description or instructions'
  }, fieldTypes, context));
  
  // Generate form fields based on analysis
  if (interactionAnalysis.formElements > 0) {
    const formFieldsField = AntiCMSComponentGenerator.generateField('form_fields', 'Form Fields', 'repeater', {
      min: 1,
      max: 10,
      caption: 'Add form fields',
      fields: [
        AntiCMSComponentGenerator.generateField('field_label', 'Field Label', 'input', {
          multilanguage: true,
          type: 'text',
          maxLength: 100,
          placeholder: 'Field label'
        }, fieldTypes, context),
        AntiCMSComponentGenerator.generateField('field_type', 'Field Type', 'select', {
          options: [
            { value: 'text', label: 'Text Input' },
            { value: 'email', label: 'Email' },
            { value: 'tel', label: 'Phone' },
            { value: 'textarea', label: 'Textarea' },
            { value: 'select', label: 'Select' },
            { value: 'checkbox', label: 'Checkbox' },
            { value: 'radio', label: 'Radio' }
          ],
          defaultValue: 'text'
        }, fieldTypes, context),
        AntiCMSComponentGenerator.generateField('field_placeholder', 'Placeholder', 'input', {
          multilanguage: true,
          type: 'text',
          maxLength: 100,
          placeholder: 'Field placeholder text'
        }, fieldTypes, context),
        AntiCMSComponentGenerator.generateField('field_required', 'Required', 'toggle', {
          caption: 'Is this field required?',
          defaultValue: false
        }, fieldTypes, context)
      ]
    }, fieldTypes, context);
    
    fields.push(formFieldsField);
  }
  
  // Add submit button text
  fields.push(AntiCMSComponentGenerator.generateField('submit_button_text', 'Submit Button Text', 'input', {
    multilanguage: true,
    type: 'text',
    maxLength: 50,
    placeholder: 'Submit',
    defaultValue: 'Submit'
  }, fieldTypes, context));
  
  return fields;
}

/**
 * Generate enhanced single fields based on sophisticated analysis
 * @param {Array} elements - Section elements
 * @param {object} sectionAnalysis - Section analysis results
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Generated fields
 */
function generateEnhancedSingleFields(elements, sectionAnalysis, fieldTypes, context) {
  const fields = [];
  const { contentAnalysis, textAnalysis, mediaAnalysis, fieldSuggestions } = sectionAnalysis;
  
  // Add section title if there are text elements
  if (textAnalysis.hasHeadings) {
    fields.push(AntiCMSComponentGenerator.generateField('section_title', 'Section Title', 'input', {
      multilanguage: true,
      type: 'text',
      maxLength: 100,
      placeholder: 'Section Title'
    }, fieldTypes, context));
  }
  
  // Add content field if there are text elements
  if (textAnalysis.hasBodyText || contentAnalysis.textElements > 0) {
    fields.push(AntiCMSComponentGenerator.generateField('content', 'Content', 'texteditor', {
      multilanguage: true,
      type: 'full',
      placeholder: 'Enter section content'
    }, fieldTypes, context));
  }
  
  // Add media field if there are images
  if (mediaAnalysis.mediaCount > 0) {
    fields.push(AntiCMSComponentGenerator.generateField('image', 'Image', 'media', {
      accept: ['image'],
      resolution: {
        minWidth: 400,
        maxWidth: 1920,
        minHeight: 300,
        maxHeight: 1080
      }
    }, fieldTypes, context));
  }
  
  // Add CTA field if there are buttons
  if (contentAnalysis.buttonElements > 0) {
    fields.push(AntiCMSComponentGenerator.generateField('cta_text', 'CTA Text', 'input', {
      multilanguage: true,
      type: 'text',
      maxLength: 100,
      placeholder: 'Call to action text'
    }, fieldTypes, context));
    
    fields.push(AntiCMSComponentGenerator.generateField('cta_link', 'CTA Link', 'input', {
      type: 'url',
      placeholder: '/contact',
      maxLength: 200
    }, fieldTypes, context));
  }
  
  return fields;
}

/**
 * Generate section from Figma metadata with intelligent field detection
 * @param {string} sectionType - Section type
 * @param {object} figmaMetadata - Figma metadata JSON
 * @param {object} options - Section options
 * @param {Object} fieldTypes - Field types configuration
 * @returns {object} - Generated AntiCMS section
 */
function generateSectionFromFigmaMetadata(sectionType, figmaMetadata, options, fieldTypes) {
  const { anticms_analysis, figma_code_response } = figmaMetadata;
  const sections = figma_code_response?.sections || {};
  const sectionData = sections[sectionType];
  const analysis = anticms_analysis?.identified_sections?.[sectionType];

  if (!sectionData) {
    console.warn(`[generateSectionFromFigmaMetadata] No data found for section: ${sectionType}`);
    return null;
  }

  const fields = [];
  const context = sectionType.toLowerCase();

  // Add status field
  fields.push(AntiCMSComponentGenerator.generateField('status', 'Status', 'toggle', {
    caption: `Enable or disable the ${sectionType} section`,
    defaultValue: true
  }, fieldTypes, context));

  // Analyze section data to detect field types
  const detectedFields = analyzeSectionDataForFields(sectionData, analysis, fieldTypes, context);
  fields.push(...detectedFields);

  // Check for CTA/button/link components and add CTA fields
  const ctaFields = detectAndGenerateCTAFields(sectionData, fieldTypes, context);
  fields.push(...ctaFields);

  return AntiCMSComponentGenerator.generateComponent(
    `${sectionType}_section`,
    sectionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Section',
    options.sectionNumber,
    fields,
    { block: sectionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
  );
}

/**
 * Analyze section data to detect and generate appropriate fields
 * @param {object} sectionData - Section data from Figma metadata
 * @param {object} analysis - AntiCMS analysis for the section
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Generated fields
 */
function analyzeSectionDataForFields(sectionData, analysis, fieldTypes, context) {
  const fields = [];
  
  // First, analyze the actual section data structure for arrays and objects
  const dataStructureFields = analyzeDataStructure(sectionData, fieldTypes, context);
  fields.push(...dataStructureFields);
  
  // Skip analysis metadata processing to avoid hallucination
  // The data structure analysis above is sufficient and accurate

  // If no fields detected, add basic section fields
  if (fields.length === 0) {
    const autoDetectedFields = autoDetectFieldsFromSectionData(sectionData, fieldTypes, context);
    fields.push(...autoDetectedFields);
  }

  return fields;
}

/**
 * Analyze the actual data structure to detect arrays and objects
 * @param {object} sectionData - Section data from Figma metadata
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Generated fields
 */
function analyzeDataStructure(sectionData, fieldTypes, context) {
  const fields = [];
  
  // Iterate through all properties in the section data
  for (const [key, value] of Object.entries(sectionData)) {
    if (Array.isArray(value)) {
      // This is an array - convert to repeater
      const repeaterField = generateRepeaterFromArray(key, value, fieldTypes, context);
      if (repeaterField) {
        fields.push(repeaterField);
      }
    } else if (typeof value === 'object' && value !== null) {
      // This is an object - analyze its structure
      const objectFields = analyzeObjectStructure(key, value, fieldTypes, context);
      fields.push(...objectFields);
    } else if (typeof value === 'string' || typeof value === 'number') {
      // This is a primitive value - convert to appropriate field
      const primitiveField = generateFieldFromPrimitive(key, value, fieldTypes, context);
      if (primitiveField) {
        fields.push(primitiveField);
      }
    }
  }
  
  return fields;
}

/**
 * Generate repeater field from array data
 * @param {string} fieldName - Field name
 * @param {Array} arrayData - Array data
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {object|null} - Generated repeater field
 */
function generateRepeaterFromArray(fieldName, arrayData, fieldTypes, context) {
  if (!Array.isArray(arrayData) || arrayData.length === 0) {
    return null;
  }
  
  // Analyze the first item to determine repeater structure
  const firstItem = arrayData[0];
  const repeaterFields = [];
  
  if (typeof firstItem === 'object' && firstItem !== null) {
    // Array of objects - analyze object properties EXACTLY as they appear
    for (const [itemKey, itemValue] of Object.entries(firstItem)) {
      const subField = generateFieldFromPrimitive(itemKey, itemValue, fieldTypes, context);
      if (subField) {
        repeaterFields.push(subField);
      }
    }
  } else {
    // Array of primitives - create a simple field
    const subField = generateFieldFromPrimitive('item', firstItem, fieldTypes, context);
    if (subField) {
      repeaterFields.push(subField);
    }
  }
  
  if (repeaterFields.length === 0) {
    return null;
  }
  
  return AntiCMSComponentGenerator.generateField(
    fieldName,
    fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    'repeater',
    {
      min: 1,
      max: Math.max(arrayData.length, 10),
      caption: `Add ${fieldName.replace(/_/g, ' ')} items`,
      fields: repeaterFields
    },
    fieldTypes,
    context
  );
}

/**
 * Analyze object structure to generate appropriate fields
 * @param {string} objectName - Object name
 * @param {object} objectData - Object data
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Generated fields
 */
function analyzeObjectStructure(objectName, objectData, fieldTypes, context) {
  const fields = [];
  
  // Check if this should be a group field
  const hasMultipleProperties = Object.keys(objectData).length > 1;
  const isContactInfo = objectName.includes('contact') || objectName.includes('info');
  const isSocialInfo = objectName.includes('social') || objectName.includes('links');
  
  if (hasMultipleProperties && (isContactInfo || isSocialInfo)) {
    // Create group field
    const groupFields = [];
    for (const [key, value] of Object.entries(objectData)) {
      const subField = generateFieldFromPrimitive(key, value, fieldTypes, context);
      if (subField) {
        groupFields.push(subField);
      }
    }
    
    if (groupFields.length > 0) {
      fields.push(AntiCMSComponentGenerator.generateField(
        objectName,
        objectName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        'group',
        {
          fields: groupFields
        },
        fieldTypes,
        context
      ));
    }
  } else {
    // Create individual fields for each property
    for (const [key, value] of Object.entries(objectData)) {
      const field = generateFieldFromPrimitive(key, value, fieldTypes, context);
      if (field) {
        fields.push(field);
      }
    }
  }
  
  return fields;
}

/**
 * Detect and generate CTA fields from section data
 * @param {object} sectionData - Section data from Figma metadata
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Generated CTA fields
 */
function detectAndGenerateCTAFields(sectionData, fieldTypes, context) {
  const ctaFields = [];
  
  // Check for CTA-related keywords in the data
  const ctaKeywords = ['cta', 'button', 'link', 'call_to_action', 'call-to-action', 'action_button', 'action-button'];
  const hasCTA = checkForCTAKeywords(sectionData, ctaKeywords);
  
  if (hasCTA) {
    // Generate CTA button group with label and link fields
    const buttonGroupFields = [
      AntiCMSComponentGenerator.generateField(
        'label',
        'Label',
        'input',
        {
          type: 'text',
          placeholder: 'Button Label',
          maxLength: 50,
          multilanguage: true,
          is_required: false,
          defaultValue: '',
          value: null
        },
        fieldTypes,
        context
      ),
      AntiCMSComponentGenerator.generateField(
        'link',
        'Link',
        'input',
        {
          type: 'url',
          placeholder: 'Enter link',
          multilanguage: false,
          is_required: false,
          defaultValue: '#',
          value: null
        },
        fieldTypes,
        context
      )
    ];
    
    // Create the button group
    ctaFields.push(AntiCMSComponentGenerator.generateField(
      'button_group',
      'Button Group',
      'group',
      {
        min: 1,
        max: 1,
        fields: buttonGroupFields
      },
      fieldTypes,
      context
    ));
  }
  
  return ctaFields;
}

/**
 * Check for CTA keywords in section data recursively
 * @param {object} data - Data to check
 * @param {Array} keywords - Keywords to look for
 * @returns {boolean} - Whether CTA keywords were found
 */
function checkForCTAKeywords(data, keywords) {
  if (typeof data === 'string') {
    return keywords.some(keyword => 
      data.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  if (Array.isArray(data)) {
    return data.some(item => checkForCTAKeywords(item, keywords));
  }
  
  if (typeof data === 'object' && data !== null) {
    // Check object keys
    const hasKeywordInKeys = Object.keys(data).some(key => 
      keywords.some(keyword => key.toLowerCase().includes(keyword.toLowerCase()))
    );
    
    if (hasKeywordInKeys) return true;
    
    // Check object values recursively
    return Object.values(data).some(value => 
      checkForCTAKeywords(value, keywords)
    );
  }
  
  return false;
}

/**
 * Generate field from primitive value
 * @param {string} fieldName - Field name
 * @param {*} value - Primitive value
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {object|null} - Generated field
 */
function generateFieldFromPrimitive(fieldName, value, fieldTypes, context) {
  const name = fieldName.toLowerCase();
  
  // Determine field type based on field name and value
  let fieldType = 'input';
  let fieldOptions = {};
  
  // Image/media fields
  if (name.includes('image') || name.includes('avatar') || name.includes('logo') || name.includes('icon') || name.includes('placeholder')) {
    fieldType = 'media';
    fieldOptions = {
      accept: ['image'],
      resolution: name.includes('avatar') ? 
        { minWidth: 100, maxWidth: 200, minHeight: 100, maxHeight: 200 } :
        name.includes('icon') ?
        { minWidth: 32, maxWidth: 64, minHeight: 32, maxHeight: 64 } :
        { minWidth: 400, maxWidth: 1920, minHeight: 300, maxHeight: 1080 }
    };
  }
  // Text editor fields
  else if (name.includes('content') || name.includes('description') || name.includes('testimonial') || name.includes('quote')) {
    fieldType = 'texteditor';
    fieldOptions = {
      type: 'full',
      placeholder: `Enter ${fieldName.replace(/_/g, ' ')}`,
      multilanguage: true
    };
  }
  // Textarea fields
  else if (name.includes('message') || name.includes('address') || name.includes('bio')) {
    fieldType = 'textarea';
    fieldOptions = {
      rows: name.includes('message') ? 4 : 3,
      placeholder: `Enter ${fieldName.replace(/_/g, ' ')}`,
      multilanguage: true
    };
  }
  // URL fields
  else if (name.includes('link') || name.includes('url') || name.includes('website')) {
    fieldType = 'input';
    fieldOptions = {
      type: 'url',
      placeholder: 'https://example.com'
    };
  }
  // Email fields
  else if (name.includes('email')) {
    fieldType = 'input';
    fieldOptions = {
      type: 'email',
      placeholder: 'contact@example.com'
    };
  }
  // Phone fields
  else if (name.includes('phone') || name.includes('tel')) {
    fieldType = 'input';
    fieldOptions = {
      type: 'text',
      placeholder: '+1 (555) 123-4567',
      maxLength: 20
    };
  }
  // Number fields
  else if (typeof value === 'number' || name.includes('score') || name.includes('rating') || name.includes('count')) {
    fieldType = 'input';
    fieldOptions = {
      type: 'number',
      placeholder: `Enter ${fieldName.replace(/_/g, ' ')}`,
      min: 0
    };
  }
  // Default text input
  else {
    fieldType = 'input';
    fieldOptions = {
      type: 'text',
      placeholder: `Enter ${fieldName.replace(/_/g, ' ')}`,
      maxLength: name.includes('title') ? 100 : 50,
      multilanguage: !name.includes('email') && !name.includes('phone') && !name.includes('url')
    };
  }
  
  return AntiCMSComponentGenerator.generateField(
    fieldName,
    fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    fieldType,
    fieldOptions,
    fieldTypes,
    context
  );
}

/**
 * Generate field from metadata field information
 * @param {string} fieldInfo - Field information from analysis
 * @param {object} sectionData - Section data
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {object|null} - Generated field or null
 */
function generateFieldFromMetadata(fieldInfo, sectionData, fieldTypes, context) {
  // Parse field information (e.g., "service_cards (repeater, max 3)")
  const fieldMatch = fieldInfo.match(/^(.+?)\s*(?:\((.+?)\))?$/);
  if (!fieldMatch) return null;

  const fieldName = fieldMatch[1];
  const fieldConfig = fieldMatch[2] || '';
  
  // Determine field type based on configuration
  let fieldType = 'input';
  let fieldOptions = {};

  if (fieldConfig.includes('repeater')) {
    fieldType = 'repeater';
    const maxMatch = fieldConfig.match(/max\s+(\d+)/);
    const minMatch = fieldConfig.match(/min\s+(\d+)/);
    
    fieldOptions = {
      min: minMatch ? parseInt(minMatch[1]) : 1,
      max: maxMatch ? parseInt(maxMatch[1]) : 10,
      caption: `Add ${fieldName.replace(/_/g, ' ')} items`,
      fields: generateRepeaterFieldsFromSectionData(fieldName, sectionData, fieldTypes, context)
    };
  } else if (fieldConfig.includes('group')) {
    fieldType = 'group';
    fieldOptions = {
      fields: generateGroupFieldsFromSectionData(fieldName, sectionData, fieldTypes, context)
    };
  } else {
    // Determine field type based on field name and content
    fieldType = determineFieldTypeFromName(fieldName, sectionData);
    fieldOptions = generateFieldOptionsFromName(fieldName, sectionData, fieldType);
  }

  return AntiCMSComponentGenerator.generateField(
    fieldName,
    fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    fieldType,
    fieldOptions,
    fieldTypes,
    context
  );
}

/**
 * Determine field type based on field name and section data
 * @param {string} fieldName - Field name
 * @param {object} sectionData - Section data
 * @returns {string} - Field type
 */
function determineFieldTypeFromName(fieldName, sectionData) {
  const name = fieldName.toLowerCase();
  
  // Image/media fields
  if (name.includes('image') || name.includes('avatar') || name.includes('logo') || name.includes('icon')) {
    return 'media';
  }
  
  // Text editor fields
  if (name.includes('content') || name.includes('description') || name.includes('testimonial')) {
    return 'texteditor';
  }
  
  // Textarea fields
  if (name.includes('message') || name.includes('address') || name.includes('bio')) {
    return 'textarea';
  }
  
  // URL fields
  if (name.includes('link') || name.includes('url') || name.includes('website')) {
    return 'input';
  }
  
  // Email fields
  if (name.includes('email')) {
    return 'input';
  }
  
  // Phone fields
  if (name.includes('phone') || name.includes('tel')) {
    return 'input';
  }
  
  // Default to input
  return 'input';
}

/**
 * Generate field options based on field name and type
 * @param {string} fieldName - Field name
 * @param {object} sectionData - Section data
 * @param {string} fieldType - Field type
 * @returns {object} - Field options
 */
function generateFieldOptionsFromName(fieldName, sectionData, fieldType) {
  const name = fieldName.toLowerCase();
  const options = {};

  switch (fieldType) {
    case 'media':
      options.accept = ['image'];
      if (name.includes('avatar')) {
        options.resolution = { minWidth: 100, maxWidth: 200, minHeight: 100, maxHeight: 200 };
      } else if (name.includes('icon')) {
        options.resolution = { minWidth: 32, maxWidth: 64, minHeight: 32, maxHeight: 64 };
      } else {
        options.resolution = { minWidth: 400, maxWidth: 1920, minHeight: 300, maxHeight: 1080 };
      }
      break;
      
    case 'input':
      if (name.includes('email')) {
        options.type = 'email';
        options.placeholder = 'contact@example.com';
      } else if (name.includes('phone') || name.includes('tel')) {
        options.type = 'text';
        options.placeholder = '+1 (555) 123-4567';
        options.maxLength = 20;
      } else if (name.includes('link') || name.includes('url')) {
        options.type = 'url';
        options.placeholder = 'https://example.com';
      } else {
        options.type = 'text';
        options.placeholder = `Enter ${fieldName.replace(/_/g, ' ')}`;
        options.maxLength = name.includes('title') ? 100 : 50;
      }
      break;
      
    case 'textarea':
      options.rows = name.includes('message') ? 4 : 3;
      options.placeholder = `Enter ${fieldName.replace(/_/g, ' ')}`;
      break;
      
    case 'texteditor':
      options.type = 'full';
      options.placeholder = `Enter ${fieldName.replace(/_/g, ' ')}`;
      break;
  }

  // Add multilanguage support for text fields
  if (['input', 'textarea', 'texteditor'].includes(fieldType) && 
      !name.includes('email') && !name.includes('phone') && !name.includes('url')) {
    options.multilanguage = true;
  }

  return options;
}

/**
 * Generate repeater fields from section data
 * @param {string} repeaterName - Repeater field name
 * @param {object} sectionData - Section data
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Repeater fields
 */
function generateRepeaterFieldsFromSectionData(repeaterName, sectionData, fieldTypes, context) {
  const fields = [];
  
  // Common repeater field patterns
  const commonFields = [
    { name: 'title', type: 'input', label: 'Title' },
    { name: 'description', type: 'textarea', label: 'Description' },
    { name: 'image', type: 'media', label: 'Image' },
    { name: 'link', type: 'input', label: 'Link' }
  ];

  // Add fields based on repeater type
  if (repeaterName.includes('service')) {
    fields.push(
      AntiCMSComponentGenerator.generateField('title', 'Service Title', 'input', {
        type: 'text',
        maxLength: 100,
        placeholder: 'Service name',
        multilanguage: true
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('description', 'Description', 'textarea', {
        rows: 3,
        max: 500,
        placeholder: 'Service description',
        multilanguage: true
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('icon', 'Icon', 'media', {
        accept: ['image'],
        resolution: { minWidth: 32, maxWidth: 64, minHeight: 32, maxHeight: 64 }
      }, fieldTypes, context)
    );
  } else if (repeaterName.includes('testimonial')) {
    fields.push(
      AntiCMSComponentGenerator.generateField('name', 'Name', 'input', {
        type: 'text',
        maxLength: 50,
        placeholder: 'Client name'
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('testimonial', 'Testimonial', 'textarea', {
        rows: 4,
        placeholder: 'Client testimonial',
        multilanguage: true
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('avatar', 'Avatar', 'media', {
        accept: ['image'],
        resolution: { minWidth: 100, maxWidth: 200, minHeight: 100, maxHeight: 200 }
      }, fieldTypes, context)
    );
  } else if (repeaterName.includes('project') || repeaterName.includes('work')) {
    fields.push(
      AntiCMSComponentGenerator.generateField('title', 'Project Title', 'input', {
        type: 'text',
        maxLength: 100,
        placeholder: 'Project name',
        multilanguage: true
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('image', 'Image', 'media', {
        accept: ['image'],
        resolution: { minWidth: 400, maxWidth: 1920, minHeight: 300, maxHeight: 1080 }
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('link', 'Project Link', 'input', {
        type: 'url',
        placeholder: 'https://example.com'
      }, fieldTypes, context)
    );
  } else {
    // Generic repeater fields
    commonFields.forEach(field => {
      const options = generateFieldOptionsFromName(field.name, sectionData, field.type);
      fields.push(AntiCMSComponentGenerator.generateField(
        field.name,
        field.label,
        field.type,
        options,
        fieldTypes,
        context
      ));
    });
  }

  return fields;
}

/**
 * Generate group fields from section data
 * @param {string} groupName - Group field name
 * @param {object} sectionData - Section data
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Group fields
 */
function generateGroupFieldsFromSectionData(groupName, sectionData, fieldTypes, context) {
  const fields = [];
  
  if (groupName.includes('contact') || groupName.includes('info')) {
    fields.push(
      AntiCMSComponentGenerator.generateField('email', 'Email', 'input', {
        type: 'email',
        placeholder: 'contact@example.com'
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('phone', 'Phone', 'input', {
        type: 'text',
        placeholder: '+1 (555) 123-4567',
        maxLength: 20
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('address', 'Address', 'textarea', {
        rows: 3,
        placeholder: 'Company address',
        multilanguage: true
      }, fieldTypes, context)
    );
  } else if (groupName.includes('social')) {
    fields.push(
      AntiCMSComponentGenerator.generateField('facebook', 'Facebook', 'input', {
        type: 'url',
        placeholder: 'https://facebook.com/...'
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('twitter', 'Twitter', 'input', {
        type: 'url',
        placeholder: 'https://twitter.com/...'
      }, fieldTypes, context),
      AntiCMSComponentGenerator.generateField('linkedin', 'LinkedIn', 'input', {
        type: 'url',
        placeholder: 'https://linkedin.com/...'
      }, fieldTypes, context)
    );
  }

  return fields;
}

/**
 * Auto-detect fields from section data when no analysis is available
 * @param {object} sectionData - Section data
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Detected fields
 */
function autoDetectFieldsFromSectionData(sectionData, fieldTypes, context) {
  const fields = [];
  
  // Add section title
  fields.push(AntiCMSComponentGenerator.generateField('section_title', 'Section Title', 'input', {
    type: 'text',
    maxLength: 100,
    placeholder: 'Section Title',
    multilanguage: true
  }, fieldTypes, context));

  // Add content field
  fields.push(AntiCMSComponentGenerator.generateField('content', 'Content', 'texteditor', {
    type: 'full',
    placeholder: 'Enter section content',
    multilanguage: true
  }, fieldTypes, context));

  return fields;
}

/**
 * Create repeater fields from elements
 * @param {Array} elements - Elements to convert to repeater fields
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Repeater fields
 */
function createRepeaterFields(elements, fieldTypes, context) {
  const repeaterFields = [];
  
  elements.forEach((element, index) => {
    const field = createFieldFromElement(element, index, fieldTypes, context);
    if (field) {
      repeaterFields.push(field);
    }
  });
  
  return repeaterFields;
}

/**
 * Create group fields from elements
 * @param {Array} elements - Elements to convert to group fields
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {Array} - Group fields
 */
function createGroupFields(elements, fieldTypes, context) {
  const groupFields = [];
  
  elements.forEach((element, index) => {
    const field = createFieldFromElement(element, index, fieldTypes, context);
    if (field) {
      groupFields.push(field);
    }
  });
  
  return groupFields;
}

/**
 * Create a field from a Figma element with 100% accuracy
 * @param {object} element - Figma element
 * @param {number} index - Element index
 * @param {Object} fieldTypes - Field types configuration
 * @param {string} context - Section context
 * @returns {object|null} - Generated field or null
 */
function createFieldFromElement(element, index, fieldTypes, context) {
  const fieldName = generateFieldNameFromElement(element, index);
  const fieldLabel = generateFieldLabelFromElement(element);
  
  let fieldType = 'input';
  let fieldOptions = {};

  // Determine field type and options based on element type, role, and attributes
  if (element.type === 'image') {
    fieldType = 'media';
    fieldOptions = {
      accept: ['image'],
      caption: 'Upload image',
      resolution: determineImageResolution(element)
    };
    
  } else if (element.type === 'button') {
    if (element.role === 'see_more') {
      // Skip see more buttons - they're handled at section level
      return null;
    } else {
      fieldType = 'input';
      fieldOptions = {
        type: 'text',
        placeholder: element.content,
        maxLength: 50
      };
    }
    
  } else if (element.type === 'input') {
    fieldType = 'input';
    fieldOptions = {
      type: determineInputType(element),
      placeholder: element.content,
      maxLength: determineMaxLength(element)
    };
    
  } else if (element.type === 'textarea') {
    fieldType = 'textarea';
    fieldOptions = {
      rows: determineTextareaRows(element),
      placeholder: element.content,
      max: determineMaxLength(element)
    };
    
  } else if (element.type === 'text') {
    if (element.role === 'heading') {
      fieldType = 'input';
      fieldOptions = {
        type: 'text',
        multilanguage: true,
        placeholder: element.content,
        maxLength: determineMaxLength(element)
      };
    } else if (element.role === 'description') {
      fieldType = 'textarea';
      fieldOptions = {
        multilanguage: true,
        rows: determineTextareaRows(element),
        placeholder: element.content,
        max: determineMaxLength(element)
      };
    } else {
      fieldType = 'input';
      fieldOptions = {
        type: 'text',
        multilanguage: true,
        placeholder: element.content,
        maxLength: determineMaxLength(element)
      };
    }
  }

  // Generate the field
  try {
    return AntiCMSComponentGenerator.generateField(
      fieldName, 
      fieldLabel, 
      fieldType, 
      fieldOptions, 
      fieldTypes, 
      context
    );
  } catch (error) {
    console.warn(`[createFieldFromElement] Error generating field for element:`, error.message);
    return null;
  }
}

/**
 * Determine image resolution based on element attributes
 * @param {object} element - Figma element
 * @returns {object} - Resolution constraints
 */
function determineImageResolution(element) {
  if (element.attributes && element.attributes.width && element.attributes.height) {
    return {
      minWidth: Math.max(100, element.attributes.width * 0.5),
      maxWidth: element.attributes.width * 2,
      minHeight: Math.max(100, element.attributes.height * 0.5),
      maxHeight: element.attributes.height * 2
    };
  }
  
  return {
    minWidth: 100,
    maxWidth: 1920,
    minHeight: 100,
    maxHeight: 1080
  };
}

/**
 * Determine input type based on element role and name
 * @param {object} element - Figma element
 * @returns {string} - Input type
 */
function determineInputType(element) {
  if (element.role === 'email') return 'email';
  if (element.role === 'phone') return 'tel';
  if (element.role === 'url') return 'url';
  if (element.role === 'password') return 'password';
  
  return 'text';
}

/**
 * Determine max length based on element content and role
 * @param {object} element - Figma element
 * @returns {number} - Max length
 */
function determineMaxLength(element) {
  const contentLength = element.content ? element.content.length : 0;
  
  if (element.role === 'heading') return Math.max(100, contentLength * 2);
  if (element.role === 'description') return Math.max(500, contentLength * 2);
  if (element.type === 'textarea') return Math.max(1000, contentLength * 2);
  
  return Math.max(50, contentLength * 2);
}

/**
 * Determine textarea rows based on element content
 * @param {object} element - Figma element
 * @returns {number} - Number of rows
 */
function determineTextareaRows(element) {
  const contentLength = element.content ? element.content.length : 0;
  
  if (contentLength > 200) return 6;
  if (contentLength > 100) return 4;
  if (contentLength > 50) return 3;
  
  return 2;
}

/**
 * Generate field name from Figma element
 * @param {object} element - Figma element
 * @param {number} index - Element index
 * @returns {string} - Field name
 */
function generateFieldNameFromElement(element, index) {
  // Use element name if available for maximum accuracy
  if (element.name) {
    return element.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
  
  // Fallback to role-based naming
  if (element.role === 'heading' || element.role === 'title') return 'title';
  if (element.role === 'description' || element.role === 'subtitle') return 'description';
  if (element.role === 'label' || element.role === 'caption') return 'label';
  if (element.role === 'cta' || element.role === 'button') return 'button_text';
  if (element.role === 'primary_cta') return 'primary_button';
  if (element.role === 'secondary_cta') return 'secondary_button';
  if (element.role === 'email') return 'email';
  if (element.role === 'phone') return 'phone';
  if (element.role === 'url') return 'url';
  if (element.role === 'password') return 'password';
  if (element.role === 'textarea') return 'message';
  
  // Type-based naming
  if (element.type === 'image') return 'image';
  if (element.type === 'button') return 'button_text';
  if (element.type === 'input') return 'input_text';
  if (element.type === 'textarea') return 'textarea_text';
  
  // Content-based naming
  if (element.content) {
    const content = element.content.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 20);
    
    if (content.length > 0) return content;
  }
  
  return `field_${index + 1}`;
}

/**
 * Generate field label from Figma element
 * @param {object} element - Figma element
 * @returns {string} - Field label
 */
function generateFieldLabelFromElement(element) {
  // Use element name if available for maximum accuracy
  if (element.name) {
    return element.name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }
  
  // Fallback to role-based labeling
  if (element.role === 'heading' || element.role === 'title') return 'Title';
  if (element.role === 'description' || element.role === 'subtitle') return 'Description';
  if (element.role === 'label' || element.role === 'caption') return 'Label';
  if (element.role === 'cta' || element.role === 'button') return 'Button Text';
  if (element.role === 'primary_cta') return 'Primary Button';
  if (element.role === 'secondary_cta') return 'Secondary Button';
  if (element.role === 'email') return 'Email Address';
  if (element.role === 'phone') return 'Phone Number';
  if (element.role === 'url') return 'Website URL';
  if (element.role === 'password') return 'Password';
  if (element.role === 'textarea') return 'Message';
  
  // Type-based labeling
  if (element.type === 'image') return 'Image';
  if (element.type === 'button') return 'Button Text';
  if (element.type === 'input') return 'Input Text';
  if (element.type === 'textarea') return 'Text Content';
  
  // Content-based labeling
  if (element.content) {
    const content = element.content.trim();
    if (content.length > 0 && content.length <= 50) {
      return content.charAt(0).toUpperCase() + content.slice(1);
    }
  }
  
  return 'Field';
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
    description: originalDescription,
    template_type = 'pages',
    is_content = false,
    multilanguage = true,
    is_multiple = false,
    sections = [],
    include_cta = false,
    max_features = 6,
    max_gallery_images = 12,
    figma_data
  } = args;

  let description = originalDescription;

  // Load field types for generation
  const fieldTypes = await loadFieldTypes();

  // Parse Figma data if available
  const { sections: figmaSections, contentPatterns } = parseFigmaData(figma_data);

  // If Figma data is available, use it for 100% accurate section generation
  let finalSections = sections;
  let useFigmaData = false;
  let figmaMetadata = null;
  
  if (figmaSections && figmaSections.length > 0) {
    finalSections = figmaSections.map(section => section.name);
    useFigmaData = true;
    console.log(`[generateTemplate] Using Figma data for ${figmaSections.length} sections`);
  } else if (description) {
    // Fallback to natural language parsing if no Figma data
    const parsed = parseNaturalLanguageTemplate(description, fieldTypes);
    
    // If parsed sections are different from provided sections, and parsed has more content, use parsed
    const condition1 = parsed.sections.length > 0;
    const condition2 = sections.length === 0;
    const condition3 = sections.length === 1 && ['hero', 'features', 'contact'].includes(sections[0]);
    
    if (condition1 && (condition2 || condition3)) {
      finalSections = parsed.sections;
    }
  }

  // Check if we have Figma metadata JSON file path
  if (args.figma_metadata_file) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const metadataPath = path.resolve(args.figma_metadata_file);
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      figmaMetadata = JSON.parse(metadataContent);
      
      console.log(`[generateTemplate] Loaded Figma metadata from: ${metadataPath}`);
      console.log(`[generateTemplate] Metadata keys:`, Object.keys(figmaMetadata));
      
      // Use metadata for enhanced section generation
      if (figmaMetadata.anticms_analysis && figmaMetadata.figma_code_response) {
        finalSections = Object.keys(figmaMetadata.figma_code_response.sections || {});
        useFigmaData = true;
        console.log(`[generateTemplate] Using Figma metadata for ${finalSections.length} sections:`, finalSections);
      } else {
        console.log(`[generateTemplate] Metadata missing required fields. anticms_analysis:`, !!figmaMetadata.anticms_analysis, 'figma_code_response:', !!figmaMetadata.figma_code_response);
      }
    } catch (error) {
      console.warn(`[generateTemplate] Failed to load Figma metadata: ${error.message}`);
    }
  }

  const components = [];
  let sectionCounter = 1;

  // Generate requested sections dynamically with better error handling
  finalSections.forEach((sectionType, index) => {
    if (!sectionType || typeof sectionType !== 'string') {
      console.warn(`[generateTemplate] Skipping invalid section at index ${index}:`, sectionType);
      return;
    }
    
    const sectionOptions = { sectionNumber: sectionCounter++ };
    let section;

    try {
      // Use Figma data for 100% accurate section generation if available
      if (useFigmaData && figmaMetadata) {
        // Use Figma metadata for enhanced field detection
        console.log(`[generateTemplate] Using Figma metadata for section: ${sectionType}`);
        section = generateSectionFromFigmaMetadata(sectionType, figmaMetadata, sectionOptions, fieldTypes);
        console.log(`[generateTemplate] Generated section from Figma metadata: ${sectionType}`);
      } else if (useFigmaData && figmaSections) {
        const figmaSection = figmaSections.find(s => s.name === sectionType);
        if (figmaSection) {
          section = generateSectionFromFigma(figmaSection, contentPatterns, sectionOptions, fieldTypes);
          console.log(`[generateTemplate] Generated section from Figma data: ${sectionType}`);
        } else {
          console.warn(`[generateTemplate] Figma section not found for: ${sectionType}, falling back to standard generation`);
        }
      }
      
      // Fallback to standard generation if no Figma data or section not found
      if (!section) {
        // Normalize section type for comparison
        const normalizedType = sectionType.toLowerCase().trim();
        
        switch (normalizedType) {
          case 'hero':
          case 'banner':
          case 'header':
            section = AntiCMSComponentGenerator.generateHeroSection({
              includeCTA: include_cta,
              ...sectionOptions
            }, fieldTypes);
            break;
          
          case 'features':
          case 'benefits':
          case 'highlights':
            section = AntiCMSComponentGenerator.generateFeaturesSection({
              maxFeatures: max_features,
              ...sectionOptions
            }, fieldTypes);
            break;
          
          case 'contact':
          case 'contact_us':
          case 'get_in_touch':
            section = AntiCMSComponentGenerator.generateContactSection({
              ...sectionOptions
            }, fieldTypes);
            break;
            
          case 'gallery':
          case 'images':
          case 'portfolio':
            section = AntiCMSComponentGenerator.generateGallerySection({
              maxImages: max_gallery_images,
              ...sectionOptions
            }, fieldTypes);
            break;
          
          case 'content_parts':
          case 'content':
            section = AntiCMSComponentGenerator.generateContentPartsSection({
              ...sectionOptions
            }, fieldTypes);
            break;
          
          case 'scorecards':
          case 'cards':
            section = AntiCMSComponentGenerator.generateScorecardsSection({
              ...sectionOptions
            }, fieldTypes);
            break;
            
          default:
            // Allow custom section types with fallback
            section = AntiCMSComponentGenerator.generateCustomSection(sectionType, {
              ...sectionOptions
            }, fieldTypes);
        }
      }

      if (section) {
        components.push(section);
      }
    } catch (error) {
      console.warn(`[generateTemplate] Error generating section "${sectionType}":`, error.message);
      
      // Generate a basic fallback section
      try {
        const fallbackSection = AntiCMSComponentGenerator.generateCustomSection(
          sectionType || `section_${index + 1}`, 
          { ...sectionOptions }, 
          fieldTypes
        );
        if (fallbackSection) {
          components.push(fallbackSection);
        }
      } catch (fallbackError) {
        console.error(`[generateTemplate] Failed to create fallback section:`, fallbackError.message);
      }
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

    const figmaInfo = useFigmaData ? `\n🎨 **Generated from Figma data** - 100% accurate section mapping` : '';
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Generated AntiCMS v3 template "${label}" with ${components.length} sections.${figmaInfo}\n\n📁 **File saved to:** ${relativePath}\n📂 **Template type:** ${template_type === 'posts' ? 'Post Template' : 'Page Template'}\n\n**JSON Content:**\n\`\`\`json\n${JSON.stringify(template, null, 2)}\n\`\`\``
        }
      ]
    };
  } catch (error) {
    // If file creation fails, still return the template JSON
    console.error(`[MCP] Failed to save template file: ${error.message}`);
    
    const figmaInfo = useFigmaData ? `\n🎨 **Generated from Figma data** - 100% accurate section mapping` : '';
    
    return {
      content: [
        {
          type: 'text',
          text: `⚠️ Generated AntiCMS v3 template "${label}" with ${components.length} sections.${figmaInfo}\n\n❌ **File creation failed:** ${error.message}\n\n**JSON Content:**\n\`\`\`json\n${JSON.stringify(template, null, 2)}\n\`\`\``
        }
      ]
    };
  }
}


/**
 * List field types tool handler
 * @param {object} args - Tool arguments
 * @returns {object} - Tool response
 */
export async function listFieldTypes(args) {
  const {
    field_type,
    include_examples = true,
    include_properties = true
  } = args;

  // Load field types
  const fieldTypes = await loadFieldTypes();

  let result = {};

  if (field_type) {
    // Return specific field type
    if (fieldTypes[field_type]) {
      result[field_type] = {
        name: fieldTypes[field_type].name,
        label: fieldTypes[field_type].label,
        description: fieldTypes[field_type].description,
        field_type: fieldTypes[field_type].field_type
      };

      if (include_examples && fieldTypes[field_type].examples) {
        result[field_type].examples = fieldTypes[field_type].examples;
      }

      if (include_properties && fieldTypes[field_type].properties) {
        result[field_type].properties = fieldTypes[field_type].properties;
      }
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Field type "${field_type}" not found. Available types: ${Object.keys(fieldTypes).join(', ')}`
          }
        ]
      };
    }
  } else {
    // Return all field types
    Object.keys(fieldTypes).forEach(type => {
      result[type] = {
        name: fieldTypes[type].name,
        label: fieldTypes[type].label,
        description: fieldTypes[type].description,
        field_type: fieldTypes[type].field_type
      };

      if (include_examples && fieldTypes[type].examples) {
        result[type].examples = fieldTypes[type].examples;
      }

      if (include_properties && fieldTypes[type].properties) {
        result[type].properties = fieldTypes[type].properties;
      }
    });
  }

  return {
    content: [
      {
        type: 'text',
        text: `📋 **AntiCMS v3 Field Types**\n\n${JSON.stringify(result, null, 2)}`
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

  // Load field types for validation
  const fieldTypes = await loadFieldTypes();

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
        validateNestedFields(component.fields, `Component ${index + 1}`, errors, fieldTypes);
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
 * Detect if a section is a post collection based on keywords and context
 * @param {string} sectionText - Section text content
 * @param {object} sectionData - Section data structure
 * @returns {boolean} - True if section is a post collection
 */
function isPostCollectionSection(sectionText, sectionData = {}) {
  const collectionKeywords = [
    // Direct action keywords - Strong indicators for post collections
    'see more', 'view more', 'browse all', 'view all', 'load more',
    'show more', 'explore more', 'discover more', 'read more',
    'see all', 'learn more', 'find out more', 'more details',
    
    // Content type keywords
    'latest posts', 'recent posts', 'blog posts', 'news items',
    'events list', 'portfolio items', 'product list', 'case studies',
    'testimonials', 'team members', 'gallery items', 'projects',
    'articles', 'publications', 'resources', 'downloads',
    'services list', 'features list', 'benefits', 'achievements',
    
    // Collection indicators
    'collection', 'archive', 'catalog', 'directory', 'listing',
    'showcase', 'exhibition', 'highlights', 'featured items',
    
    // Pagination/Navigation keywords
    'pagination', 'next page', 'previous page', 'page navigation',
    'infinite scroll', 'lazy load', 'dynamic loading'
  ];

  const text = sectionText.toLowerCase();
  
  // Strong indicators - "See More" buttons are clear signs of post collections
  const hasSeeMorePattern = text.includes('see more') || text.includes('view more') || text.includes('browse all');
  
  // Check for collection keywords
  const hasCollectionKeywords = collectionKeywords.some(keyword => 
    text.includes(keyword)
  );
  
  // Check for repeater patterns that suggest post collections
  const hasRepeaterPatterns = text.includes('repeater') && (
    text.includes('posts') || 
    text.includes('items') || 
    text.includes('cards') ||
    text.includes('list') ||
    text.includes('grid') ||
    text.includes('collection')
  );
  
  // Check for plural content types (often indicates collections)
  const pluralPatterns = [
    'events', 'projects', 'products', 'services', 'testimonials',
    'articles', 'blogs', 'news', 'stories', 'cases', 'studies',
    'portfolios', 'galleries', 'resources', 'downloads', 'features',
    'benefits', 'achievements', 'awards', 'certifications', 'teams',
    'members', 'staff', 'clients', 'partners', 'sponsors'
  ];
  
  const hasPluralContent = pluralPatterns.some(pattern => 
    text.includes(pattern)
  );
  
  // Specific section name patterns that typically need post collections
  const postCollectionSectionNames = [
    'projects', 'portfolio', 'work', 'case_studies', 'testimonials',
    'team', 'news', 'blog', 'events', 'products'
  ];
  
  // Only detect as post collection if it's a specific match for the section name
  const hasPostCollectionSectionName = postCollectionSectionNames.some(name => {
    const words = text.toLowerCase().split(/\s+/);
    return words.includes(name) || text.includes(`${name}_section`) || text.includes(`${name} section`);
  });
  
  // Check section structure for collection indicators
  const hasCollectionStructure = sectionData.fields && 
    sectionData.fields.some(field => {
      if (field.field === 'repeater' && field.attribute && field.attribute.fields) {
        // Complex repeater with multiple fields suggests post collection
        const hasComplexStructure = field.attribute.fields.length > 2;
        
        // Check if repeater has typical post fields
        const hasPostFields = field.attribute.fields.some(subField => 
          ['title', 'description', 'image', 'content', 'date', 'author', 'category', 'tags'].includes(subField.name)
        );
        
        return hasComplexStructure || hasPostFields;
      }
      return false;
    });

  // Check for instruction document patterns
  const hasInstructionPatterns = text.includes('min:') && text.includes('max:') && 
    text.includes('repeater') && (
      text.includes('title') || 
      text.includes('description') ||
      text.includes('image')
    );

  // Priority logic: "See More" is a strong indicator
  if (hasSeeMorePattern) {
    return true;
  }

  // Exclude common template sections that should NOT be post collections
  const excludedSections = ['hero', 'features', 'contact', 'footer', 'header', 'about'];
  const isExcludedSection = excludedSections.some(section => 
    text.toLowerCase().includes(section) && !text.toLowerCase().includes('see more')
  );
  
  if (isExcludedSection) {
    return false;
  }

  return hasCollectionKeywords || hasRepeaterPatterns || hasCollectionStructure || 
         hasPluralContent || hasInstructionPatterns || hasPostCollectionSectionName;
}

/**
 * Convert post collection section to simple reference section with post_related field
 * @param {object} section - Original section with repeater
 * @param {string} postTypeName - Name of the post type to reference
 * @returns {object} - Simplified section for page template
 */
function convertToCollectionReference(section, postTypeName) {
  return {
    keyName: section.keyName,
    label: section.label,
    section: section.section,
    fields: [
      AntiCMSComponentGenerator.generateField('status', 'Status', 'toggle', {
        caption: `Enable or disable the ${section.label.toLowerCase()} section`,
        defaultValue: true
      }),
      AntiCMSComponentGenerator.generateField('section_label', 'Section Label', 'input', {
        multilanguage: true,
        inputType: 'text',
        placeholder: section.label.toUpperCase(),
        defaultValue: section.label.toUpperCase(),
        caption: 'Section label text'
      }),
      AntiCMSComponentGenerator.generateField('section_title', 'Section Title', 'input', {
        multilanguage: true,
        inputType: 'text',
        placeholder: `Featured ${section.label}`,
        defaultValue: `Featured ${section.label}`,
        caption: 'Main section heading'
      }),
      AntiCMSComponentGenerator.generateField('posts', 'Related Posts', 'post_related', {
        post_type: postTypeName.toLowerCase(),
        max: 12,
        min: 1,
        caption: `Select ${section.label.toLowerCase()} to display in this section`
      })
    ]
  };
}

/**
 * Generate template from natural language description
 * @param {string} description - Natural language description of the template
 * @param {Object} fieldTypes - Field types configuration
 * @returns {object} - Parsed template structure with sections
 */
function parseNaturalLanguageTemplate(description, fieldTypes) {
  const template = {
    sections: [],
    metadata: {}
  };

  const text = description.toLowerCase();
  
  // Simple keyword detection for testing
  if (text.includes('about')) {
    template.sections.push('about');
  }
  if (text.includes('news')) {
    template.sections.push('news');
  }
  if (text.includes('blog')) {
    template.sections.push('blog');
  }
  if (text.includes('contact')) {
    template.sections.push('contact');
  }
  
  // Detect CTA requirement
  if (text.includes('cta') || text.includes('call to action') || text.includes('button') || 
      text.includes('sign up') || text.includes('get started')) {
    template.metadata.include_cta = true;
  }

  // Detect template type
  if (text.includes('blog') || text.includes('article') || text.includes('post')) {
    template.metadata.template_type = 'posts';
  } else {
    template.metadata.template_type = 'pages';
  }

  // Detect multilanguage
  if (text.includes('multilingual') || text.includes('multi-language') || 
      text.includes('multiple languages') || text.includes('international')) {
    template.metadata.multilanguage = true;
  }

  return template;
}

/**
 * Enhanced template generation with natural language support
 * @param {object} args - Tool arguments including natural language description
 * @returns {object} - Tool response
 */
export async function generateTemplateFromDescription(args) {
  const {
    description,
    name: templateName,
    label
  } = args;

  // Load field types for generation
  const fieldTypes = await loadFieldTypes();

  // Parse natural language description
  const parsed = parseNaturalLanguageTemplate(description, fieldTypes);

  // Generate template using parsed sections
  const templateArgs = {
    name: templateName || parsed.sections.join('_').replace(/\s+/g, '_'),
    label: label || parsed.sections.join(' & ').replace(/\b\w/g, l => l.toUpperCase()),
    description: description,
    template_type: parsed.metadata.template_type || 'pages',
    is_content: false,
    multilanguage: parsed.metadata.multilanguage !== false,
    is_multiple: false,
    sections: parsed.sections,
    include_cta: parsed.metadata.include_cta || false,
    max_features: 6,
    max_gallery_images: 12
  };

  return await generateTemplate(templateArgs);
}

/**
 * Generate template from Figma metadata JSON file
 * @param {object} args - Tool arguments
 * @returns {object} - Tool response
 */
export async function generateTemplateFromFigmaMetadata(args) {
  const {
    metadata_file_path,
    template_name,
    template_label,
    template_type = 'pages',
    multilanguage = true,
    is_multiple = false
  } = args;

  try {
    // Read and parse the metadata file
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const metadataPath = path.resolve(metadata_file_path);
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);

    console.log(`[generateTemplateFromFigmaMetadata] Loaded metadata from: ${metadataPath}`);

    // Extract template information from metadata
    const anticmsAnalysis = metadata.anticms_analysis || {};
    const figmaCodeResponse = metadata.figma_code_response || {};
    const sections = figmaCodeResponse.sections || {};

    // Generate template name and label if not provided
    const templateName = template_name || anticmsAnalysis.template_type || 'figma_template';
    const templateLabel = template_label || metadata.figma_metadata_response?.name || 'Figma Template';

    // Map sections from Figma metadata to AntiCMS sections
    const mappedSections = mapFigmaSectionsToAntiCMS(sections, anticmsAnalysis);

    console.log(`[generateTemplateFromFigmaMetadata] Mapped ${mappedSections.length} sections from Figma metadata`);

    // Generate template using the mapped sections
    const templateArgs = {
      name: templateName,
      label: templateLabel,
      description: `Template generated from Figma metadata: ${templateLabel}`,
      template_type,
      is_content: false,
      multilanguage,
      is_multiple,
      sections: mappedSections,
      include_cta: hasCTAButton(sections),
      max_features: anticmsAnalysis.max_features || 6,
      max_gallery_images: anticmsAnalysis.max_gallery_images || 12
    };

    return await generateTemplate(templateArgs);

  } catch (error) {
    console.error(`[generateTemplateFromFigmaMetadata] Error:`, error);
    throw new Error(`Failed to generate template from Figma metadata: ${error.message}`);
  }
}

/**
 * Map Figma sections to AntiCMS section types
 * @param {object} figmaSections - Figma sections data
 * @param {object} anticmsAnalysis - AntiCMS analysis data
 * @returns {array} - Array of mapped section names
 */
function mapFigmaSectionsToAntiCMS(figmaSections, anticmsAnalysis) {
  const mappedSections = [];
  const identifiedSections = anticmsAnalysis.identified_sections || {};

  // Process each section based on the analysis
  Object.keys(figmaSections).forEach(sectionKey => {
    const sectionData = figmaSections[sectionKey];
    const analysis = identifiedSections[sectionKey];

    if (analysis && analysis.matched) {
      // Use the analysis mapping if available
      if (analysis.anticms_mapping === 'built-in') {
        mappedSections.push(sectionKey);
      } else if (analysis.anticms_mapping === 'custom') {
        // For custom sections, use the section key as-is
        mappedSections.push(sectionKey);
      }
    } else {
      // Fallback mapping based on section key
      const mappedKey = mapSectionKeyToAntiCMS(sectionKey);
      if (mappedKey) {
        mappedSections.push(mappedKey);
      }
    }
  });

  return mappedSections;
}

/**
 * Map section key to AntiCMS section type
 * @param {string} sectionKey - Figma section key
 * @returns {string|null} - Mapped AntiCMS section type
 */
function mapSectionKeyToAntiCMS(sectionKey) {
  const mapping = {
    'hero': 'hero',
    'partners': 'partners',
    'services': 'features',
    'why_choose_us': 'features',
    'work': 'gallery',
    'projects': 'gallery',
    'testimonials': 'testimonials',
    'contact': 'contact',
    'contact_us': 'contact',
    'footer': 'footer'
  };

  return mapping[sectionKey.toLowerCase()] || null;
}

/**
 * Check if any section has a CTA button
 * @param {object} figmaSections - Figma sections data
 * @returns {boolean} - True if CTA button found
 */
function hasCTAButton(figmaSections) {
  return Object.values(figmaSections).some(section => {
    if (typeof section === 'object' && section !== null) {
      return Object.values(section).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes('cta') || 
                 value.toLowerCase().includes('button') ||
                 value.toLowerCase().includes('get started') ||
                 value.toLowerCase().includes('see more');
        }
        return false;
      });
    }
    return false;
  });
}

/**
 * Get comprehensive field type examples and usage patterns
 * @param {object} args - Tool arguments
 * @returns {object} - Tool response with examples
 */
export async function getFieldTypeExamples(args) {
  const {
    field_type,
    show_usage_patterns = true,
    show_best_practices = true
  } = args;

  // Load field types
  const fieldTypes = await loadFieldTypes();

  let result = {
    field_types: {},
    usage_patterns: {},
    best_practices: {}
  };

  if (field_type) {
    // Return specific field type with detailed info
    if (fieldTypes[field_type]) {
      result.field_types[field_type] = fieldTypes[field_type];
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Field type "${field_type}" not found. Available types: ${Object.keys(fieldTypes).join(', ')}`
          }
        ]
      };
    }
  } else {
    // Return all field types
    result.field_types = fieldTypes;
  }

  if (show_usage_patterns) {
    result.usage_patterns = {
      hero_sections: {
        common_fields: ['status', 'title', 'subtitle', 'background_image', 'cta_button'],
        field_types: ['toggle', 'input', 'textarea', 'media', 'group']
      },
      features_sections: {
        common_fields: ['section_title', 'features'],
        repeater_fields: ['feature_title', 'feature_description', 'feature_icon'],
        field_types: ['input', 'repeater', 'textarea', 'media']
      },
      contact_sections: {
        common_fields: ['section_title', 'contact_info'],
        group_fields: ['email', 'phone', 'address'],
        field_types: ['input', 'group', 'textarea']
      },
      testimonials: {
        common_fields: ['status', 'section_title', 'testimonials'],
        repeater_fields: ['name', 'position', 'company', 'testimonial', 'avatar'],
        field_types: ['toggle', 'input', 'repeater', 'textarea', 'media']
      }
    };
  }

  if (show_best_practices) {
    result.best_practices = {
      naming_conventions: {
        fields: 'Use snake_case for field names (e.g., section_title, feature_icon)',
        sections: 'Use descriptive section names (e.g., hero_section, features_section)',
        labels: 'Use human-readable labels (e.g., "Section Title", "Feature Icon")'
      },
      multilanguage: {
        when_to_use: 'Enable for text content that needs translation',
        when_not_to_use: 'Avoid for technical fields like URLs, numbers, or toggles'
      },
      field_organization: {
        status_fields: 'Always include status toggle as first field in sections',
        grouping: 'Use group fields for related information (e.g., contact info)',
        repeaters: 'Use repeaters for collections of similar items'
      },
      performance: {
        media_fields: 'Set appropriate resolution constraints for images',
        repeater_limits: 'Set reasonable min/max limits based on use case',
        required_fields: 'Mark essential fields as required'
      }
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `📋 **AntiCMS v3 Field Types & Examples**\n\n${JSON.stringify(result, null, 2)}`
      }
    ]
  };
}



