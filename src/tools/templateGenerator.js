import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// AntiCMS v3 Field Type Definitions
export const FIELD_TYPES = {
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