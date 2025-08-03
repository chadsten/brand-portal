# Font & Color Management System

## Overview
The Font & Color Management System allows organizations to maintain consistent brand identity by centralizing font families and color palettes. These are treated as special asset types with specific tools for preview, management, and distribution.

## Core Features

### Font Management
- Font family uploads and organization
- Preview capabilities
- Font metadata management

### Color Management
- Color palette creation
- Multiple format support (HEX, RGB, HSL, CMYK)
- Color scheme generation
- Accessibility checking
- Export utilities

## API Endpoints

```typescript
// Font Management
GET    /api/fonts                          // List organization fonts
GET    /api/fonts/:id                      // Get font details
POST   /api/fonts/upload                   // Upload font files
PUT    /api/fonts/:id                      // Update font metadata
DELETE /api/fonts/:id                      // Delete font family
GET    /api/fonts/:id/preview              // Preview font
GET    /api/fonts/:id/download             // Download font files

// Color Management
GET    /api/colors/palettes                // List color palettes
GET    /api/colors/palettes/:id            // Get palette details
POST   /api/colors/palettes                // Create palette
PUT    /api/colors/palettes/:id            // Update palette
DELETE /api/colors/palettes/:id            // Delete palette
GET    /api/colors/palettes/:id/export     // Export palette
POST   /api/colors/analyze                 // Analyze color accessibility
POST   /api/colors/generate                // Generate color schemes
```

## Database Schema (Drizzle ORM)

```typescript
// font_families table
export const fontFamilies = pgTable('font_families', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  
  // Font information
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }), // 'serif', 'sans-serif', 'display', etc.
  designer: varchar('designer', { length: 255 }),
  foundry: varchar('foundry', { length: 255 }),
  
  // Metadata
  metadata: jsonb('metadata').default({
    weights: [], // ['regular', 'bold', 'light', etc.]
    styles: [],  // ['normal', 'italic']
    languages: [],
    features: [] // OpenType features
  }),
  
  // Storage
  storageKeys: jsonb('storage_keys').default({}), // Map of variant to S3 key
  
  // Status
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// font_variants table
export const fontVariants = pgTable('font_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  fontFamilyId: uuid('font_family_id').references(() => fontFamilies.id).notNull(),
  
  // Variant details
  weight: varchar('weight', { length: 50 }).notNull(), // '400', '700', etc.
  style: varchar('style', { length: 50 }).notNull(),   // 'normal', 'italic'
  displayName: varchar('display_name', { length: 100 }),
  
  // Files
  originalFile: varchar('original_file', { length: 500 }).notNull(),
  
  // Metadata
  fileSize: bigint('file_size', { mode: 'number' }),
  glyphCount: integer('glyph_count'),
  
  createdAt: timestamp('created_at').defaultNow()
});

// color_palettes table
export const colorPalettes = pgTable('color_palettes', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  
  // Palette information
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }), // 'primary', 'secondary', 'accent', etc.
  
  // Settings
  isDefault: boolean('is_default').default(false),
  isLocked: boolean('is_locked').default(false), // Prevent modifications
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// colors table
export const colors = pgTable('colors', {
  id: uuid('id').defaultRandom().primaryKey(),
  paletteId: uuid('palette_id').references(() => colorPalettes.id).notNull(),
  
  // Color information
  name: varchar('name', { length: 100 }).notNull(),
  hex: varchar('hex', { length: 7 }).notNull(),
  
  // Additional formats
  rgb: jsonb('rgb').notNull(), // { r: 255, g: 255, b: 255 }
  hsl: jsonb('hsl').notNull(), // { h: 360, s: 100, l: 100 }
  cmyk: jsonb('cmyk'),          // { c: 0, m: 0, y: 0, k: 0 }
  
  // Metadata
  category: varchar('category', { length: 50 }), // 'primary', 'accent', 'neutral'
  order: integer('order').default(0),
  metadata: jsonb('metadata').default({
    pantone: null,
    ral: null,
    usage: [] // ['text', 'background', 'border', etc.]
  }),
  
  createdAt: timestamp('created_at').defaultNow()
});

// brand_guidelines table
export const brandGuidelines = pgTable('brand_guidelines', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  // Typography rules
  typography: jsonb('typography').default({
    headings: { fontFamilyId: null, weights: [] },
    body: { fontFamilyId: null, weights: [] },
    special: [] // Array of special use cases
  }),
  
  // Color rules
  colorUsage: jsonb('color_usage').default({
    primary: { colorId: null, usage: [] },
    secondary: { colorId: null, usage: [] },
    combinations: [] // Approved color combinations
  }),
  
  // Guidelines
  dosDonts: jsonb('dos_donts').default({
    dos: [],
    donts: []
  }),
  
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

## Font Management Features

### Font Upload Process
```typescript
async function uploadFontFamily(files: FontFile[], metadata: FontMetadata) {
  // Validate font files
  const validatedFiles = await validateFontFiles(files);
  
  // Extract font information
  const fontInfo = await extractFontInfo(validatedFiles);
  
  // Upload to storage
  const storageKeys = await uploadFontFiles(validatedFiles);
  
  // Create database records
  const fontFamily = await createFontFamily({
    ...metadata,
    ...fontInfo,
    storageKeys
  });
  
  return fontFamily;
}
```

### Font Preview System
```typescript
// Generate font preview
async function generateFontPreview(fontId: string, options: PreviewOptions) {
  const font = await getFontFamily(fontId);
  
  return {
    previewUrl: generatePreviewUrl(font),
    specimens: generateTypeSpecimens(font, options),
    characterMap: generateCharacterMap(font)
  };
}
```

## Color Management Features

### Color Palette Tools
```typescript
interface ColorPaletteTools {
  // Format conversion
  convertColor(color: string, toFormat: 'hex' | 'rgb' | 'hsl' | 'cmyk'): ColorValue;
  
  // Accessibility
  checkContrast(foreground: string, background: string): ContrastResult;
  suggestAccessiblePairs(palette: ColorPalette): ColorPair[];
  
  // Generation
  generateComplementary(baseColor: string): string[];
  generateAnalogous(baseColor: string): string[];
  generateTriadic(baseColor: string): string[];
  generateShades(baseColor: string, count: number): string[];
}
```

### Color Export Formats
```typescript
interface ColorExportFormats {
  json: {
    includeAllFormats: boolean;
  };
  ase: boolean; // Adobe Swatch Exchange
  sketch: boolean; // Sketch palette
  figma: boolean; // Figma styles
}
```

## Tier-Based Features

### Feature Availability
```typescript
interface FontColorFeaturesByTier {
  basic: {
    maxFontFamilies: 5,
    maxColorPalettes: 3,
    colorAccessibilityTools: false,
    exportFormats: ['json']
  },
  pro: {
    maxFontFamilies: 50,
    maxColorPalettes: 20,
    colorAccessibilityTools: true,
    exportFormats: ['json', 'ase']
  },
  enterprise: {
    maxFontFamilies: -1, // Unlimited
    maxColorPalettes: -1,
    colorAccessibilityTools: true,
    exportFormats: 'all',
    brandGuidelines: true,
    apiAccess: true
  }
}
```

## Brand Guidelines

### Typography Guidelines
```typescript
interface TypographyGuidelines {
  headings: {
    fontFamilyId: string;
    weights: string[];
    sizes: Record<string, number>; // h1: 32, h2: 24, etc.
    lineHeights: Record<string, number>;
  };
  body: {
    fontFamilyId: string;
    weight: string;
    size: number;
    lineHeight: number;
  };
  special: Array<{
    name: string;
    fontFamilyId: string;
    weight: string;
    usage: string[];
  }>;
}
```

### Color Guidelines
```typescript
interface ColorGuidelines {
  primary: {
    colorId: string;
    usage: ['headers', 'buttons', 'links'];
    variations: string[]; // Tints and shades
  };
  secondary: {
    colorId: string;
    usage: ['accents', 'highlights'];
  };
  neutral: {
    colorIds: string[];
    usage: ['text', 'backgrounds', 'borders'];
  };
  combinations: Array<{
    name: string;
    colors: string[];
    usage: string;
  }>;
}
```

## Accessibility Features

### Color Contrast Checking
```typescript
interface ContrastChecker {
  checkWCAG(foreground: string, background: string): {
    ratio: number;
    aa: {
      normal: boolean;
      large: boolean;
    };
    aaa: {
      normal: boolean;
      large: boolean;
    };
  };
  
  suggestAlternatives(color: string, background: string, level: 'AA' | 'AAA'): string[];
}
```

### Font Readability
```typescript
interface FontReadability {
  checkXHeight(fontId: string): 'low' | 'medium' | 'high';
  checkCharacterDistinction(fontId: string): ReadabilityScore;
  suggestSizes(fontId: string, usage: 'heading' | 'body' | 'caption'): number[];
}
```

## Performance Optimization

### Caching
```typescript
// Color palette caching
const COLOR_CACHE_TTL = 3600; // 1 hour

async function getCachedPalette(paletteId: string) {
  const cacheKey = `palette:${paletteId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const palette = await getColorPaletteWithColors(paletteId);
  await redis.setex(cacheKey, COLOR_CACHE_TTL, JSON.stringify(palette));
  
  return palette;
}

// Font family caching
const FONT_CACHE_TTL = 7200; // 2 hours

async function getCachedFont(fontId: string) {
  const cacheKey = `font:${fontId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const font = await getFontWithVariants(fontId);
  await redis.setex(cacheKey, FONT_CACHE_TTL, JSON.stringify(font));
  
  return font;
}
```

## Analytics & Usage Tracking

### Font Usage Analytics
```typescript
interface FontUsageAnalytics {
  fontId: string;
  metrics: {
    downloads: number;
    uniqueUsers: number;
    popularVariants: Array<{
      variant: string;
      usage: number;
    }>;
    geographicDistribution: Record<string, number>;
  };
}
```

### Color Usage Patterns
```typescript
interface ColorUsagePatterns {
  paletteId: string;
  metrics: {
    exports: number;
    apiRequests: number;
    popularColors: Array<{
      colorId: string;
      usage: number;
    }>;
    exportFormats: Record<string, number>;
  };
}
```

## Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_font_families_org_id ON font_families(organization_id);
CREATE INDEX idx_font_variants_family_id ON font_variants(font_family_id);
CREATE INDEX idx_color_palettes_org_id ON color_palettes(organization_id);
CREATE INDEX idx_colors_palette_id ON colors(palette_id);
CREATE INDEX idx_brand_guidelines_org_id ON brand_guidelines(organization_id);
```