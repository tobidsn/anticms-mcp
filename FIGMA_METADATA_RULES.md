# Figma Metadata Generation Rules

Berdasarkan `homepage_metadata.json`, berikut adalah rules lengkap untuk generate Figma metadata:

## 1. Root Structure (Wajib)

```json
{
  "figma_code_response": { ... },
  "figma_metadata_response": { ... },
  "anticms_analysis": { ... },
  "context_for_template_generation": { ... }
}
```

## 2. figma_code_response Structure

### 2.1 Basic Info
- `nodeId`: String - Figma node ID (format: "X-Y")
- `extractedAt`: String - ISO timestamp
- `sections`: Object - Data semua sections

### 2.2 Sections Data Pattern
```json
"sections": {
  "section_name": {
    "field_name": "value" | [array] | {object},
    "nested_object": {
      "sub_field": "value"
    }
  }
}
```

**Rules untuk Sections:**
- **Nama section**: snake_case atau kebab-case
- **Field names**: snake_case
- **Values**: String, Number, Boolean, Array, atau Object
- **Arrays**: Untuk data yang berulang (list items, cards, dll)
- **Objects**: Untuk data yang terstruktur (form fields, navigation, dll)

## 3. figma_metadata_response Structure

### 3.1 Basic Info
- `nodeId`: String - Sama dengan figma_code_response
- `name`: String - Nama halaman/komponen
- `dimensions`: Object dengan width dan height
- `sections_hierarchy`: Array - Hierarchy sections dengan posisi

### 3.2 Sections Hierarchy Pattern
```json
"sections_hierarchy": [
  {
    "id": "5:213",           // Figma component ID
    "name": "Section Name",   // Nama section
    "y": 0,                  // Posisi Y
    "height": 780,           // Tinggi section
    "components": ["..."]     // Array nama komponen
  }
]
```

## 4. anticms_analysis Structure (PENTING)

### 4.1 Basic Info
- `template_type`: "pages" | "posts"
- `total_sections`: Number
- `identified_sections`: Object - Analisis setiap section
- `complexity_score`: "low" | "medium" | "high"
- `custom_sections_needed`: Number
- `built_in_sections`: Number
- `estimated_fields`: Number
- `multilanguage_recommended`: Boolean

### 4.2 identified_sections Pattern (KUNCI UTAMA)
```json
"identified_sections": {
  "section_name": {
    "matched": true,
    "confidence": "high" | "medium" | "low",
    "anticms_mapping": "built-in" | "custom",
    "detected_fields": [
      "field_name_1",
      "field_name_2",
      "field_name_3 (repeater, max X)",
      "field_name_4 (post_related)"
    ],
    "identified_field_types": [
      "input",
      "textarea", 
      "media",
      "repeater",
      "post_related",
      "toggle",
      "select",
      "group"
    ]
  }
}
```

**Rules untuk detected_fields:**
- **Simple fields**: `"field_name"`
- **Repeater fields**: `"field_name (repeater, max X)"`
- **Post related fields**: `"field_name (post_related)"`
- **Group fields**: `"field_name (group)"`

**Rules untuk identified_field_types:**
- **input**: Text, title, label, button text
- **textarea**: Description, long text content
- **media**: Image, logo, avatar, icon
- **repeater**: Array data yang berulang
- **post_related**: Collection data (services, projects, dll)
- **toggle**: Boolean values (enable/disable)
- **select**: Dropdown, choice fields
- **group**: Nested object data

## 5. context_for_template_generation Structure

```json
"context_for_template_generation": {
  "page_rules_file": ".cursor/rules/pages/page_name.mdc",
  "matches_defined_sections": true,
  "section_mapping_accuracy": "100%",
  "ready_for_template_generation": true,
  "next_steps": [
    "Generate AntiCMS template using mcp_anticms-mcp_generate_template",
    "Create mock data for all X sections",
    "Generate final page structure"
  ]
}
```

## 6. Dynamic Rules untuk Field Detection

### 6.1 Field Type Detection Rules
- **Image fields**: `logo`, `image`, `avatar`, `icon`, `photo`
- **Text fields**: `title`, `headline`, `label`, `name`
- **Description fields**: `description`, `content`, `text`, `subtitle`
- **Button fields**: `button`, `cta`, `link`, `action`
- **Form fields**: `input`, `field`, `form`
- **Array fields**: `items`, `list`, `cards`, `data`

### 6.2 Post Collection Detection Rules
- **Keywords**: `see more`, `view more`, `browse all`, `show all`
- **Section names**: `projects`, `portfolio`, `services`, `team`, `news`, `blog`
- **Array with complex objects**: 3+ fields per item
- **Typical post fields**: `title`, `description`, `image`, `date`, `author`

### 6.3 Repeater Detection Rules
- **Array data**: 2+ items
- **Simple objects**: 1-2 fields per item
- **List items**: `items`, `list`, `menu_items`, `links`

## 7. Template Generation Rules

### 7.1 Section Priority
1. **Hero sections**: Navigation, headline, CTA
2. **Content sections**: Features, services, about
3. **Collection sections**: Projects, team, testimonials
4. **Interactive sections**: Contact, forms
5. **Footer sections**: Links, social, copyright

### 7.2 Field Mapping Rules
- **1:1 mapping**: detected_fields → identified_field_types
- **Array length**: detected_fields.length === identified_field_types.length
- **Special fields**: Handle (repeater) dan (post_related) separately
- **Nested objects**: Convert to group fields

## 8. Validation Rules

### 8.1 Required Fields
- `figma_code_response.sections` tidak boleh kosong
- `anticms_analysis.identified_sections` harus ada
- `detected_fields` dan `identified_field_types` harus sama panjangnya

### 8.2 Data Consistency
- Section names harus konsisten di semua level
- Field types harus valid (sesuai dengan field-types yang tersedia)
- Array lengths harus reasonable (max 20 untuk repeater)

## 9. Best Practices

1. **Naming Convention**: Gunakan snake_case untuk semua field names
2. **Field Types**: Pilih yang paling spesifik (media > input, textarea > input)
3. **Post Collections**: Prioritaskan post_related untuk collection data
4. **Repeaters**: Gunakan untuk simple repeated data
5. **Groups**: Gunakan untuk complex nested objects
6. **Validation**: Pastikan semua field types valid dan konsisten

## 10. Field Types Reference

### 10.1 Basic Field Types
- `input`: Text input, single line
- `textarea`: Multi-line text input
- `media`: Image, video, file upload
- `toggle`: Boolean on/off switch
- `select`: Dropdown selection
- `number`: Numeric input

### 10.2 Complex Field Types
- `repeater`: Array of simple objects
- `post_related`: Reference to post collection
- `group`: Nested object structure
- `table`: Tabular data
- `texteditor`: Rich text editor

### 10.3 Special Field Types
- `relationship`: Reference to other content
- `date`: Date picker
- `time`: Time picker
- `color`: Color picker
- `url`: URL input with validation

Rules ini bersifat dynamic dan bisa diterapkan untuk page apapun, tinggal sesuaikan dengan content dan structure yang ada di Figma design.
