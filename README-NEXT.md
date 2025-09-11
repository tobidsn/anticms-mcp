# AntiCMS-MCP: The Smart AntiCMS v3 Template Generator

## 🤔 What is AntiCMS-MCP?

**AntiCMS-MCP** is a Model Context Protocol (MCP) server that automatically generates AntiCMS v3 JSON component templates. Think of it as a smart assistant that creates the perfect JSON structure for your AntiCMS components, whether from Figma designs or manual specifications.

### For Your Boss (Simple Explanation)

Imagine you have a designer who creates beautiful website layouts in Figma, and you need to turn those designs into AntiCMS v3 JSON templates that your developers can use. Normally, this process takes hours or even days of manual work:

1. **Designer** creates layout in Figma
2. **Developer** looks at the design
3. **Developer** manually writes AntiCMS v3 JSON templates
4. **Developer** creates field definitions for content management
5. **Developer** tests everything works

**With AntiCMS-MCP, this becomes:**
1. **Designer** creates layout in Figma
2. **AntiCMS-MCP** automatically analyzes the design
3. **AntiCMS-MCP** generates perfect AntiCMS v3 JSON templates
4. **Developer** just needs to review and deploy

**Time saved: 80-90%** ⏰
**Human errors: Eliminated** ✅
**Consistency: Perfect** 🎯

---

## 🎨 How Does It Work with Figma?

AntiCMS-MCP has a special superpower: it can "read" your Figma designs and understand what AntiCMS v3 components you need.

### The Magic Process:

1. **Design Analysis**: When you upload a Figma design, AntiCMS-MCP examines every element
2. **Smart Recognition**: It identifies buttons, text areas, images, forms, and other components
3. **Template Generation**: It automatically creates the proper AntiCMS v3 JSON template structure
4. **Field Definition**: It generates all the necessary field definitions for content management
5. **Ready to Use**: Your developers get perfectly structured AntiCMS v3 JSON templates

### What AntiCMS-MCP Can Detect from Figma:

- **Hero Sections** (big banners with titles and buttons)
- **Feature Lists** (product features, services, etc.)
- **Contact Forms** (name, email, message fields)
- **Image Galleries** (photo collections, portfolios)
- **Call-to-Action Buttons** (sign up, buy now, learn more)
- **Text Content** (headings, paragraphs, descriptions)
- **Navigation Menus** (website navigation structure)

---

## 🛠 Available Tools (What You Can Do)

### 1. **Template Generator** 🏗️
**What it does**: Creates complete AntiCMS v3 JSON page templates
**Perfect for**: Landing pages, about pages, contact pages, product pages

**Example**: You want a landing page with a hero section, features list, and contact form. Just tell AntiCMS-MCP what sections you need, and it generates the perfect AntiCMS v3 JSON template automatically.

### 2. **Field Generator** ⚙️
**What it does**: Creates individual AntiCMS v3 field definitions
**Perfect for**: Custom content types, special data fields

**Example**: You need a field for "Product Price" or "Customer Review Rating" - AntiCMS-MCP creates the perfect AntiCMS v3 field definition with all the right settings.

### 3. **Template Validator** ✅
**What it does**: Checks if your AntiCMS v3 templates are correctly structured
**Perfect for**: Quality assurance, preventing errors

**Example**: Before deploying a new AntiCMS v3 template, validate it to ensure everything works perfectly.

### 4. **Field Type Reference** 📚
**What it does**: Shows you all available AntiCMS v3 field types and their options
**Perfect for**: Learning what's possible, planning your content structure

**Example**: Want to know what types of AntiCMS v3 fields you can create? The reference shows you everything from simple text fields to complex image galleries.

---

## 🚀 MCP Installation

### For Claude Desktop
Add to your `claude_desktop_config.json`:

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

### For Cursor
Add to your MCP configuration:

```json
{
  "mcpServers": {
    "anticms-mcp": {
      "command": "npx",
      "args": [
        "@tobidsn/anticms-mcp@latest"
      ]
    }
  }
}
```

### For VSCode
Create `.vscode/mcp.json`:

```json
{
  "servers": {
    "anticms-mcp": {
      "command": "npx",
      "args": ["@tobidsn/anticms-mcp@latest"]
    }
  }
}
```

### Quick Install
```bash
npm install -g @tobidsn/anticms-mcp
```

---

## 💼 Business Benefits

### For Your Company:
- **Faster Development**: Reduce AntiCMS v3 template creation time by 80-90%
- **Lower Costs**: Less developer time needed for repetitive template tasks
- **Better Quality**: Consistent, error-free AntiCMS v3 JSON generation
- **Easy Maintenance**: Standardized AntiCMS v3 structure makes updates easier
- **Design Fidelity**: Perfect translation from design to AntiCMS v3 templates

### For Your Team:
- **Designers**: Can focus on creativity, not AntiCMS v3 technical constraints
- **Developers**: Spend time on complex features, not basic AntiCMS v3 template creation
- **Content Managers**: Get intuitive, well-structured AntiCMS v3 content fields
- **Project Managers**: Faster delivery, fewer bugs, happier clients

---

## 🎯 Real-World Use Cases

### E-commerce Website
- **Product Pages**: Auto-generate AntiCMS v3 product templates with image galleries, pricing, descriptions
- **Category Pages**: Create AntiCMS v3 category listing templates with filters and sorting
- **Checkout Process**: Generate AntiCMS v3 form templates for customer information and payment

### Corporate Website
- **About Page**: AntiCMS v3 hero section, team photos, company story sections
- **Services Page**: AntiCMS v3 service descriptions, pricing tables, contact forms
- **Blog**: AntiCMS v3 article templates with featured images, categories, author info

### Portfolio Website
- **Project Showcase**: AntiCMS v3 gallery templates with project details and images
- **Client Testimonials**: AntiCMS v3 testimonial sections with photos and quotes
- **Contact Page**: AntiCMS v3 contact forms with multiple input types

---

## 🔧 Advanced Features for Developers

### Technical Capabilities

#### 1. **Dual Transport Support**
- **HTTP Transport**: RESTful API for web applications
- **Stdio Transport**: Command-line integration for development tools

#### 2. **Comprehensive Field Types**
```javascript
// Supported field types include:
- input (text, email, password, number, url)
- textarea (multiline text)
- texteditor (rich text with formatting)
- select (dropdown menus)
- toggle (on/off switches)
- media (images, videos, files)
- repeater (repeatable content blocks)
- group (grouped fields)
- relationship (content relationships)
- post-object (content object references)
- table (structured data tables)
```

#### 3. **Advanced Template Generation**
```javascript
// Generate complex templates with multiple sections
{
  "name": "ecommerce_product",
  "label": "E-commerce Product",
  "sections": ["hero", "features", "gallery", "reviews"],
  "multilanguage": true,
  "is_content": true,
  "include_cta": true
}
```

#### 4. **Figma Integration**
- **Metadata Processing**: Analyzes Figma design metadata
- **Component Detection**: Automatically identifies UI components
- **Field Mapping**: Maps design elements to AntiCMS v3 field definitions
- **Validation**: Ensures generated AntiCMS v3 templates match design specifications

#### 5. **Validation & Error Handling**
```javascript
// Comprehensive validation system
- Template structure validation
- Field type validation
- Required field checking
- Data type validation
- Relationship validation
```

### API Usage Examples

#### Generate Template
```javascript
const template = await client.callTool({
  name: "generate_template",
  arguments: {
    name: "landing_page",
    label: "Landing Page",
    sections: ["hero", "features", "contact"],
    include_cta: true,
    max_features: 8
  }
});
```

#### Generate Custom Field
```javascript
const field = await client.callTool({
  name: "generate_custom_field",
  arguments: {
    name: "product_price",
    label: "Product Price",
    field_type: "input",
    multilanguage: false,
    attributes: {
      inputType: "number",
      is_required: true,
      min: 0,
      step: 0.01
    }
  }
});
```

#### Validate Template
```javascript
const validation = await client.callTool({
  name: "validate_template",
  arguments: {
    template_json: myTemplate
  }
});
```

### Resource Access
```javascript
// Access structured data via MCP Resources
const homeTemplate = await client.readResource({
  uri: "anticms://pages/home"
});

const fieldTypes = await client.readResource({
  uri: "anticms://field-types/input"
});
```

### Environment Configuration
```bash
# HTTP Transport
export MCP_TRANSPORT=http
node src/index.js --http --port=3000

# Stdio Transport
node src/index.js

# Health Check
curl http://localhost:3000/health
```

---

## 🚀 Getting Started

### 1. Install AntiCMS-MCP
```bash
npm install -g @tobidsn/anticms-mcp
```

### 2. Configure Your IDE
Add the MCP configuration to your preferred IDE (Claude Desktop, Cursor, or VSCode).

### 3. Start Using
- **For Designers**: Upload Figma designs and let AntiCMS-MCP analyze them
- **For Developers**: Use the API to generate AntiCMS v3 templates programmatically
- **For Content Managers**: Get perfectly structured AntiCMS v3 content fields

### 4. Advanced Usage
- Integrate with your existing AntiCMS v3 setup
- Customize AntiCMS v3 field types and validation rules
- Build automated AntiCMS v3 template workflows
- Scale to multiple AntiCMS v3 projects

---

## 📞 Support & Community

- **Documentation**: Complete API reference and examples
- **GitHub**: Source code and issue tracking
- **Community**: Developer discussions and support
- **Updates**: Regular feature updates and improvements

---

## 🎉 Conclusion

AntiCMS-MCP transforms the way you create AntiCMS v3 templates by bridging the gap between design and development. Whether you're a business owner looking to speed up AntiCMS v3 template creation, a designer wanting to focus on creativity, or a developer seeking efficiency, AntiCMS-MCP provides the tools you need to succeed.

**Start generating smarter, faster, and better AntiCMS v3 templates today!** 🚀
