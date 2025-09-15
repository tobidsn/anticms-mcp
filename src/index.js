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
  validateTemplate,
  listFieldTypes,
  generateTemplateFromDescription,
  getFieldTypeExamples,
} from './tools/templateGenerator.js';
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
          sections: z.array(z.string()).describe('Array of section types to include. Built-in types: hero, features, contact, gallery, content_parts, scorecards. Custom section names are also supported.'),
          include_cta: z.boolean().optional().default(false).describe('Include call-to-action in hero section'),
          max_features: z.number().optional().default(6).describe('Maximum number of features'),
          max_gallery_images: z.number().optional().default(12).describe('Maximum number of gallery images'),
          figma_metadata_file: z.string().optional().describe('Path to Figma metadata JSON file for enhanced field detection'),
          is_exclude_sections: z.boolean().optional().default(true).describe('Whether to exclude navigation, footer, and header sections from template generation'),
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

    // Register generate_template_from_description tool
    this.server.registerTool(
      'generate_template_from_description',
      {
        title: 'Generate Template from Description',
        description: 'Generate a template from natural language description',
        inputSchema: {
          description: z.string().describe('Natural language description of the desired template'),
          name: z.string().optional().describe('Template identifier (will be auto-generated if not provided)'),
          label: z.string().optional().describe('Template label (will be auto-generated if not provided)')
        }
      },
      async (args) => {
        return await generateTemplateFromDescription(args);
      }
    );

    // Register get_field_type_examples tool
    this.server.registerTool(
      'get_field_type_examples',
      {
        title: 'Get Field Type Examples',
        description: 'Get comprehensive examples and usage patterns for field types',
        inputSchema: {
          field_type: z.string().optional().describe('Specific field type to get examples for'),
          show_usage_patterns: z.boolean().optional().default(true).describe('Include usage patterns'),
          show_best_practices: z.boolean().optional().default(true).describe('Include best practices')
        }
      },
      async (args) => {
        return await getFieldTypeExamples(args);
      }
    );
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