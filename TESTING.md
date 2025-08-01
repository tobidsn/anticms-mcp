# 🧪 Testing AntiCMS MCP Server

This guide shows how to test the AntiCMS MCP server in various MCP clients.

## 📋 Prerequisites

1. **Install the MCP server locally:**
   ```bash
   npm install
   npm run build  # if needed
   ```

2. **Verify server works:**
   ```bash
   # Test Stdio transport
   npm start
   
   # Test HTTP transport  
   npm run dev
   ```

## 🎯 Testing in Cursor

### Step 1: Configure Cursor

Add this to your Cursor MCP configuration file (usually in `~/.cursor/mcp_servers.json` or project-specific):

```json
{
  "mcpServers": {
    "anticms-mcp": {
      "command": "node",
      "args": [
        "src/index.js",
        "--stdio"
      ],
      "cwd": "/path/to/Anticms-MCP",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Step 2: Test Tools in Cursor

#### 1. **Generate a Landing Page Template**

In Cursor, ask:
```
Generate an AntiCMS v3 landing page template called "product_showcase" with hero, features, and contact sections. Include a call-to-action button.
```

Expected behavior: Cursor should use the `generate_template` tool.

#### 2. **Create a Custom Field**

Ask:
```
Create a media field for product images with these requirements:
- Field name: product_images
- Accept only images
- Resolution: minimum 800x600, maximum 1920x1080
- Allow multiple uploads
```

Expected behavior: Cursor should use the `generate_custom_field` tool.

#### 3. **Validate a Template**

Provide a JSON template and ask:
```
Validate this AntiCMS template and tell me if there are any issues:
[paste JSON template here]
```

Expected behavior: Cursor should use the `validate_template` tool.

### Step 3: Test Resources in Cursor

#### 1. **Access Page Templates**

Ask:
```
Show me the structure of the home page template from the AntiCMS resources.
```

Expected behavior: Cursor should read from `anticms://pages/home`.

#### 2. **Learn from Examples**

Ask:
```
Show me examples of media field configurations and create a new one for profile avatars.
```

Expected behavior: Cursor should access `anticms://field-examples/media`.

#### 3. **Follow Best Practices**

Ask:
```
What are the naming conventions for AntiCMS templates? Create a new template following these guidelines.
```

Expected behavior: Cursor should read `anticms://best-practices/naming-conventions`.

### Step 4: Test Prompts in Cursor

#### 1. **Use Template Creation Prompts**

Ask:
```
Use the create-landing-page prompt to generate a template for an e-commerce store.
```

#### 2. **Learn Field Types**

Ask:
```
Use the learn-field-types prompt to understand repeater fields for a team members section.
```

## 🔧 Testing with MCP Inspector

### Install MCP Inspector

```bash
npm install -g @modelcontextprotocol/inspector
```

### Test Stdio Transport

```bash
# Start the server with stdio
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}' | node src/index.js --stdio
```

### Test HTTP Transport

```bash
# Start HTTP server
npm run dev

# In another terminal, test with inspector
mcp-inspector http://localhost:3000/mcp
```

## 🌐 Testing HTTP API Directly

### 1. **Health Check**

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "server": "anticms-json-generator", 
  "version": "2.0.0",
  "transport": "streamable-http"
}
```

### 2. **Initialize Session**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize", 
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    },
    "id": 1
  }'
```

### 3. **List Tools**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }'
```

### 4. **Call a Tool**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_field_types"
    },
    "id": 3
  }'
```

### 5. **List Resources**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/list",
    "id": 4
  }'
```

### 6. **Read a Resource**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "anticms://field-types/input"
    },
    "id": 5
  }'
```

### 7. **List Prompts**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "prompts/list",
    "id": 6
  }'
```

### 8. **Get a Prompt**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "prompts/get",
    "params": {
      "name": "create-landing-page",
      "arguments": {
        "templateName": "test_landing",
        "sections": "hero, features, contact"
      }
    },
    "id": 7
  }'
```

## 🐛 Common Issues & Solutions

### Issue 1: "Server not found"
**Solution:** Check the file path in your MCP configuration is correct.

### Issue 2: "Permission denied"
**Solution:** Ensure the node process has execute permissions:
```bash
chmod +x src/index.js
```

### Issue 3: "Module not found"
**Solution:** Install dependencies:
```bash
npm install
```

### Issue 4: "Port already in use"
**Solution:** Use a different port:
```bash
node src/index.js --http --port=3001
```

## 📊 Validation Tests

### Test 1: Tool Functionality
```javascript
// Expected tools to be available:
- generate_template
- generate_custom_field  
- validate_template
- list_field_types
```

### Test 2: Resource Access
```javascript
// Expected resources to be accessible:
- anticms://pages/* (all page templates)
- anticms://field-types/* (all field definitions)
- anticms://examples/* (project examples)
- anticms://field-examples/* (field examples)
- anticms://best-practices/* (guidelines)
```

### Test 3: Prompt Templates
```javascript
// Expected prompts to be available:
- create-landing-page
- create-blog-post
- validate-template
- create-field
- check-best-practices
- learn-field-types
```

## 🎯 Example Test Scenarios

### Scenario 1: Create E-commerce Template
1. Use `create-landing-page` prompt
2. Access `anticms://examples/ecommerce-landing` for reference
3. Generate template with `generate_template` tool
4. Validate with `validate_template` tool

### Scenario 2: Learn Media Fields  
1. Use `learn-field-types` prompt with fieldType="media"
2. Access `anticms://field-examples/media` 
3. Create custom media field with `generate_custom_field`
4. Check against `anticms://best-practices/validation-rules`

### Scenario 3: Template Improvement
1. Get existing template from `anticms://pages/home`
2. Use `check-best-practices` prompt
3. Apply recommendations and regenerate
4. Validate the improved template

## 🚀 Performance Testing

### Load Testing HTTP Transport
```bash
# Install artillery for load testing
npm install -g artillery

# Create artillery config
echo '
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/health"
' > load-test.yml

# Run load test
artillery run load-test.yml
```

This comprehensive testing guide covers all aspects of testing the AntiCMS MCP server in various environments and clients. 