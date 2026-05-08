# THEBLACKLIST Platform - Consumer-Focused Design

## Visual Design Overview

### Color Palette
- **Primary Dark**: `#0f1419` (blacklist-dark) - Main background
- **Secondary Dark**: `#1a1f26` (blacklist-gray) - Cards and sections
- **Tertiary Dark**: `#2d3139` (blacklist-gray-light) - Borders and accents
- **Primary Green**: `#2d5a3d` (blacklist-green) - Deep forest green
- **Bright Green**: `#4a8f5e` (blacklist-green-bright) - Accent green
- **Accent Red**: `#c41e3a` - Highlight and CTAs
- **Accent Yellow**: `#f4d03f` - Stars, ratings, highlights
- **Text Primary**: `#e8e8e8` (blacklist-text) - Main text

### Design Philosophy
- **Masculine & Clean**: Professional, minimal aesthetic
- **Cannabis-Consumer Focused**: Colors appeal to cannabis enthusiasts
- **High Contrast**: Excellent readability with dark backgrounds
- **Modern Professional**: Trustworthy and premium feel

## Key Features

### 1. Revolving Product Gallery
- Carousel-style product display
- Animated transitions with Framer Motion
- Auto-rotate every 5 seconds
- Manual navigation with arrow buttons
- Indicator dots for quick selection
- Product cards showcase category, name, rating, and reviews

### 2. Product Community Forums
- Dedicated forum for each product/strain
- Icon-based visual identification
- Real-time stats (posts, active users, online users)
- Member counts and activity indicators
- Quick access to discussions

### 3. Product Detail Pages
- Comprehensive product information
- Cannabinoid profile (THC/CBD percentages)
- Effects and flavor profiles
- Cultivator information
- Community reviews and ratings
- Tabbed interface (Overview, Reviews, Community Discussion)

### 4. Product-Specific Forums
- Pinned discussions for important topics
- Sortable by recent, popular, active, or unanswered
- View counts and reply counts
- Last reply timestamps
- Pagination support

### 5. Dispensary Finder
- Search by name and location
- Filter by open status
- Sort by rating, distance, or reviews
- Specialty tags (Premium Flower, Organic, etc.)
- Distance display
- Real-time open/closed status

### 6. Strain Discovery & Reviews
- Advanced filtering by type (Sativa, Indica, Hybrid)
- Search functionality
- Sort by rating or review count
- Effects tag display
- THC percentage information
- Direct link to reviews and discussions

## Component Structure

```
src/
├── components/
│   ├── hero.tsx                 # Landing hero section
│   ├── product-gallery.tsx      # Revolving product carousel
│   ├── product-forums.tsx       # Product community grid
│   ├── news-feed.tsx            # Latest news and updates
│   ├── footer.tsx               # Site footer
│   └── ... (other components)
├── app/
│   ├── page.tsx                 # Homepage
│   ├── products/
│   │   ├── page.tsx             # Products listing
│   │   └── [slug]/
│   │       ├── page.tsx         # Product detail
│   │       └── forum/
│   │           └── page.tsx     # Product forum
│   ├── dispensaries/
│   │   └── page.tsx             # Dispensary finder
│   ├── reviews/
│   │   └── page.tsx             # Strain discovery & reviews
│   └── ... (other routes)
└── styles/
    └── globals.css              # Tailwind configuration
```

## UI Components

### Component Classes (Tailwind)
- `.glassmorphism` - Semi-transparent cards with blur effect
- `.card-elevated` - Elevated card style
- `.accent-glow` - Hover glow effect
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.btn-accent` - Yellow accent button
- `.badge` - Tag/badge element
- `.badge-red` - Red badge variant
- `.badge-yellow` - Yellow badge variant
- `.heading-lg` - Large heading (4xl-5xl)
- `.heading-md` - Medium heading (2xl-3xl)
- `.text-muted` - Muted text color

## Animation Effects

Using Framer Motion for smooth animations:
- Product carousel transitions
- Page fade-in effects
- Staggered list item animations
- Hover scale and color effects
- Tab transitions

## Responsive Design

- Mobile-first approach
- Grid layouts adapt from 1-3 columns
- Touch-friendly buttons and interactions
- Optimized spacing for all screen sizes
- Readable typography at all breakpoints

## Future Enhancement Ideas

1. **Dark/Light Mode Toggle** - Add theme switcher
2. **Product Notifications** - Subscribe to strain availability
3. **Growth Analytics** - Track community discussions
4. **Advanced Search** - Full-text search across strains and reviews
5. **User Badges** - Community trust indicators
6. **Social Features** - Follow users and strains
7. **Price Tracking** - Monitor strain pricing
8. **Mobile App** - React Native companion app
9. **AI Recommendations** - Strain suggestions based on preferences
10. **Live Chat** - Real-time community discussions

## Performance Optimizations

- Image optimization with Next.js Image component
- Lazy loading for heavy components
- React Query for efficient data fetching
- Memoized components for rendering optimization
- CSS-in-JS with Tailwind for minimal bundle size

## Accessibility

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Color contrast ratios meet WCAG standards
- Focus indicators on interactive elements

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)
