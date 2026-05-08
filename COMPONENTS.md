# THEBLACKLIST Visual Component Guide

## Color System

### Dark Backgrounds
- **blacklist-dark** `#0f1419` - Main page background
- **blacklist-gray** `#1a1f26` - Secondary background, cards
- **blacklist-gray-light** `#2d3139` - Borders, subtle accents

### Green Palette (Primary Brand)
- **blacklist-green** `#2d5a3d` - Deep forest green (used in text/badges)
- **blacklist-green-bright** `#4a8f5e` - Bright green (buttons, highlights)

### Accent Colors
- **blacklist-accent-red** `#c41e3a` - CTAs, alerts, highlights
- **blacklist-accent-yellow** `#f4d03f` - Stars, ratings, important text

### Text Colors
- **blacklist-text** `#e8e8e8` - Primary text, light on dark
- **muted** `#999999` - Secondary text, grayed out

## Typography

### Font Family
- Inter (Google Fonts)
- Clean, modern, highly legible

### Heading Sizes
- `.heading-lg` - 4xl-5xl, main titles
- `.heading-md` - 2xl-3xl, section headings
- Default p - body text

## Component Classes

### Cards & Containers
```html
<!-- Glassmorphic card with frosted glass effect -->
<div class="glassmorphism p-6 rounded-lg">
  Content with semi-transparent background
</div>

<!-- Elevated card with shadow -->
<div class="card-elevated p-6 rounded-lg">
  Standard card style
</div>
```

### Buttons
```html
<!-- Primary Action (Green) -->
<button class="btn-primary">
  Action Button
</button>

<!-- Secondary Action (Outlined Green) -->
<button class="btn-secondary">
  Secondary Action
</button>

<!-- Accent Action (Yellow) -->
<button class="btn-accent">
  Accent Action
</button>
```

### Badges & Tags
```html
<!-- Green Badge -->
<span class="badge">Category</span>

<!-- Red Badge -->
<span class="badge-red">Alert</span>

<!-- Yellow Badge -->
<span class="badge-yellow">Featured</span>
```

### Glow Effects
```html
<!-- Green glow on hover -->
<div class="accent-glow">
  Content with green glow
</div>

<!-- Red glow on hover -->
<div class="accent-glow-red">
  Content with red glow
</div>
```

## Typography Classes
```html
<h1 class="heading-lg">Large Heading</h1>
<h2 class="heading-md">Medium Heading</h2>
<p class="text-muted">Muted text for secondary info</p>
```

## Interactive States

### Buttons
- **Default**: Solid color, full opacity
- **Hover**: Color shift (usually to red), enhanced glow
- **Active**: Scale down slightly (active:scale-95)
- **Disabled**: Reduced opacity (disabled:opacity-50)

### Links & Text
- **Default**: Primary color
- **Hover**: Red accent color, smooth transition
- **Visited**: Darker shade of original color

### Cards
- **Default**: Static appearance
- **Hover**: Glow effect, slight scale increase
- **Active**: Highlighted border

## Animation Principles

### Transitions
- Duration: 300ms for most effects
- Timing: ease-in-out for smooth feel
- Staggered: 0.1s delay between list items

### Motion Effects
- Fade in/out: opacity change
- Slide: translate transform
- Scale: size changes for emphasis
- Glow: shadow/color changes

## Spacing System

### Padding
- Small: `p-2` / `p-3` (8px / 12px)
- Medium: `p-4` / `p-6` (16px / 24px)
- Large: `p-8` / `p-12` (32px / 48px)

### Margins
- Sections: `py-12` / `py-16` / `py-20`
- Elements: `mb-4` / `mb-6` / `mb-8`
- Groups: `gap-4` / `gap-6` / `gap-8`

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Grid Layouts
```html
<!-- 1 col mobile, 2 col tablet, 3 col desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- items -->
</div>
```

## Component Examples

### Product Card
```tsx
<div class="card-elevated p-6 rounded-lg hover:accent-glow">
  <div class="badge mb-2">Category</div>
  <h3 class="heading-md mb-2">Product Name</h3>
  <p class="text-muted mb-4">Description</p>
  <div class="flex items-center gap-2 mb-4">
    <span class="text-blacklist-accent-yellow">★ 4.8</span>
    <span class="text-muted text-sm">(234 reviews)</span>
  </div>
  <button class="btn-secondary w-full">View Details</button>
</div>
```

### Forum Thread
```tsx
<div class="card-elevated p-6 rounded-lg">
  <h3 class="heading-md text-blacklist-text mb-2">Thread Title</h3>
  <div class="flex items-center gap-4 text-muted text-sm mb-2">
    <span>by <span class="text-blacklist-green-bright">Author</span></span>
    <span>•</span>
    <span>Last post 2 hours ago</span>
  </div>
  <div class="grid grid-cols-3 gap-4 text-center">
    <div>
      <div class="font-bold text-blacklist-accent-yellow">24</div>
      <div class="text-muted text-xs">replies</div>
    </div>
    <div>
      <div class="font-bold text-blacklist-green-bright">156</div>
      <div class="text-muted text-xs">views</div>
    </div>
    <div>
      <div class="text-blacklist-accent-red">●</div>
      <div class="text-muted text-xs">active</div>
    </div>
  </div>
</div>
```

### Dispensary Card
```tsx
<div class="card-elevated p-6 rounded-lg hover:accent-glow">
  <div class="flex justify-between items-start mb-4">
    <div>
      <h3 class="heading-md">Dispensary Name</h3>
      <p class="text-muted">City, State</p>
    </div>
    <span class="badge-yellow text-xs">Open now</span>
  </div>
  <div class="flex items-center gap-4 mb-4">
    <div class="flex items-center gap-1">
      <span class="text-blacklist-accent-yellow">★</span>
      <span>4.8</span>
      <span class="text-muted">(342)</span>
    </div>
    <span class="text-muted">2.3 mi</span>
  </div>
  <div class="flex flex-wrap gap-2">
    <span class="badge">Premium Flower</span>
    <span class="badge">Concentrates</span>
  </div>
</div>
```

## Accessibility Notes

### Color Contrast
- Text on dark: minimum 4.5:1 ratio
- All badges and buttons meet WCAG AA standards
- Yellow (#f4d03f) on dark backgrounds provides high contrast

### Keyboard Navigation
- Tab through interactive elements
- Enter/Space to activate buttons
- Arrow keys for navigation in carousels

### Focus States
- Blue ring on focus (standard browser default)
- Can be customized per component if needed

## Dark Mode Considerations

This platform is **dark-by-default**. Light mode support can be added by:
1. Creating light color variants in tailwind config
2. Adding theme toggle component
3. Storing preference in localStorage

## Future Design Enhancements

- [ ] Theme customization options
- [ ] Dark/Light mode toggle
- [ ] Accessibility audit report
- [ ] Component storybook
- [ ] Design tokens documentation
- [ ] Animation system documentation
