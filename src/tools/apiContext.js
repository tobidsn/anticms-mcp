/**
 * API Context Manager
 * Handles HTTP headers and context for API tools
 */

// Global context to store HTTP headers
let globalApiContext = {
  headers: {},
  sessionId: null
};

/**
 * Set the global API context with headers and session ID
 * @param {object} headers - HTTP headers
 * @param {string} sessionId - Session ID
 */
export function setApiContext(headers, sessionId) {
  globalApiContext = {
    headers: headers || {},
    sessionId: sessionId
  };
  console.error(`[MCP] API context set for session: ${sessionId}`);
}

/**
 * Get the current API context
 * @returns {object} Current API context
 */
export function getApiContext() {
  return globalApiContext;
}

/**
 * Extract API key from multiple sources (specific for API tools)
 * @param {object} args - Tool arguments
 * @returns {string|null} API key or null if not found
 */
export function extractApiKey(args) {
  // Priority order:
  // 1. Explicit api_key parameter
  // 2. ANTICMS_ADMIN_API_KEY HTTP header
  // 3. ANTICMS_ADMIN_API_KEY environment variable
  
  if (args.api_key) {
    return args.api_key;
  }
  
  // Check global context for HTTP headers
  const globalContext = getApiContext();
  if (globalContext.headers) {
    const headerApiKey = globalContext.headers['anticms_admin_api_key'] ||
                        globalContext.headers['anticms-admin-api-key'] || 
                        globalContext.headers['ANTICMS_ADMIN_API_KEY'] ||
                        globalContext.headers['x-api-key'] || 
                        globalContext.headers['X-API-Key'];
    if (headerApiKey) {
      console.error(`[MCP] Using API key from HTTP header for API tool`);
      return headerApiKey;
    }
  }
  
  // Fall back to environment variable
  const envApiKey = process.env.ANTICMS_ADMIN_API_KEY;
  if (envApiKey) {
    console.error(`[MCP] Using API key from environment variable for API tool`);
    return envApiKey;
  }
  
  return null;
}

/**
 * Extract API URL from multiple sources (specific for API tools)
 * @param {object} args - Tool arguments
 * @returns {string|null} API URL or null if not found
 */
export function extractApiUrl(args) {
  // Priority order:
  // 1. Explicit api_url parameter
  // 2. ANTICMS_ADMIN_URL HTTP header
  // 3. ANTICMS_ADMIN_URL environment variable
  
  if (args.api_url) {
    return args.api_url;
  }
  
  // Check global context for HTTP headers
  const globalContext = getApiContext();
  
  if (globalContext.headers) {
    const headerApiUrl = globalContext.headers['anticms_admin_url'] || 
                        globalContext.headers['anticms-admin-url'] || 
                        globalContext.headers['ANTICMS_ADMIN_URL'];
    if (headerApiUrl) {
      console.error(`[MCP] Using API URL from HTTP header for API tool`);
      return headerApiUrl;
    }
  }
  
  // Fall back to environment variable
  const envApiUrl = process.env.ANTICMS_ADMIN_URL;
  if (envApiUrl) {
    console.error(`[MCP] Using API URL from environment variable for API tool`);
    return envApiUrl;
  }
  
  return null;
}

/**
 * Check if a tool needs API context
 * @param {string} toolName - Name of the tool
 * @returns {boolean} True if tool needs API context
 */
export function needsApiContext(toolName) {
  const apiTools = ['get_all_pages', 'get_pages', 'fetch_pages'];
  return apiTools.includes(toolName);
} 