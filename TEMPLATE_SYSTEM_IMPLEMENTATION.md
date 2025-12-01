# Template System Implementation Guide

This document explains the template system implementation for the BBTAP NFC Business Card Platform.

## Overview

The template system allows users to choose from professionally designed templates that control the visual appearance of their digital business cards across creation, preview, and production.

## Components

### 1. Backend - Templates Database

**Model:** `backend/models/Template.js`
- Mongoose schema for template storage
- Fields: name, slug, description, category, colors, fonts, layout, features

**Seed Script:** `backend/scripts/seedTemplates.js`
- Populates database with 6 professional templates
- Categories: corporate, creative, healthcare, technology, other

### 2. Templates Available

| Template Name | Category | Layout | Colors | Premium |
|--------------|----------|--------|--------|---------|
| Modern Professional | Corporate | Centered | Blue (#2e50e7) | Free |
| Creative Bold | Creative | Split | Gradient (Pink/Orange) | Free |
| Minimalist | Other | Minimal | Black/Grey | Free |
| Tech Gradient | Technology | Card | Blue Gradient | Free |
| Healthcare Clean | Healthcare | Left-aligned | Green (#10b981) | Free |
| Elegant Corporate | Corporate | Split | Gold/Navy | Premium ⭐ |

### 3. Frontend - Template Renderer

**Component:** `frontend/src/components/TemplateRenderer.tsx`

**Purpose:**
- Wraps profile content with template-specific styling
- Applies colors, fonts, and layout from template
- Provides consistent styling across all views

**Features:**
- Dynamic color theming
- Layout variations (centered, split, card, minimal, left-aligned)
- Font customization
- Template-specific gradients and backgrounds
- Responsive design

**Usage:**
```tsx
import TemplateRenderer from '../components/TemplateRenderer';

<TemplateRenderer profile={profile}>
  {/* Profile content here */}
</TemplateRenderer>
```

### 4. Template Properties

**Colors:**
- `primary`: Main brand color
- `secondary`: Secondary/accent color
- `text`: Main text color
- `background`: Background color

**Fonts:**
- `heading`: Font family for headings (h1-h6)
- `body`: Font family for body text

**Layout Types:**
1. **Centered** - Traditional center-aligned layout
2. **Left-aligned** - Content aligned to left, good for professional profiles
3. **Split** - Two-column grid layout
4. **Card** - Contained card-style layout with shadow
5. **Minimal** - Minimal padding, clean aesthetic

## Implementation Status

### ✅ Completed

1. **Template Schema** - Mongoose model created
2. **Template Data** - 6 templates seeded into database
3. **Template Renderer** - React component for styling
4. **Seed Script** - Automated template population

### 🔄 In Progress

1. **Public Profile Integration** - Apply templates to public view
2. **Profile Creation** - Template selector during creation
3. **Profile Editing** - Template change option
4. **Preview Mode** - Show template in preview

### ⏳ Pending

1. **Template Preview Cards** - Visual template gallery
2. **Template Switching** - Live template preview before saving
3. **Custom Template Creation** - Admin interface for new templates
4. **Template Analytics** - Track template usage

## Integration Instructions

### Step 1: Wrap Public Profile

Update `PublicProfileRedesigned.tsx`:

```tsx
import TemplateRenderer from '../components/TemplateRenderer';

// Inside component
return (
  <TemplateRenderer profile={profile}>
    {/* Existing profile content */}
  </TemplateRenderer>
);
```

### Step 2: Add Template Selector to Creation

Update `CreateProfileRedesigned.tsx`:

```tsx
// Add state
const [templates, setTemplates] = useState([]);
const [selectedTemplateId, setSelectedTemplateId] = useState(null);

// Fetch templates on mount
useEffect(() => {
  const fetchTemplates = async () => {
    const response = await templatesAPI.getTemplates();
    setTemplates(response.data);
  };
  fetchTemplates();
}, []);

// Add template selector UI
<TemplateSelector
  templates={templates}
  selected={selectedTemplateId}
  onChange={setSelectedTemplateId}
/>
```

### Step 3: Save Template with Profile

Include template ID when creating profile:

```tsx
const profileData = {
  // ... other fields
  template: selectedTemplateId,
};
```

### Step 4: Apply to Preview

Wrap preview content with TemplateRenderer in preview mode.

## API Endpoints

### Get All Templates
```
GET /api/templates
Response: { success: true, data: [templates] }
```

### Get Template by ID
```
GET /api/templates/:id
Response: { success: true, data: template }
```

### Get Template by Slug
```
GET /api/templates/slug/:slug
Response: { success: true, data: template }
```

## Template Customization

Each template can be customized by:
1. Selecting a different template
2. Overriding colors (future feature)
3. Overriding fonts (future feature)
4. Custom CSS (premium feature)

## Running the Seed Script

To populate templates in database:

```bash
cd backend
node scripts/seedTemplates.js
```

Output:
```
✅ Connected to MongoDB
🗑️  Cleared existing templates
✅ Inserted 6 templates
📊 Template Summary:
   Total: 6
   Free: 5
   Premium: 1
✅ Database connection closed
```

## Template Selection UI (Future)

Planned template selector component:

```tsx
<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
  {templates.map(template => (
    <TemplateCard
      key={template._id}
      template={template}
      selected={selectedTemplateId === template._id}
      onClick={() => setSelectedTemplateId(template._id)}
    />
  ))}
</Box>
```

## Testing Templates

1. **Seed Templates:** Run seed script
2. **Create Profile:** Select a template during creation
3. **View Public Profile:** Template should be applied
4. **Edit Profile:** Change template and save
5. **View Again:** New template should be active

## Template Features by Category

### Corporate Templates
- Professional colors (blues, greys, navy)
- Formal fonts (Inter, Roboto, Lato)
- Traditional layouts (centered, left-aligned)
- Business-focused sections

### Creative Templates
- Bold, vibrant colors
- Unique fonts (Poppins, Montserrat)
- Dynamic layouts (split, gradient backgrounds)
- Gallery and portfolio sections

### Healthcare Templates
- Calming colors (greens, blues)
- Clean, readable fonts
- Hours and services sections
- Accessibility-focused

### Technology Templates
- Modern gradients
- Tech-forward fonts
- Card layouts
- Service showcases

## Benefits

1. **Consistency** - Uniform styling across all views
2. **Professional** - Designer-crafted templates
3. **Flexible** - Easy to add new templates
4. **Performant** - CSS-in-JS with MUI
5. **Responsive** - Mobile-first design

## Future Enhancements

1. **Template Marketplace** - User-submitted templates
2. **Custom Themes** - Color picker for personalization
3. **Animation Presets** - Template-specific animations
4. **Industry Packs** - Template bundles by industry
5. **A/B Testing** - Test different templates for engagement

---

**Created:** December 1, 2025
**Status:** Phase 1 Complete - Templates seeded and renderer created
**Next Phase:** Integration with profile views
