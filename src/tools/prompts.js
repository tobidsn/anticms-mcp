// Zod for schema validation
import { z } from 'zod';

/**
 * MCP Prompts for AntiCMS v3
 * Provides structured prompt templates for consistent LLM interactions
 */

/**
 * Register all prompt templates with the server
 * @param {Object} server - MCP Server instance
 */
export function registerPrompts(server) {
  // Template creation prompts
  registerTemplatePrompts(server);
  
  // Field creation prompts
  registerFieldPrompts(server);
  
  // Validation prompts
  registerValidationPrompts(server);
  
  // Best practices prompts
  registerBestPracticesPrompts(server);
}

/**
 * Register template creation prompts
 * @param {Object} server - MCP Server instance
 */
function registerTemplatePrompts(server) {
  // Landing page template prompt
  server.registerPrompt(
    "create-landing-page",
    {
      title: "Create Landing Page",
      description: "Generate a complete landing page template with specified sections",
      argsSchema: {
        templateName: z.string().describe("The name of the template (e.g., 'product_landing')"),
        sections: z.string().describe("Comma-separated list of sections (e.g., 'hero, features, contact')"),
        includeCTA: z.string().optional().describe("Whether to include a call-to-action button in the hero section")
      }
    },
    async (request) => {
      const { templateName, sections, includeCTA = "true" } = request;
      
      return {
        description: "Generate a complete landing page template with specified sections",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create an AntiCMS v3 template for a landing page called '${templateName}' with the following sections: ${sections}. ${includeCTA === "true" ? "Include a call-to-action button in the hero section." : "Do not include a call-to-action button."} 

Use the AntiCMS MCP tools to generate a complete template with proper field types, validation, and multilanguage support. Follow these requirements:

1. Template name: ${templateName}
2. Sections to include: ${sections}
3. Use appropriate field types for each content element
4. Enable multilanguage for user-visible content
5. Add proper validation and placeholders
6. Follow AntiCMS naming conventions (snake_case)

Generate the complete JSON template using the generate_template tool.`
            }
          }
        ]
      };
    }
  );

  // Blog post template prompt
  server.registerPrompt(
    "create-blog-post",
    {
      title: "Create Blog Post",
      description: "Generate blog post templates with standard blog fields",
      argsSchema: {
        templateName: z.string().describe("The template name (e.g., 'blog_post')"),
        sections: z.string().describe("Required sections (e.g., 'hero, content, author')"),
        optionalSections: z.string().optional().describe("Optional sections to include")
      }
    },
    async (request) => {
      const { templateName, sections, optionalSections = "" } = request;
      
      return {
        description: "Generate blog post templates with standard blog fields",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create an AntiCMS v3 blog post template with the following specifications:

Template name: ${templateName}
Content type: Blog post
Sections: ${sections}

Required fields:
- Title (input, multilanguage, required)
- Content (texteditor, multilanguage, required)
- Featured image (media, image only)
- Author (input, multilanguage)
- Publish date (input, date type)
- Tags (repeater with tag input)

Optional sections: ${optionalSections}

Generate a complete JSON template that follows AntiCMS v3 schema using the MCP tools available.`
            }
          }
        ]
      };
    }
  );

  // Template validation prompt
  server.registerPrompt(
    "validate-template",
    {
      title: "Validate Template",
      description: "Validate templates and provide improvement suggestions",
      argsSchema: {
        templateJson: z.string().describe("The JSON template to validate")
      }
    },
    async (request) => {
      const { templateJson } = request;
      
      return {
        description: "Validate templates and provide improvement suggestions",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Analyze and validate this AntiCMS v3 template:

Template JSON:
${templateJson}

Please use the validate_template tool to check this template and provide:
1. Validation status (valid/invalid)
2. List of errors (if any)
3. Suggestions for improvement
4. Best practices recommendations
5. Performance optimizations

Focus on:
- Schema compliance
- Naming conventions
- Field configurations
- Multilanguage setup
- Validation rules`
            }
          }
        ]
      };
    }
  );
}

/**
 * Register field creation prompts
 * @param {Object} server - MCP Server instance
 */
function registerFieldPrompts(server) {
  // Custom field generator prompt
  server.registerPrompt(
    "create-field",
    {
      title: "Create Field",
      description: "Generate a custom field with specific requirements",
      argsSchema: {
        fieldName: z.string().describe("Name of the field (e.g., 'product_price')"),
        fieldType: z.string().describe("Type of field (e.g., 'input', 'textarea', 'media')"),
        requirements: z.string().describe("Specific requirements for the field")
      }
    },
    async (request) => {
      const { fieldName, fieldType, requirements } = request;
      
      return {
        description: "Generate a custom field with specific requirements",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create a custom AntiCMS field called '${fieldName}' of type '${fieldType}'. 

Requirements: ${requirements}

Use the generate_custom_field tool to create this field with appropriate attributes, validation, and configuration. Ensure the field follows AntiCMS naming conventions and best practices.`
            }
          }
        ]
      };
    }
  );

}

/**
 * Register validation prompts
 * @param {Object} server - MCP Server instance
 */
function registerValidationPrompts(server) {
  // Best practices checker prompt
  server.registerPrompt(
    "check-best-practices",
    {
      title: "Check Best Practices",
      description: "Review templates against AntiCMS best practices",
      argsSchema: {
        templateJson: z.string().describe("The JSON template to review")
      }
    },
    async (request) => {
      const { templateJson } = request;
      
      return {
        description: "Review templates against AntiCMS best practices",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Review this AntiCMS v3 template against best practices:

Template: ${templateJson}

Check for:
1. Naming conventions (snake_case)
2. Required field validation
3. Multilanguage configuration
4. Field type appropriateness
5. Component organization
6. Performance considerations

Use the available resources (anticms://best-practices/*) to get the latest guidelines and provide specific recommendations for improvement. Then use the validate_template tool to check compliance.`
            }
          }
        ]
      };
    }
  );
}

/**
 * Register best practices prompts
 * @param {Object} server - MCP Server instance
 */
function registerBestPracticesPrompts(server) {
  // Learn from examples prompt
  server.registerPrompt(
    "learn-field-types",
    {
      title: "Learn Field Types",
      description: "Learn about field types and create new fields based on examples",
      argsSchema: {
        fieldType: z.string().describe("Field type to learn about"),
        useCase: z.string().describe("Specific use case or requirement")
      }
    },
    async (request) => {
      const { fieldType, useCase } = request;
      
      return {
        description: "Learn about field types and create new fields based on examples",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `I want to learn about the '${fieldType}' field type in AntiCMS v3 for this use case: ${useCase}

Please:
1. Show me examples of '${fieldType}' fields from anticms://field-examples/${fieldType}
2. Read the field type definition from anticms://field-types/${fieldType} if available
3. Create a new field configuration based on the examples that fits my use case
4. Explain the key attributes and their purposes
5. Generate the field using generate_custom_field tool

Make sure to follow the best practices and explain why certain attributes are chosen for this specific use case.`
            }
          }
        ]
      };
    }
  );
} 