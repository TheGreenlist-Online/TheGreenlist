# THEBLACKLIST.ONLINE

A cannabis industry transparency network and public accountability platform.

## Overview

THEBLACKLIST.ONLINE is a civic-tech platform designed to provide transparency, accountability, and community oversight for the cannabis industry. The platform facilitates public reporting, consumer verification, business reviews, and investigative journalism while maintaining strict legal compliance.

## Features

- **Forum System**: Community-driven discussions across specialized cannabis topics
- **Transparency Reports**: Public reporting of industry issues and discrepancies
- **Business Directory**: Verified business profiles with community reviews
- **News Aggregation**: AI-powered news summaries and investigative content
- **User Analytics**: Personal transparency and contribution tracking
- **AI Moderation**: Automated content moderation with human oversight
- **Subscription System**: Tiered access with premium features
- **Affiliate Marketing**: FTC-compliant sponsored content and affiliate links

## Legal Compliance

⚠️ **IMPORTANT**: This platform is designed for transparency and accountability only. It does not facilitate, enable, or participate in cannabis commerce.

- No direct sales or transactions
- No payment processing for cannabis products
- No inventory management
- No delivery coordination
- All affiliate links redirect externally
- Clear FTC disclosures on sponsored content

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth**: NextAuth.js with OAuth providers
- **Database**: PostgreSQL with Prisma
- **Storage**: Supabase
- **AI**: OpenAI API for moderation and summarization
- **Deployment**: Vercel, Docker, GitHub Actions
- **Infrastructure**: Cloudflare, Redis

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/That1andOnly/TheBlacklist.git
   cd TheBlacklist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema to database
   npx prisma db push

   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Schema

The platform uses Prisma ORM with PostgreSQL. Key models include:

- `User`: User accounts and profiles
- `Post`: Forum posts and discussions
- `Forum`: Discussion categories
- `Business`: Business profiles and listings
- `Review`: User reviews and ratings
- `TransparencyReport`: Public accountability reports
- `Ad` & `Affiliate`: Advertising and affiliate content
- `News`: Aggregated news articles
- `Subscription`: User subscription tiers

## Deployment

### Vercel Deployment

1. **Connect your repository to Vercel**
2. **Configure environment variables** in Vercel dashboard
3. **Set up PostgreSQL database** (recommended: Supabase or Vercel Postgres)
4. **Deploy**

### Docker Deployment

```bash
# Build the Docker image
docker build -t theblacklist .

# Run with Docker Compose
docker-compose up -d
```

### Environment Configuration

See `.env.example` for all required environment variables.

### Domain Setup

1. **Purchase domain** from Porkbun
2. **Configure DNS** records as per `docs/dns-setup.md`
3. **Set up SSL** via Cloudflare or Vercel

## Development Phases

### Phase 1: Core Infrastructure
- Authentication system
- Basic forum functionality
- Database setup
- Mobile-responsive UI

### Phase 2: Core Features
- Advanced forum system
- Business profiles
- Review system
- Affiliate infrastructure

### Phase 3: Advanced Features
- AI moderation
- Analytics dashboard
- Transparency engine
- News aggregation

### Phase 4: Optimization
- Performance optimization
- SEO implementation
- Security hardening
- Scalability improvements

## API Documentation

API routes are available under `/api/`:

- `POST /api/auth/[...nextauth]` - Authentication
- `GET/POST /api/posts` - Forum posts
- `GET/POST /api/businesses` - Business management
- `POST /api/reports` - Transparency reports
- `GET /api/news` - News aggregation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Security

- Server-side authorization on all protected routes
- Input validation with Zod schemas
- Rate limiting on public endpoints
- Encrypted file uploads
- Audit logging for moderation actions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@theblacklist.online or join our community forums.

## Disclaimer

THEBLACKLIST.ONLINE is not affiliated with any cannabis businesses, dispensaries, or sales platforms. All content is user-generated and for informational purposes only. Users should consult local laws regarding cannabis use and purchase.
TheBlacklist
Redeploy trigger
