import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

/**
 * ResourceTemplate class for handling templated resources
 */
class ResourceTemplate {
  constructor(uriTemplate, callbacks) {
    this.uriTemplate = uriTemplate;
    this.callbacks = callbacks;
  }
}

/**
 * MCP Resources for AntiCMS v3
 * Provides access to JSON resource files and examples
 */

/**
 * Load resources from data folder and register them with the server
 * @param {Object} server - MCP Server instance
 */
export function registerResources(server) {
  // Register file-based resources from data folder
  registerFileBasedResources(server);
  
  // Register real project examples
  registerProjectExamples(server);
  
  // Register field type examples
  registerFieldExamples(server);
  
  // Register best practices resources
  registerBestPractices(server);
}

/**
 * Register file-based resources from the data folder
 * @param {Object} server - MCP Server instance
 */
function registerFileBasedResources(server) {
  const resourceTypes = ['pages', 'posts', 'field-types'];
  
  resourceTypes.forEach(type => {
    // Register individual resource files
    const dataDir = join(process.cwd(), 'data', type);
    if (existsSync(dataDir)) {
      const files = readdirSync(dataDir).filter(file => extname(file) === '.json');
      
      files.forEach(file => {
        const resourceName = file.replace('.json', '');
        const filePath = join(dataDir, file);
        
        server.registerResource(
          `${type}-${resourceName}`,
          `anticms://${type}/${resourceName}`,
          {
            title: `${resourceName.replace(/_/g, ' ')}`,
            description: `AntiCMS ${type} resource: ${resourceName}`,
            mimeType: "application/json"
          },
          async (uri) => {
            const content = readFileSync(filePath, 'utf8');
            return {
              contents: [{
                uri: uri,
                text: content,
                mimeType: "application/json"
              }]
            };
          }
        );
      });
    }
  });
}

/**
 * Register real project examples as resources
 * @param {Object} server - MCP Server instance
 */
function registerProjectExamples(server) {
  const examples = getProjectExamples();
  
  Object.keys(examples).forEach(projectType => {
    server.registerResource(
      `example-${projectType}`,
      `anticms://examples/${projectType}`,
      {
        title: `${projectType.replace(/-/g, ' ')} Example`,
        description: `${projectType.replace(/-/g, ' ')} project template example`,
        mimeType: "application/json"
      },
      async (uri) => {
        const project = examples[projectType];
        return {
          contents: [{
            uri: uri,
            text: JSON.stringify(project, null, 2),
            mimeType: "application/json"
          }]
        };
      }
    );
  });
}

/**
 * Register field type examples as resources
 * @param {Object} server - MCP Server instance
 */
function registerFieldExamples(server) {
  const examples = getFieldTypeExamples();
  
  Object.keys(examples).forEach(fieldType => {
    server.registerResource(
      `field-example-${fieldType}`,
      `anticms://field-examples/${fieldType}`,
      {
        title: `${fieldType} Field Examples`,
        description: `Examples for ${fieldType} field type`,
        mimeType: "application/json"
      },
      async (uri) => {
        const fieldExamples = examples[fieldType];
        return {
          contents: [{
            uri: uri,
            text: JSON.stringify(fieldExamples, null, 2),
            mimeType: "application/json"
          }]
        };
      }
    );
  });
}

/**
 * Register best practices as resources
 * @param {Object} server - MCP Server instance
 */
function registerBestPractices(server) {
  const practices = getBestPractices();
  
  Object.keys(practices).forEach(practiceType => {
    server.registerResource(
      `best-practice-${practiceType}`,
      `anticms://best-practices/${practiceType}`,
      {
        title: `${practiceType.replace(/-/g, ' ')} Best Practices`,
        description: `Best practices for ${practiceType.replace(/-/g, ' ')}`,
        mimeType: "application/json"
      },
      async (uri) => {
        const practice = practices[practiceType];
        return {
          contents: [{
            uri: uri,
            text: JSON.stringify(practice, null, 2),
            mimeType: "application/json"
          }]
        };
      }
    );
  });
}

/**
 * Get project examples data
 * @returns {Object} Project examples
 */
function getProjectExamples() {
  return {
    "ecommerce-landing": {
      name: "ecommerce_landing",
      label: "E-commerce Landing Page",
      description: "Complete e-commerce landing page template with product showcase",
      is_content: false,
      multilanguage: true,
      is_multiple: false,
      components: [
        {
          keyName: "hero",
          label: "Hero Section",
          section: "1",
          fields: [
            {
              name: "store_name",
              label: "Store Name",
              field: "input",
              multilanguage: true,
              attribute: {
                type: "text",
                is_required: true,
                placeholder: "Your Store Name",
                maxLength: 100
              }
            },
            {
              name: "hero_title",
              label: "Hero Title",
              field: "input",
              multilanguage: true,
              attribute: {
                type: "text",
                is_required: true,
                placeholder: "Welcome to our store",
                maxLength: 120
              }
            },
            {
              name: "hero_subtitle",
              label: "Hero Subtitle",
              field: "textarea",
              multilanguage: true,
              attribute: {
                rows: 3,
                max: 200,
                placeholder: "Discover amazing products"
              }
            },
            {
              name: "hero_image",
              label: "Hero Image",
              field: "media",
              attribute: {
                accept: ["image"],
                resolution: {
                  minWidth: 1200,
                  maxWidth: 1920,
                  minHeight: 600,
                  maxHeight: 1080
                }
              }
            },
            {
              name: "cta_button",
              label: "Call to Action",
              field: "group",
              attribute: {
                fields: [
                  {
                    name: "label",
                    label: "Button Label",
                    field: "input",
                    multilanguage: true,
                    attribute: {
                      type: "text",
                      placeholder: "Shop Now"
                    }
                  },
                  {
                    name: "url",
                    label: "URL",
                    field: "input",
                    attribute: {
                      type: "url",
                      placeholder: "/products"
                    }
                  }
                ]
              }
            }
          ]
        },
        {
          keyName: "featured_products",
          label: "Featured Products",
          section: "2",
          fields: [
            {
              name: "section_title",
              label: "Section Title",
              field: "input",
              multilanguage: true,
              attribute: {
                type: "text",
                placeholder: "Featured Products"
              }
            },
            {
              name: "products",
              label: "Products",
              field: "repeater",
              attribute: {
                min: 1,
                max: 8,
                fields: [
                  {
                    name: "product_name",
                    label: "Product Name",
                    field: "input",
                    multilanguage: true,
                    attribute: {
                      type: "text",
                      is_required: true,
                      placeholder: "Product name"
                    }
                  },
                  {
                    name: "product_price",
                    label: "Price",
                    field: "input",
                    attribute: {
                      type: "number",
                      placeholder: "99.99",
                      min: 0
                    }
                  },
                  {
                    name: "product_image",
                    label: "Product Image",
                    field: "media",
                    attribute: {
                      accept: ["image"]
                    }
                  },
                  {
                    name: "product_description",
                    label: "Description",
                    field: "textarea",
                    multilanguage: true,
                    attribute: {
                      rows: 3,
                      max: 200,
                      placeholder: "Product description"
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    "restaurant-website": {
      name: "restaurant_website",
      label: "Restaurant Website",
      description: "Complete restaurant website with menu, reservations, and gallery",
      is_content: false,
      multilanguage: true,
      is_multiple: false,
      components: [
        {
          keyName: "hero",
          label: "Hero Section",
          section: "1",
          fields: [
            {
              name: "restaurant_name",
              label: "Restaurant Name",
              field: "input",
              multilanguage: true,
              attribute: {
                type: "text",
                is_required: true,
                placeholder: "Restaurant Name"
              }
            },
            {
              name: "hero_image",
              label: "Hero Image",
              field: "media",
              attribute: {
                accept: ["image"]
              }
            },
            {
              name: "tagline",
              label: "Tagline",
              field: "textarea",
              multilanguage: true,
              attribute: {
                rows: 2,
                placeholder: "Restaurant tagline"
              }
            },
            {
              name: "reservation_button",
              label: "Reservation Button",
              field: "group",
              attribute: {
                fields: [
                  {
                    name: "label",
                    label: "Button Label",
                    field: "input",
                    multilanguage: true,
                    attribute: {
                      type: "text",
                      placeholder: "Make Reservation"
                    }
                  },
                  {
                    name: "url",
                    label: "URL",
                    field: "input",
                    attribute: {
                      type: "url",
                      placeholder: "/reservations"
                    }
                  }
                ]
              }
            }
          ]
        },
        {
          keyName: "menu",
          label: "Menu Section",
          section: "2",
          fields: [
            {
              name: "menu_title",
              label: "Menu Title",
              field: "input",
              multilanguage: true,
              attribute: {
                type: "text",
                placeholder: "Our Menu"
              }
            },
            {
              name: "menu_categories",
              label: "Menu Categories",
              field: "repeater",
              attribute: {
                min: 1,
                max: 10,
                fields: [
                  {
                    name: "category_name",
                    label: "Category Name",
                    field: "input",
                    multilanguage: true,
                    attribute: {
                      type: "text",
                      is_required: true,
                      placeholder: "Appetizers"
                    }
                  },
                  {
                    name: "menu_items",
                    label: "Menu Items",
                    field: "repeater",
                    attribute: {
                      min: 1,
                      max: 20,
                      fields: [
                        {
                          name: "item_name",
                          label: "Item Name",
                          field: "input",
                          multilanguage: true,
                          attribute: {
                            type: "text",
                            is_required: true
                          }
                        },
                        {
                          name: "item_description",
                          label: "Description",
                          field: "textarea",
                          multilanguage: true,
                          attribute: {
                            rows: 2
                          }
                        },
                        {
                          name: "item_price",
                          label: "Price",
                          field: "input",
                          attribute: {
                            type: "number",
                            placeholder: "0.00"
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  };
}

/**
 * Get field type examples data
 * @returns {Object} Field type examples
 */
function getFieldTypeExamples() {
  return {
    "input": {
      "basic_text": {
        name: "title",
        label: "Title",
        field: "input",
        attribute: {
          type: "text",
          is_required: true,
          placeholder: "Enter title",
          maxLength: 100
        }
      },
      "email_field": {
        name: "email",
        label: "Email Address",
        field: "input",
        attribute: {
          type: "email",
          is_required: true,
          placeholder: "user@example.com"
        }
      },
      "number_field": {
        name: "price",
        label: "Price",
        field: "input",
        attribute: {
          type: "number",
          placeholder: "0.00",
          min: 0
        }
      },
      "url_field": {
        name: "website",
        label: "Website URL",
        field: "input",
        attribute: {
          type: "url",
          placeholder: "https://example.com"
        }
      }
    },
    "media": {
      "image_upload": {
        name: "featured_image",
        label: "Featured Image",
        field: "media",
        attribute: {
          accept: ["image"],
          resolution: {
            minWidth: 800,
            maxWidth: 1920,
            minHeight: 600,
            maxHeight: 1080
          }
        }
      },
      "document_upload": {
        name: "document",
        label: "Document",
        field: "media",
        attribute: {
          accept: ["document"]
        }
      },
      "video_upload": {
        name: "video",
        label: "Video",
        field: "media",
        attribute: {
          accept: ["video"]
        }
      }
    },
    "repeater": {
      "team_members": {
        name: "team_members",
        label: "Team Members",
        field: "repeater",
        attribute: {
          min: 1,
          max: 10,
          fields: [
            {
              name: "name",
              label: "Name",
              field: "input",
              multilanguage: true,
              attribute: {
                type: "text",
                is_required: true,
                placeholder: "Full name"
              }
            },
            {
              name: "position",
              label: "Position",
              field: "input",
              multilanguage: true,
              attribute: {
                type: "text",
                placeholder: "Job title"
              }
            },
            {
              name: "bio",
              label: "Bio",
              field: "textarea",
              multilanguage: true,
              attribute: {
                rows: 4,
                max: 300,
                placeholder: "Short bio"
              }
            },
            {
              name: "photo",
              label: "Photo",
              field: "media",
              attribute: {
                accept: ["image"]
              }
            }
          ]
        }
      }
    }
  };
}

/**
 * Get best practices data
 * @returns {Object} Best practices
 */
function getBestPractices() {
  return {
    "naming-conventions": {
      title: "AntiCMS Naming Conventions",
      description: "Best practices for naming fields and components",
      guidelines: {
        field_names: {
          pattern: "snake_case",
          examples: ["hero_title", "feature_description", "contact_email"],
          rules: [
            "Use lowercase letters",
            "Separate words with underscores",
            "Be descriptive but concise",
            "Avoid special characters except underscores"
          ]
        },
        component_names: {
          pattern: "snake_case",
          examples: ["hero", "features", "contact_form"],
          rules: [
            "Use descriptive names that indicate purpose",
            "Use descriptive names for page sections",
            "End with '_form' for form components"
          ]
        },
        template_names: {
          pattern: "snake_case",
          examples: ["home_page", "about_page", "blog_post"],
          rules: [
            "Use descriptive names",
            "End with '_page' for page templates",
            "End with '_post' for post templates"
          ]
        }
      },
      validation: {
        required_fields: "Always set is_required for important fields",
        multilanguage: "Enable multilanguage for content fields",
        placeholders: "Provide helpful placeholder text",
        validation: "Set appropriate validation rules"
      }
    },
    "validation-rules": {
      title: "Field Validation Best Practices",
      description: "Guidelines for setting up proper field validation",
      rules: {
        input_fields: {
          text: {
            maxLength: "Set reasonable character limits (e.g., 100 for titles, 200 for descriptions)",
            minLength: "Use for required content (e.g., min 3 for names)",
            is_required: "Mark essential fields as required"
          },
          email: {
            validation: "Use type: 'email' for automatic validation",
            is_required: "Usually required for contact forms"
          },
          number: {
            min: "Set minimum value (e.g., 0 for prices)",
            max: "Set maximum value where applicable"
          }
        },
        textarea_fields: {
          rows: "Use 3-4 rows for short content, 6-8 for longer content",
          max: "Set character limits (e.g., 500 for descriptions, 2000 for content)"
        },
        media_fields: {
          accept: "Specify exact file types needed",
          resolution: "Set appropriate size constraints for images",
          file_size: "Consider setting file size limits"
        }
      }
    },
    "component-structure": {
      title: "Component Structure Guidelines",
      description: "Best practices for organizing components and fields",
      structure: {
        sections: {
          order: "Organize sections logically (hero, content, features, contact)",
          numbering: "Use sequential section numbers ('1', '2', '3')",
          naming: "Use descriptive keyName values"
        },
        fields: {
          grouping: "Group related fields together",
          order: "Place required fields first",
          hierarchy: "Use groups and repeaters for complex data"
        },
        multilanguage: {
          content_fields: "Enable for user-visible text",
          technical_fields: "Disable for URLs, numbers, technical data",
          consistency: "Be consistent across similar field types"
        }
      }
    },
    "multilanguage-setup": {
      title: "Multilanguage Configuration Best Practices",
      description: "Guidelines for setting up multilanguage support",
      guidelines: {
        when_to_enable: [
          "All user-visible text content",
          "Titles and headings",
          "Descriptions and captions",
          "Button labels",
          "Form labels"
        ],
        when_to_disable: [
          "URLs and links",
          "Numbers and prices",
          "File uploads",
          "Technical identifiers",
          "API endpoints"
        ],
        best_practices: [
          "Be consistent across similar field types",
          "Consider your target audience",
          "Plan for translation workflow",
          "Test with longer text (German, Finnish)",
          "Consider RTL languages if applicable"
        ]
      }
    }
  };
} 