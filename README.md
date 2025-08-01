# AntiCMS v3 JSON Generator MCP Server

A Model Context Protocol (MCP) server for generating AntiCMS v3 JSON component templates with validation and field type support. Now supports both **Streamable HTTP** and **Stdio** transports for maximum compatibility.

## 🚀 Features

- **Generate complete AntiCMS v3 templates** with multiple sections (hero, features, contact, gallery)
- **Custom field generation** with all supported AntiCMS v3 field types
- **Template validation** with comprehensive error reporting
- **Field type reference** with complete documentation
- **MCP Resources**: Access JSON resource files and examples via `anticms://` URIs
- **MCP Prompts**: Structured prompt templates for consistent LLM interactions
- **Dual transport support**: Streamable HTTP and Stdio
- **Session management** for HTTP transport
- **Health check endpoint** for monitoring
- **CORS support** for browser compatibility

## 📁 Project Structure

```
Anticms-MCP/
├── src/
│   ├── index.js              # Main MCP server with dual transport support
│   └── tools/
│       ├── templateGenerator.js  # Core template generation logic
│       └── definitions.js       # Tool definitions for MCP
├── data/
│   └── field-types/          # JSON resource files for all field types
│       ├── index.json        # Field types index
│       ├── input.json        # Input field examples and docs
│       ├── textarea.json     # Textarea field examples and docs
│       ├── texteditor.json   # Text editor field examples and docs
│       ├── select.json       # Select field examples and docs
│       ├── toggle.json       # Toggle field examples and docs
│       ├── media.json        # Media field examples and docs
│       ├── repeater.json     # Repeater field examples and docs
│       ├── group.json        # Group field examples and docs
│       ├── relationship.json # Relationship field examples and docs
│       ├── post-object.json  # Post object field examples and docs
│       ├── post-related.json # Post related field examples and docs
│       └── table.json        # Table field examples and docs
├── package.json
└── README.md
```

## 🛠 Installation

### From NPM

```bash
npm install -g @tobidsn/anticms-mcp
```

### From Source

```bash
git clone https://github.com/tobidsn/anticms-mcp.git
cd anticms-mcp
npm install
```

## 🎯 Usage

The server supports two transport modes:

### 1. Streamable HTTP Transport (Recommended)

Start the HTTP server:

```bash
# Default port 3000
npm run dev

# Custom port
npm run start:http:port

# Or directly
node src/index.js --http --port=3001
```

Access the server:
- **Health check**: `http://localhost:3000/health`
- **MCP endpoint**: `http://localhost:3000/mcp`
- **API documentation**: Available via health check endpoint

### 2. Stdio Transport (Traditional)

```bash
# Default stdio mode
npm start

# Or directly
node src/index.js
```

### Environment Variables

```bash
# Force HTTP transport
export MCP_TRANSPORT=http

# Or use command line flags
node src/index.js --http --port=3000
```

## 🔧 Configuration

### MCP Client Configuration

For **Claude Desktop** or other MCP clients using stdio:

```json
{
  "mcpServers": {
    "anticms-generator": {
      "command": "npx",
      "args": ["@tobidsn/anticms-mcp"]
    }
  }
}
```

For **HTTP-based clients**:

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client({
  name: "anticms-client",
  version: "1.0.0"
});

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp")
);

await client.connect(transport);
```

## 🛠 Available Tools

### 1. `generate_template`

Generate a complete AntiCMS v3 template with multiple sections.

**Parameters:**
- `name` (string, required): Template identifier (snake_case)
- `label` (string, required): Human-readable template name  
- `sections` (array, required): Section types to include (`["hero", "features", "contact", "gallery"]`)
- `description` (string): Template description
- `is_content` (boolean): Whether this is a content template (default: false)
- `multilanguage` (boolean): Enable multilanguage support (default: true)
- `is_multiple` (boolean): Allow multiple instances (default: false)
- `include_cta` (boolean): Include call-to-action in hero section (default: false)
- `max_features` (number): Maximum number of features (default: 6)
- `max_gallery_images` (number): Maximum number of gallery images (default: 12)

**Example:**
```json
{
  "name": "landing_page",
  "label": "Landing Page",
  "sections": ["hero", "features", "contact"],
  "include_cta": true,
  "max_features": 8
}
```

### 2. `generate_custom_field`

Generate a custom field with specific type and attributes.

**Parameters:**
- `name` (string, required): Field identifier (snake_case)
- `label` (string, required): Human-readable field label
- `field_type` (string, required): AntiCMS v3 field type
- `multilanguage` (boolean): Enable multilanguage support (default: false)
- `attributes` (object): Field-specific attributes

**Example:**
```json
{
  "name": "product_title",
  "label": "Product Title", 
  "field_type": "input",
  "multilanguage": true,
  "attributes": {
    "inputType": "text",
    "is_required": true,
    "maxLength": 100
  }
}
```

### 3. `validate_template`

Validate an AntiCMS v3 template JSON structure.

**Parameters:**
- `template_json` (object, required): The template JSON to validate

### 4. `list_field_types`

List all supported AntiCMS v3 field types with their attributes.

**Parameters:** None

## 📂 MCP Resources

The server provides access to structured data via MCP Resources using `anticms://` URIs:

### Available Resource Types

#### 1. **File-based Resources** (`data/` folder)
- `anticms://pages/{name}` - Page template JSON files
- `anticms://posts/{name}` - Post template JSON files  
- `anticms://field-types/{name}` - Field type definition files

#### 2. **Project Examples**
- `anticms://examples/ecommerce-landing` - E-commerce landing page template
- `anticms://examples/restaurant-website` - Restaurant website template

#### 3. **Field Type Examples**
- `anticms://field-examples/input` - Input field configuration examples
- `anticms://field-examples/media` - Media field configuration examples
- `anticms://field-examples/repeater` - Repeater field configuration examples
- (All field types available)

#### 4. **Best Practices**
- `anticms://best-practices/naming-conventions` - Naming convention guidelines
- `anticms://best-practices/validation-rules` - Field validation best practices
- `anticms://best-practices/component-structure` - Component organization guidelines
- `anticms://best-practices/multilanguage-setup` - Multilanguage configuration guide

### Using Resources

```javascript
// Read a specific page template
const homeTemplate = await client.readResource({
  uri: "anticms://pages/home"
});

// Access field examples
const mediaExamples = await client.readResource({
  uri: "anticms://field-examples/media"
});

// Get best practices
const namingConventions = await client.readResource({
  uri: "anticms://best-practices/naming-conventions"
});
```

## 💬 MCP Prompts

Structured prompt templates for consistent LLM interactions:

### Available Prompts

#### 1. **Template Creation Prompts**

- **`create-landing-page`** - Generate landing page templates
  - Arguments: `templateName`, `sections`, `includeCTA`
  
- **`create-blog-post`** - Generate blog post templates  
  - Arguments: `templateName`, `sections`, `optionalSections`

- **`validate-template`** - Validate template structure
  - Arguments: `templateJson`

#### 2. **Field Creation Prompts**

- **`create-field`** - Generate custom fields
  - Arguments: `fieldName`, `fieldType`, `requirements`

#### 3. **Best Practices Prompts**

- **`check-best-practices`** - Review template compliance
  - Arguments: `templateJson`

- **`learn-field-types`** - Learn about field types with examples
  - Arguments: `fieldType`, `useCase`

### Using Prompts

```javascript
// Generate a landing page template
const landingPagePrompt = await client.getPrompt({
  name: "create-landing-page",
  arguments: {
    templateName: "product_landing",
    sections: "hero, features, contact",
    includeCTA: "true"
  }
});

// Learn about media fields
const fieldLearningPrompt = await client.getPrompt({
  name: "learn-field-types", 
  arguments: {
    fieldType: "media",
    useCase: "product image upload with size constraints"
  }
});
```

## 📚 Supported Field Types

The server supports all AntiCMS v3 field types:

### Basic Fields
- **input**: Text, number, email, URL inputs
- **textarea**: Multi-line text input
- **texteditor**: WYSIWYG rich text editor (full/simple)
- **select**: Dropdown selection
- **toggle**: Boolean on/off switch

### Media Fields  
- **media**: Modern media upload (images, videos, audio, documents)

### Complex Fields
- **repeater**: Repeatable groups of fields
- **group**: Single, non-repeatable field groups  
- **table**: Tabular data with custom columns

### Relationship Fields
- **relationship**: Post relationships with filters
- **post_object**: Post object selection
- **post_related**: Post related configuration

## 🌐 HTTP API Examples

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "server": "anticms-json-generator", 
  "version": "2.0.0",
  "transport": "streamable-http"
}
```

### Generate Template via HTTP

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call", 
    "params": {
      "name": "generate_template",
      "arguments": {
        "name": "product_page",
        "label": "Product Page",
        "sections": ["hero", "features"]
      }
    }
  }'
```

## 🔄 Migration from v1.x

The new version maintains full backward compatibility while adding HTTP transport support:

**Before (v1.x):**
```bash
node index.js  # Stdio only
```

**Now (v2.x):**
```bash
node src/index.js           # Stdio (default)
node src/index.js --http    # HTTP transport
```

All existing MCP client configurations continue to work unchanged.

## 🚦 Transport Comparison

| Feature | Streamable HTTP | Stdio |
|---------|----------------|-------|
| **Performance** | High (persistent connections) | Good |
| **Session Management** | ✅ Built-in | ❌ Not applicable |
| **Browser Support** | ✅ Yes (with CORS) | ❌ No |
| **Debugging** | ✅ Easy (REST endpoints) | ⚠️ Limited |
| **Monitoring** | ✅ Health checks | ❌ No built-in |
| **Claude Desktop** | ⚠️ Requires setup | ✅ Native support |
| **Multiple Clients** | ✅ Yes | ❌ Single process |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **NPM Package**: [@tobidsn/anticms-mcp](https://www.npmjs.com/package/@tobidsn/anticms-mcp)
- **GitHub Repository**: [tobidsn/anticms-mcp](https://github.com/tobidsn/anticms-mcp)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **AntiCMS Documentation**: [AntiCMS v3 Docs](https://github.com/modelcontextprotocol/typescript-sdk)

## 🆕 What's New in v2.0

- ✨ **Streamable HTTP Transport**: Modern HTTP-based transport with session management
- 🏗️ **Restructured Project**: Organized into `src/` and `data/` directories  
- 🔧 **Dual Transport Support**: Both HTTP and Stdio in a single package
- 📂 **MCP Resources**: Access to structured data via `anticms://` URIs including:
  - File-based resources from `data/` folder
  - Project examples (e-commerce, restaurant, etc.)
  - Field type examples and documentation
  - Best practices and guidelines
- 💬 **MCP Prompts**: Structured prompt templates for consistent LLM interactions
- 📡 **Health Monitoring**: Built-in health check endpoint
- 🌐 **CORS Support**: Ready for browser-based clients
- 📚 **Enhanced Documentation**: Complete field type reference in JSON format
- 🎯 **Better Error Handling**: Improved error messages and validation
- 🚀 **Performance Improvements**: Optimized for both transport types

---

**Built with ❤️ for the AntiCMS and Model Context Protocol communities** 