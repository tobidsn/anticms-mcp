# 🎯 Testing AntiCMS MCP in Cursor - Step by Step Demo

This guide shows exactly how to test the AntiCMS MCP server in Cursor with real examples.

## 🚀 Quick Configuration Reference

### Most Common Configurations

**1. Local Development (Stdio):**
```json
{
  "mcpServers": {
    "anticms-mcp": {
      "command": "node",
      "args": ["src/index.js", "--stdio"],
      "cwd": "/Users/tobi/Sites/Anticms-MCP"
    }
  }
}
```

**2. Local Testing (HTTP):**
```json
{
  "mcpServers": {
    "anticms-mcp": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```
*Start with: `npm run dev`*

**3. Production (HTTPS):**
```json
{
  "mcpServers": {
    "anticms-mcp": {
      "type": "http",
      "url": "https://anticms-mcp.yourdomain.com/mcp"
    }
  }
}
```

**4. Production with Auth:**
```json
{
  "mcpServers": {
    "anticms-mcp": {
      "type": "http",
      "url": "https://anticms-mcp.yourdomain.com/mcp",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }
}
```

## 📋 Step 1: Configure Cursor

1. **Open Cursor Settings**
   - Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
   - Search for "MCP" in settings

2. **Choose Configuration Method**

### Method A: Stdio Transport (Local Development)

For local development with direct process communication:

```json
{
  "mcpServers": {
    "anticms-mcp": {
      "command": "node",
      "args": [
        "src/index.js",
        "--stdio"
      ],
      "cwd": "/Users/tobi/Sites/Anticms-MCP",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Method B: HTTP Transport (localhost)

For testing the HTTP transport locally:

```json
{
  "mcpServers": {
    "anticms-mcp-local": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

**Prerequisites for HTTP:**
1. Start the server first: `npm run dev`
2. Verify health: `curl http://localhost:3000/health`

### Method C: HTTP Transport (Custom Port)

For running on a different port:

```json
{
  "mcpServers": {
    "anticms-mcp-custom": {
      "type": "http", 
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

**Start server with custom port:**
```bash
node src/index.js --http --port=8080
```

### Method D: Production Deployment (HTTPS)

For production deployment with a domain:

```json
{
  "mcpServers": {
    "anticms-mcp-prod": {
      "type": "http",
      "url": "https://anticms-mcp.yourdomain.com/mcp"
    }
  }
}
```

### Method E: Development Team Setup

For team development with shared server:

```json
{
  "mcpServers": {
    "anticms-mcp-team": {
      "type": "http",
      "url": "https://dev-anticms-mcp.company.com/mcp",
      "headers": {
        "Authorization": "Bearer your-team-token",
        "X-Environment": "development"
      }
    }
  }
}
```

### Method F: Multiple Environments

Configure multiple environments simultaneously:

```json
{
  "mcpServers": {
    "anticms-mcp-local": {
      "command": "node",
      "args": ["src/index.js", "--stdio"],
      "cwd": "/Users/tobi/Sites/Anticms-MCP"
    }
  },
  "mcpServers": {
    "anticms-mcp-staging": {
      "type": "http",
      "url": "https://staging-anticms-mcp.yourdomain.com/mcp"
    },
    "anticms-mcp-production": {
      "type": "http", 
      "url": "https://anticms-mcp.yourdomain.com/mcp"
    }
  }
}
```

3. **Restart Cursor**
   - Close and reopen Cursor to load the new MCP server

## 🧪 Step 2: Test Basic Functionality

### Test 1: Generate a Landing Page Template

**What to type in Cursor:**
```
Generate an AntiCMS v3 landing page template called "startup_landing" with these sections:
- Hero section with title, subtitle, and CTA button
- Features section with 3 features
- Contact section with form fields

Make sure to include proper validation and multilanguage support.
```

**Expected Result:**
- Cursor should use the `generate_template` tool
- You should get a complete JSON template
- The template should have all requested sections
- Fields should have proper validation and multilanguage settings

### Test 2: Create a Custom Media Field

**What to type in Cursor:**
```
Create a media field for product photos with these requirements:
- Field name: product_gallery
- Accept only images (jpg, png, webp)
- Resolution: minimum 800x800, maximum 2048x2048
- Allow multiple uploads (max 10 images)
- Add proper validation
```

**Expected Result:**
- Cursor should use the `generate_custom_field` tool
- You should get a media field configuration
- The field should have proper resolution constraints
- Multiple upload should be enabled

### Test 3: Validate a Template

**What to type in Cursor:**
```
Please validate this AntiCMS template and tell me if there are any issues:

{
  "name": "test_page",
  "label": "Test Page",
  "components": [
    {
      "keyName": "hero",
      "fields": [
        {
          "name": "title",
          "field": "input",
          "attribute": {
            "type": "text"
          }
        }
      ]
    }
  ]
}
```

**Expected Result:**
- Cursor should use the `validate_template` tool
- You should get validation feedback
- The tool should identify missing properties (description, is_content, etc.)

### Test 4: Get Inspirational Quote

**What to type in Cursor:**
```
I need some inspiration for designing a new website. Can you get me a random quote from Steve Jobs about design?
```

**Expected Result:**
- Cursor should use the `get_random_quote` tool
- You should get a Steve Jobs quote about design
- The quote should include context and application suggestions
- The response should inspire your template design

**Alternative Test:**
```
Get me a quote from design leaders to inspire my AntiCMS template creation.
```

**Expected Result:**
- Cursor should use the `get_random_quote` tool with `design-leaders` category
- You should get a quote from famous design figures like Paul Rand, Leonardo da Vinci, etc.
- The quote should provide design wisdom and principles

## 📂 Step 3: Test MCP Resources

### Test 1: Access Page Templates

**What to type in Cursor:**
```
Show me the structure of the home page template from the AntiCMS resources. I want to understand how it's organized.
```

**Expected Result:**
- Cursor should read from `anticms://pages/home`
- You should see the complete home page template JSON
- Cursor should explain the structure and organization

### Test 2: Learn from Field Examples

**What to type in Cursor:**
```
Show me examples of media field configurations from the AntiCMS resources. Then create a new media field for user avatars based on these examples.
```

**Expected Result:**
- Cursor should access `anticms://field-examples/media`
- You should see various media field examples
- Cursor should create a new field based on the examples

### Test 3: Follow Best Practices

**What to type in Cursor:**
```
What are the naming conventions for AntiCMS templates according to the best practices? Create a new blog template following these guidelines.
```

**Expected Result:**
- Cursor should read `anticms://best-practices/naming-conventions`
- You should get the naming convention guidelines
- Cursor should create a template following the guidelines

## 💬 Step 4: Test MCP Prompts

### Test 1: Use Landing Page Prompt

**What to type in Cursor:**
```
Use the create-landing-page prompt to generate a template for a restaurant website with hero, menu, and contact sections.
```

**Expected Result:**
- Cursor should use the `create-landing-page` prompt
- The prompt should provide structured guidance
- You should get a restaurant-specific template

### Test 2: Learn Field Types Prompt

**What to type in Cursor:**
```
Use the learn-field-types prompt to understand repeater fields. I want to create a team members section.
```

**Expected Result:**
- Cursor should use the `learn-field-types` prompt
- You should get detailed information about repeater fields
- Cursor should create a team members repeater field

### Test 3: Best Practices Check

**What to type in Cursor:**
```
Use the check-best-practices prompt to review this template:
[paste a template JSON here]
```

**Expected Result:**
- Cursor should use the `check-best-practices` prompt
- You should get specific recommendations
- The review should reference best practices resources

## 🔧 Step 5: Advanced Testing

### Test Complex Workflow

**What to type in Cursor:**
```
I want to create a complete e-commerce product page template. Please:

1. First, show me the e-commerce example from the resources
2. Create a new template called "product_detail" with these sections:
   - Product info (name, description, price)
   - Product gallery (multiple images)
   - Product specifications (repeater)
   - Related products
3. Validate the template
4. Check it against best practices
```

**Expected Workflow:**
1. Cursor reads `anticms://examples/ecommerce-landing`
2. Uses `generate_template` tool
3. Uses `validate_template` tool
4. Uses `check-best-practices` prompt
5. Provides complete, validated template

## 🐛 Troubleshooting

### Issue: "MCP server not responding"

**Check:**
1. Verify the file path in configuration is correct
2. Ensure Node.js is installed and accessible
3. Check that all dependencies are installed (`npm install`)

**Test manually:**
```bash
cd /Users/tobi/Sites/Anticms-MCP
node src/index.js --stdio
```

### Issue: "Tools not available"

**Check:**
1. Server initialization in Cursor
2. Look for error messages in Cursor's developer console
3. Test with our test script: `node test-mcp.js`

### Issue: "Resources not found"

**Check:**
1. Verify `data/` directory exists with JSON files
2. Check file permissions
3. Verify resource registration in `src/tools/resources.js`

## ✅ Success Indicators

You know the MCP integration is working when:

1. **Tools are available:** Cursor can use generate_template, generate_custom_field, etc.
2. **Resources are accessible:** Cursor can read from anticms:// URIs
3. **Prompts work:** Cursor can use structured prompts for guidance
4. **Templates validate:** Generated templates pass validation
5. **Best practices applied:** Templates follow AntiCMS conventions

## 📊 Performance Expectations

- **Response time:** < 2 seconds for template generation
- **Resource access:** < 500ms for reading resource files
- **Validation:** < 1 second for template validation
- **Memory usage:** < 50MB for the MCP server process

## 🎯 Next Steps

Once basic testing works:

1. **Create complex templates** with multiple sections
2. **Test multilanguage** functionality
3. **Validate real projects** with the tools
4. **Explore all field types** and their attributes
5. **Use prompts** for consistent template creation

## 🌐 Production Deployment Examples

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY data/ ./data/

EXPOSE 3000

CMD ["node", "src/index.js", "--http", "--port=3000"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  anticms-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Cursor Configuration for Docker:**
```json
{
  "mcpServers": {
    "anticms-mcp-docker": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Nginx Reverse Proxy

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name anticms-mcp.yourdomain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name anticms-mcp.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /mcp {
        proxy_pass http://localhost:3000/mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

**Cursor Configuration for Nginx:**
```json
{
  "mcpServers": {
    "anticms-mcp-nginx": {
      "type": "http",
      "url": "https://anticms-mcp.yourdomain.com/mcp"
    }
  }
}
```

### Vercel Deployment

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/mcp",
      "dest": "/src/index.js"
    },
    {
      "src": "/health", 
      "dest": "/src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Cursor Configuration for Vercel:**
```json
{
  "mcpServers": {
    "anticms-mcp-vercel": {
      "type": "http",
      "url": "https://your-project.vercel.app/mcp"
    }
  }
}
```

### Railway Deployment

**railway.toml:**
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node src/index.js --http --port=$PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
```

**Cursor Configuration for Railway:**
```json
{
  "mcpServers": {
    "anticms-mcp-railway": {
      "type": "http",
      "url": "https://your-project.up.railway.app/mcp"
    }
  }
}
```

### Heroku Deployment

**Procfile:**
```
web: node src/index.js --http --port=$PORT
```

**package.json scripts:**
```json
{
  "scripts": {
    "start": "node src/index.js --http --port=$PORT",
    "heroku-postbuild": "npm ci"
  }
}
```

**Cursor Configuration for Heroku:**
```json
{
  "mcpServers": {
    "anticms-mcp-heroku": {
      "type": "http",
      "url": "https://your-app.herokuapp.com/mcp"
    }
  }
}
```

## 🔐 Authentication Examples

### API Key Authentication

**Server Configuration:**
```javascript
// Add to src/index.js
app.use('/mcp', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

**Cursor Configuration:**
```json
{
  "mcpServers": {
    "anticms-mcp-secure": {
      "type": "http",
      "url": "https://anticms-mcp.yourdomain.com/mcp",
      "headers": {
        "X-API-Key": "your-secret-api-key"
      }
    }
  }
}
```

### Bearer Token Authentication

**Server Configuration:**
```javascript
app.use('/mcp', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  
  const token = authHeader.substring(7);
  if (token !== process.env.BEARER_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
});
```

**Cursor Configuration:**
```json
{
  "mcpServers": {
    "anticms-mcp-token": {
      "type": "http",
      "url": "https://anticms-mcp.yourdomain.com/mcp",
      "headers": {
        "Authorization": "Bearer your-bearer-token"
      }
    }
  }
}
```

## 🧪 Testing Different Configurations

### Test Localhost HTTP

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test health
curl http://localhost:3000/health

# Terminal 3: Test MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}'
```

### Test Production HTTPS

```bash
# Test health endpoint
curl https://anticms-mcp.yourdomain.com/health

# Test MCP endpoint with authentication
curl -X POST https://anticms-mcp.yourdomain.com/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}'
```

### Test with Different Cursor Profiles

Create multiple Cursor configuration profiles:

**Profile 1: Local Development**
```json
{
  "mcpServers": {
    "anticms-local": {
      "command": "node",
      "args": ["src/index.js", "--stdio"],
      "cwd": "/path/to/project"
    }
  }
}
```

**Profile 2: Staging Environment**
```json
{
  "mcpServers": {
    "anticms-staging": {
      "type": "http",
      "url": "https://staging-anticms-mcp.yourdomain.com/mcp",
      "headers": {
        "X-Environment": "staging"
      }
    }
  }
}
```

**Profile 3: Production Environment**
```json
{
  "mcpServers": {
    "anticms-production": {
      "type": "http",
      "url": "https://anticms-mcp.yourdomain.com/mcp",
      "headers": {
        "Authorization": "Bearer prod-token",
        "X-Environment": "production"
      }
    }
  }
}
```

## 🚀 Quick Start Commands

### For localhost HTTP testing:
```bash
# 1. Start server
npm run dev

# 2. Test in browser
open http://localhost:3000/health

# 3. Configure Cursor with localhost HTTP
# Use Method B configuration above
```

### For production deployment:
```bash
# 1. Build and deploy
docker build -t anticms-mcp .
docker run -p 3000:3000 anticms-mcp

# 2. Configure Cursor with production URL
# Use Method D configuration above
```

## 📋 Copy-Paste Test Examples

### Test 1: Basic Template Generation
```
Create an AntiCMS v3 template for a photography portfolio website called "photo_portfolio" with these sections:
- Hero section with photographer name, tagline, and main image
- Gallery section with image repeater (max 20 images)
- About section with bio and contact info
- Services section with pricing repeater

Make it multilanguage and add proper validation.
```

### Test 2: E-commerce Product Template
```
Generate an AntiCMS template for product pages with:
- Product info (name, description, price, SKU)
- Image gallery (main image + thumbnails)
- Product specifications (repeater with key-value pairs)
- Related products section
- Customer reviews (repeater with rating, comment, author)

Include validation for price (minimum 0) and SKU (required).
```

### Test 3: Restaurant Menu Template
```
Create a restaurant menu template with:
- Restaurant header (name, logo, description)
- Menu categories (appetizers, mains, desserts, drinks)
- Each category has items with: name, description, price, dietary info
- Special offers section
- Contact and hours section

Use proper field types and enable multilanguage for all content.
```

### Test 4: Team Directory Template
```
Build a team directory template with:
- Company info section
- Team members repeater containing:
  - Photo (media field with size constraints)
  - Name and position (required text inputs)
  - Bio (textarea, max 500 chars)
  - Social links (group with optional URL fields)
  - Department (select field)

Add validation and organize with proper sections.
```

### Test 5: Resource Learning Example
```
Show me the media field examples from the AntiCMS resources, then create a custom media field for blog post featured images with these requirements:
- Minimum resolution: 1200x630 (for social sharing)
- Maximum file size: 2MB
- Accept only JPG, PNG, WebP formats
- Required field with helpful placeholder text
```

### Test 6: Best Practices Review
```
Use the check-best-practices prompt to review this template and suggest improvements:

{
  "name": "basicpage",
  "components": [
    {
      "keyName": "content",
      "fields": [
        {
          "name": "title",
          "field": "input"
        }
      ]
    }
  ]
}

Then generate a corrected version following AntiCMS conventions.
```

### Test 7: Complex Workflow
```
I need to create a complete real estate property template. Please:

1. First, check if there are any real estate examples in the resources
2. Create a template called "property_listing" with:
   - Property details (address, price, type, bedrooms, bathrooms)
   - Image gallery with virtual tour links
   - Property features (repeater)
   - Agent contact info
   - Viewing schedule
3. Validate the template
4. Check it against best practices
5. Suggest any improvements

Make everything production-ready with proper validation.
```

### Test 8: Inspiration Workflow
```
I'm feeling stuck on my website design. Can you:

1. Get me an inspirational quote from Steve Jobs about design
2. Use that inspiration to create a modern landing page template
3. Apply the design principles from the quote to the template structure

Make sure the template reflects the wisdom in the quote.
```

### Test 9: Design Leaders Inspiration
```
I need inspiration for a creative portfolio website. Please:

1. Get me a quote from design leaders about creativity
2. Use that quote to guide the creation of a portfolio template
3. Explain how the quote's principles influenced the template design

Focus on artistic expression and unique user experiences.
```

This completes the comprehensive testing workflow for AntiCMS MCP in Cursor with all deployment scenarios! 