#!/usr/bin/env node

import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Import tools and definitions
import {
  generateTemplate,
  generateCustomField,
  validateTemplate,
  listFieldTypes,
  // getRandomQuote, // Disabled for this version
  generateSection,
  assignSectionToTemplate,
  generateNavigation,
  smartGenerate,
  // getAllPages, // Disabled for this version
} from './tools/templateGenerator.js';
import { extractApiKey, extractApiUrl, setApiContext, needsApiContext } from './tools/apiContext.js';
import { registerResources } from './tools/resources.js';
import { registerPrompts } from './tools/prompts.js';

/**
 * AntiCMS v3 JSON Generator MCP Server
 * Supports both Streamable HTTP and Stdio transports
 */
class AntiCMSServer {
  constructor() {
    this.server = new McpServer(
      {
        name: 'anticms-json-generator',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupTools();
    this.setupResources();
    this.setupPrompts();
  }

  /**
   * Setup tools for the MCP server
   */
  setupTools() {
    // Register generate_template tool
    this.server.registerTool(
      'generate_template',
      {
        title: 'Generate Template',
        description: 'Generate a complete AntiCMS v3 template with multiple sections',
        inputSchema: {
          name: z.string().describe('Template identifier (snake_case)'),
          label: z.string().describe('Human-readable template name'),
          description: z.string().optional().describe('Template description'),
          template_type: z.enum(['pages', 'posts']).optional().default('pages').describe('Template type: "pages" for page templates, "posts" for post templates'),
          is_content: z.boolean().optional().default(false).describe('Whether this is a content template'),
          multilanguage: z.boolean().optional().default(true).describe('Enable multilanguage support'),
          is_multiple: z.boolean().optional().default(false).describe('Allow multiple instances'),
          sections: z.array(z.enum(['hero', 'features', 'contact', 'gallery', 'content_parts', 'scorecards'])).describe('Array of section types to include'),
          include_cta: z.boolean().optional().default(false).describe('Include call-to-action in hero section'),
          max_features: z.number().optional().default(6).describe('Maximum number of features'),
          max_gallery_images: z.number().optional().default(12).describe('Maximum number of gallery images')
        }
      },
      async (args) => {
        console.error(`[MCP] generate_template called with args:`, args);
        try {
          const result = await generateTemplate(args);
          console.error(`[MCP] generate_template completed successfully`);
          return result;
        } catch (error) {
          console.error(`[MCP] generate_template error:`, error);
          throw error;
        }
      }
    );

    // Register generate_custom_field tool
    this.server.registerTool(
      'generate_custom_field',
      {
        title: 'Generate Custom Field',
        description: 'Generate a custom field with specific type and attributes',
        inputSchema: {
          name: z.string().describe('Field identifier (snake_case)'),
          label: z.string().describe('Human-readable field label'),
          field_type: z.enum(['input', 'textarea', 'texteditor', 'select', 'toggle', 'media', 'repeater', 'group', 'relationship', 'post_object', 'post_related', 'table']).describe('AntiCMS v3 field type'),
          multilanguage: z.boolean().optional().default(false).describe('Enable multilanguage support'),
          attributes: z.object({}).optional().describe('Field-specific attributes (varies by field type)')
        }
      },
      async (args) => {
        return await generateCustomField(args);
      }
    );

    // Register validate_template tool
    this.server.registerTool(
      'validate_template',
      {
        title: 'Validate Template',
        description: 'Validate an AntiCMS v3 template JSON structure',
        inputSchema: {
          template_json: z.object({}).describe('The template JSON to validate')
        }
      },
      async (args) => {
        return await validateTemplate(args);
      }
    );

    // Register list_field_types tool
    this.server.registerTool(
      'list_field_types',
      {
        title: 'List Field Types',
        description: 'List all supported AntiCMS v3 field types with their attributes',
        inputSchema: {}
      },
      async (args) => {
        return await listFieldTypes(args);
      }
    );

    // Register get_random_quote tool - DISABLED FOR THIS VERSION
    /*
    this.server.registerTool(
      'get_random_quote',
      {
        title: 'Get Random Quote',
        description: 'Get inspirational quotes from Steve Jobs and other famous figures',
        inputSchema: {
          category: z.enum(['steve-jobs', 'design-leaders', 'business', 'creativity']).optional().default('steve-jobs').describe('Category of quotes'),
          figure: z.string().optional().describe('Specific figure to quote (if applicable)')
        }
      },
      async (args) => {
        console.error(`[MCP] get_random_quote called with args:`, args);
        try {
          const result = await getRandomQuote(args);
          console.error(`[MCP] get_random_quote result:`, result);
          return result;
        } catch (error) {
          console.error(`[MCP] get_random_quote error:`, error);
          throw error;
        }
      }
    );
    */

    // Register generate_section tool
    this.server.registerTool(
      'generate_section',
      {
        title: 'Generate Section',
        description: 'Generate a single section component for AntiCMS v3 template',
        inputSchema: {
          section_type: z.enum(['hero', 'features', 'contact', 'gallery', 'content_parts', 'scorecards']).describe('Type of section to generate'),
          key_name: z.string().optional().describe('Custom key name for the section'),
          label: z.string().optional().describe('Custom label for the section'),
          position: z.number().optional().describe('Position/section number'),
          options: z.object({
            include_cta: z.boolean().optional().describe('Include call-to-action in hero section'),
            max_features: z.number().optional().describe('Maximum number of features'),
            max_gallery_images: z.number().optional().describe('Maximum number of gallery images')
          }).optional().describe('Section-specific options')
        }
      },
      async (args) => {
        console.error(`[MCP] generate_section called with args:`, args);
        try {
          const result = await generateSection(args);
          console.error(`[MCP] generate_section completed successfully`);
          return result;
        } catch (error) {
          console.error(`[MCP] generate_section error:`, error);
          throw error;
        }
      }
    );

    // Register assign_section_to_template tool
    this.server.registerTool(
      'assign_section_to_template',
      {
        title: 'Assign Section to Template',
        description: 'Assign a generated section to a template file with position',
        inputSchema: {
          template_file: z.string().describe('Template file name (without .json extension)'),
          section_json: z.string().describe('Section JSON string to assign'),
          position: z.number().optional().describe('Position/section number to assign')
        }
      },
      async (args) => {
        console.error(`[MCP] assign_section_to_template called with args:`, args);
        try {
          const result = await assignSectionToTemplate(args);
          console.error(`[MCP] assign_section_to_template completed successfully`);
          return result;
        } catch (error) {
          console.error(`[MCP] assign_section_to_template error:`, error);
          throw error;
        }
      }
    );

    // Register generate_navigation tool
    this.server.registerTool(
      'generate_navigation',
      {
        title: 'Generate Navigation',
        description: 'Generate JSON AntiCMS v3 navigation/menu/nav',
        inputSchema: {
          name: z.string().describe('Menu name'),
          menu_items: z.array(z.object({
            title: z.union([z.string(), z.object({}).passthrough()]).describe('Menu item title (string or multilingual object)'),
            type: z.enum(['page', 'url', 'post']).optional().default('page').describe('Menu item type'),
            url: z.string().optional().describe('URL for link type items'),
            post_id: z.number().optional().describe('Post ID for post type items'),
            parent_id: z.number().optional().describe('Parent menu item ID for nested items'),
            new_window: z.boolean().optional().default(false).describe('Open in new window'),
            sort: z.number().optional().describe('Sort order (auto-generated if not provided)'),
            image: z.string().optional().describe('Menu item image'),
            children: z.array(z.any()).optional().default([]).describe('Child menu items')
          })).describe('Array of menu items')
        }
      },
      async (args) => {
        console.error(`[MCP] generate_navigation called with args:`, args);
        try {
          const result = await generateNavigation(args);
          console.error(`[MCP] generate_navigation completed successfully`);
          return result;
        } catch (error) {
          console.error(`[MCP] generate_navigation error:`, error);
          throw error;
        }
      }
    );

    // Register smart_generate tool
    this.server.registerTool(
      'smart_generate',
      {
        title: 'Smart Generate from Prompt',
        description: 'Intelligently analyze user prompts and Figma links to automatically generate navigation and templates',
        inputSchema: {
          prompt: z.string().describe('User prompt describing what to generate (e.g., "Create an AntiCMS v3 template called agency")'),
          figma_link: z.string().optional().describe('Figma design link to analyze and extract components from'),
          auto_detect: z.boolean().optional().default(true).describe('Enable automatic detection of generation needs')
        }
      },
      async (args) => {
        console.error(`[MCP] smart_generate called with args:`, args);
        try {
          const result = await smartGenerate(args);
          console.error(`[MCP] smart_generate completed successfully`);
          return result;
        } catch (error) {
          console.error(`[MCP] smart_generate error:`, error);
          throw error;
        }
      }
    );

    // Register get_all_pages tool - DISABLED FOR THIS VERSION
    /*
    this.server.registerTool(
      'get_all_pages',
      {
        title: 'Get All Pages',
        description: 'Fetch all pages from AntiCMS API (supports ANTICMS_ADMIN_URL and ANTICMS_ADMIN_API_KEY HTTP headers)',
        inputSchema: {
          api_url: z.string().optional().describe('AntiCMS API base URL (default from ANTICMS_ADMIN_URL env or HTTP header)'),
          api_key: z.string().optional().describe('API key for authentication (default from ANTICMS_ADMIN_API_KEY env or HTTP header)'),
          use_header: z.boolean().optional().default(true).describe('Use HTTP headers (true) or query parameter (false)'),
          ignore_ssl: z.boolean().optional().default(false).describe('Ignore SSL certificate errors for development/test domains')
        }
      },
      async (args) => {
        console.error(`[MCP] get_all_pages called with args:`, args);
        try {
          // Extract API key and URL using the new context-aware functions
          const apiKey = extractApiKey(args);
          const apiUrl = extractApiUrl(args);
          
          const finalArgs = {
            api_url: apiUrl,
            api_key: apiKey,
            use_header: args.use_header !== undefined ? args.use_header : true,
            ignore_ssl: args.ignore_ssl !== undefined ? args.ignore_ssl : false
          };

          // Validate that we have required parameters
          if (!finalArgs.api_url) {
            const errorMsg = 'API URL is required. Please provide api_url parameter, set ANTICMS_ADMIN_URL environment variable, or use ANTICMS_ADMIN_URL HTTP header.';
            console.error(`[MCP] get_all_pages error: ${errorMsg}`);
            throw new Error(errorMsg);
          }
          
          if (!finalArgs.api_key) {
            const errorMsg = 'API key is required. Please provide api_key parameter, set ANTICMS_ADMIN_API_KEY environment variable, or use ANTICMS_ADMIN_API_KEY HTTP header.';
            console.error(`[MCP] get_all_pages error: ${errorMsg}`);
            throw new Error(errorMsg);
          }
          
          console.error(`[MCP] get_all_pages final args:`, finalArgs);
          const result = await getAllPages(finalArgs);
          console.error(`[MCP] get_all_pages completed successfully`);
          return result;
        } catch (error) {
          console.error(`[MCP] get_all_pages error:`, error);
          throw error;
        }
      }
    );
    */
  }

  /**
   * Start the server with Streamable HTTP transport
   * @param {number} port - Server port
   */
  async startHTTPServer(port = 3000) {
    const app = express();
    
    // Add proper logging middleware
    app.use((req, res, next) => {
      console.error(`[HTTP] ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
    
    // CORS middleware with proper headers
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-Id, mcp-session-id, X-API-Key, ANTICMS_ADMIN_URL, ANTICMS_ADMIN_API_KEY');
      res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    app.use(express.json());

    // Map to store transports by session ID
    const transports = {};

    // Import the isInitializeRequest function
    const { isInitializeRequest } = await import('@modelcontextprotocol/sdk/types.js');

    // Health check endpoint with detailed info
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        server: 'anticms-json-generator',
        version: '2.0.0',
        transport: 'streamable-http',
        timestamp: new Date().toISOString(),
        sessions: Object.keys(transports).length,
        uptime: process.uptime()
      });
    });

    // API info endpoint
    app.get('/', (req, res) => {
      res.json({
        name: 'AntiCMS v3 MCP Server',
        version: '2.0.0',
        transport: 'streamable-http',
        endpoints: {
          mcp: '/mcp',
          health: '/health'
        },
        capabilities: this.server.capabilities
      });
    });

    // Handle POST requests for client-to-server communication
    app.post('/mcp', async (req, res) => {
      try {
        console.error(`[MCP] Processing POST request: ${JSON.stringify(req.body, null, 2)}`);
        
        const sessionId = req.headers['mcp-session-id'];
        
        // Check if this is a tool call that needs API context
        const isToolCall = req.body.method === 'tools/call';
        const toolName = req.body.params?.name;
        
        if (isToolCall && toolName && needsApiContext(toolName)) {
          // Set API context with headers for API tools only
          setApiContext(req.headers, sessionId);
          console.error(`[MCP] API context set for tool: ${toolName}`);
        }
        
        let transport;

        if (sessionId && transports[sessionId]) {
          // Reuse existing transport
          console.error(`[MCP] Reusing existing session: ${sessionId}`);
          transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request
          console.error(`[MCP] Creating new session for initialize request`);
          
          const newSessionId = randomUUID();
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => newSessionId,
            onSessionInitialized: (sessionId) => {
              console.error(`[MCP] Session initialized: ${sessionId}`);
              transports[sessionId] = transport;
            },
            enableDnsRebindingProtection: false,
            allowedHosts: ['127.0.0.1', 'localhost'],
          });

          // Store transport immediately with generated session ID
          transports[newSessionId] = transport;
          console.error(`[MCP] Session stored: ${newSessionId}`);

          // Clean up transport when closed
          transport.onclose = () => {
            if (transport.sessionId) {
              console.error(`[MCP] Session closed: ${transport.sessionId}`);
              delete transports[transport.sessionId];
            }
          };

          await this.server.connect(transport);
        } else {
          console.error(`[MCP] Invalid POST request - sessionId: ${sessionId}, isInitialize: ${isInitializeRequest(req.body)}`);
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided or invalid initialize request',
            },
            id: null,
          });
          return;
        }

        // Handle the request
        await transport.handleRequest(req, res, req.body);
        
      } catch (error) {
        console.error('[MCP] POST request error:', error);
        if (!res.headersSent) {
          res.status(500).json({ 
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
              data: error.message
            },
            id: null
          });
        }
      }
    });

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (req, res) => {
      try {
        const sessionId = req.headers['mcp-session-id'];
        if (!sessionId || !transports[sessionId]) {
          console.error(`[MCP] Invalid ${req.method} request - sessionId: ${sessionId}`);
          res.status(400).send('Invalid or missing session ID');
          return;
        }
        
        console.error(`[MCP] Handling ${req.method} request for session: ${sessionId}`);
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error(`[MCP] ${req.method} request error:`, error);
        res.status(500).send('Internal server error');
      }
    };

    // Handle GET requests for server-to-client notifications via SSE
    app.get('/mcp', handleSessionRequest);

    // Handle DELETE requests for session termination
    app.delete('/mcp', handleSessionRequest);

    return new Promise((resolve) => {
      const httpServer = app.listen(port, () => {
        console.error(`✅ AntiCMS v3 JSON Generator MCP Server running on http://localhost:${port}`);
        console.error(`🏥 Health check: http://localhost:${port}/health`);
        console.error(`📡 MCP endpoint: http://localhost:${port}/mcp`);
        console.error(`📊 API info: http://localhost:${port}/`);
        resolve(httpServer);
      });
    });
  }

  /**
   * Setup MCP Resources
   */
  setupResources() {
    registerResources(this.server);
  }

  /**
   * Setup MCP Prompts
   */
  setupPrompts() {
    registerPrompts(this.server);
  }

  /**
   * Start the server with Stdio transport
   */
  async startStdioServer() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AntiCMS v3 JSON Generator MCP Server running on stdio');
  }
}

/**
 * Main function to start the server
 * Supports both HTTP and Stdio modes based on command line arguments
 */
async function main() {
  const args = process.argv.slice(2);
  const server = new AntiCMSServer();

  // Check for HTTP mode flag
  if (args.includes('--http') || process.env.MCP_TRANSPORT === 'http') {
    const portArg = args.find(arg => arg.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1]) : 3000;
    
    await server.startHTTPServer(port);
  } else {
    // Default to stdio transport
    await server.startStdioServer();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down AntiCMS v3 JSON Generator MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\nShutting down AntiCMS v3 JSON Generator MCP Server...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
}); 