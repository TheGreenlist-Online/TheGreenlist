# THEBLACKLIST

**Your trusted cannabis community platform for strains, reviews, and dispensary discoveries.**

## Overview

THEBLACKLIST is a modern, consumer-focused cannabis community platform featuring:

- **Revolving Product Gallery** - Browse featured cannabis products with interactive carousel
- **Community Forums** - Dedicated discussion channels for each strain and product
- **Strain Discovery** - Comprehensive strain database with effects, THC/CBD info, and reviews
- **Dispensary Finder** - Search and discover nearby dispensaries with ratings
- **Community Reviews** - Real user feedback on strains, products, and experiences
- **Product Discussions** - Active forums for sharing tips, effects, and recommendations

## Visual Design

### Aesthetic
- **Dark Masculine**: Professional, clean interface targeted at cannabis consumers
- **Color Palette**: Deep greens (#2d5a3d), premium blacks (#0f1419), accent reds (#c41e3a), highlight yellows (#f4d03f)
- **Modern UI**: Glassmorphism effects, smooth animations, responsive design
- **High Contrast**: Easy readability with carefully chosen color combinations

## Legal Compliance

This platform **does not** facilitate cannabis commerce, sales, payments, or distribution. All functionality is focused on community discussion, consumer education, and product reviews.

## Tech Stack

**Frontend:**
- Next.js 14.2.25 with TypeScript
- React 18
- Tailwind CSS (custom dark theme)
- Framer Motion (animations)
- React Query (data fetching)

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Supabase (storage)

**Authentication:**
- Clerk

**Deployment:**
- Vercel (production ready)
- Docker support

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase)
- Clerk account
- npm or yarn

### Installation

1. **Clone repository:**
```bash
git clone https://github.com/That1andOnly/TheBlacklist.git
cd TheBlacklist
```

2. **Install dependencies:**
```bash
npm install --legacy-peer-deps
```

3. **Environment setup:**
```bash
cp .env.example .env.local
```

4. **Configure environment variables:**
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

5. **Initialize database:**
```bash
npx prisma generate
npx prisma db push
```

6. **Start development server:**
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Platform Features

### 1. Home Page
- Hero section with value proposition
- Revolving product gallery
- Product community forums grid
- Latest news and updates

### 2. Products
**Main Products Page:**
- Featured product gallery with carousel
- Product community overview

**Individual Product Pages:**
- Comprehensive product details
- Cannabinoid profile (THC/CBD %)
- Effects and flavor profiles
- Cultivator information
- Tabbed interface (Overview, Reviews, Discussion)

### 3. Product Forums
- Dedicated forum for each strain
- Real-time discussion stats
- Pinned important threads
- Search and sort options

### 4. Dispensaries
- Search by location
- Filter and sort options
- Specialty tags
- Open/closed status

### 5. Strain Discovery
- Browse all strains
- Filter by type (Sativa, Indica, Hybrid)
- Rate and review strains
- Effect tags

## Database Schema

The platform uses Prisma ORM with PostgreSQL. Key models include:

- `User`: Platform users
- `Post`: Forum posts
- `Comment`: Threaded comments
- `Business`: Dispensary profiles

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Deployment

### Vercel (Recommended)

```bash
# Deploy automatically from main branch
npm run build
npm start
```

### Docker

```bash
docker build -t theblacklist .
docker run -p 3000:3000 theblacklist
```

## Security

- HTTPS only in production
- Rate limiting on API routes
- CSRF protection
- SQL injection prevention
- Secure password handling via Clerk

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14.1+
- Edge 90+
- Mobile browsers

## Legal Disclaimer

THEBLACKLIST is a **consumer community and review platform only**. We do not:
- Sell, distribute, or facilitate cannabis transactions
- Process payments for cannabis
- Coordinate delivery or sales

This platform is for information sharing and community discussion in jurisdictions where cannabis is legal.

## License

MIT License - see [LICENSE](LICENSE) file
