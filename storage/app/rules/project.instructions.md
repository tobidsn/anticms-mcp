# Project Page

- Name: project  
- Label: Project Page  
- Multilanguage: true  
- Is Content: false  
- Is Multiple: false  
- Description: Project page template with Services and Features sections for home improvement business

## Section: Services Section (`section_services`)
- Block: Services  
- Order: 1  

### Fields:
- `status`: toggle  
  - Default: true  
  - Caption: Enable or disable the services section  

- `title`: input (multilanguage)  
  - Required: true  
  - Default: Our Services  

- `description`: textarea (multilanguage)  
  - Default: You have problems with leaking pipes, broken tiles, lost keys...

- `services`: repeater (min: 1, max: 8)  
  - `icon`: input  
    - Required: true  
    - Caption: Icon name (Lucide React icons)  
  - `title`: input (multilanguage)  
    - Required: true  
  - `description`: textarea (multilanguage)

---

## Section: Features Section (`section_features`)
- Block: Features  
- Order: 2  

### Fields:
- `status`: toggle  
  - Default: true  
  - Caption: Enable or disable the features section  

- `title`: input (multilanguage)  
  - Required: true  
  - Default: Fast, Friendly, and Satisfaction Guarantee  

- `description`: textarea (multilanguage)  
  - Default: No matter how big or small your work is...

- `features`: repeater (min: 1, max: 6)  
  - `icon`: input  
    - Required: true  
    - Caption: Icon name (Lucide React icons)  
  - `title`: input (multilanguage)  
    - Required: true  
  - `description`: textarea (multilanguage)
