# The Green List

A cannabis transparency, accountability, education, reporting, news, forum, and community trust platform.

Primary production domain: https://thegreenlist.online
Secondary domain: https://greenlist.online

## Overview

The Green List is a civic-tech platform designed to provide transparency, accountability, and community oversight for the cannabis industry. The platform facilitates public reporting, consumer education, business transparency, forums, and investigative journalism while maintaining strict legal compliance.

## Features

- **Forum System**: Community-driven discussions across specialized cannabis topics
- **Transparency Reports**: Public reporting of industry issues and discrepancies
- **Business Directory**: Business profiles and community trust signals
- **News Aggregation**: AI-powered news summaries and investigative content
- **User Analytics**: Personal transparency and contribution tracking
- **AI Moderation**: Automated content moderation with human oversight
- **Sponsored Disclosures**: FTC-compliant sponsored content and affiliate disclosures

## Legal Compliance

IMPORTANT: This platform is designed for transparency, education, reporting, news, forums, accountability, and community trust only. It does not facilitate, enable, or participate in cannabis commerce.

- No direct sales or transactions
- No ordering or delivery coordination
- No checkout or payment processing for cannabis products
- No inventory management
- No dispensary transactions
- All affiliate links redirect externally
- Clear FTC disclosures on sponsored content

## Tech Stack

- **Frontend**: Next.js App Router, React, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth**: Supabase Auth with server-verified sessions and PostgreSQL RLS
- **Database**: Supabase/PostgreSQL with Prisma
- **Storage**: Supabase
- **AI**: OpenAI API for moderation and summarization
- **Deployment**: Vercel, Docker, GitHub Actions
- **Infrastructure**: Porkbun DNS, Redis-compatible cache where configured

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/TheBlacklistOnline/TheBlacklist.git
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
3. **Set up PostgreSQL database** (recommended: Supabase)
4. **Add production domains**: `thegreenlist.online` and `greenlist.online`
5. **Deploy**

### Docker Deployment

```bash
# Build the Docker image
docker build -t thegreenlist .

# Run with Docker Compose
docker-compose up -d
```

### Environment Configuration

See `.env.example` for all required environment variables.

### Domain Setup

1. **Purchase/manage domains** through Porkbun
2. **Configure DNS** records as per `docs/dns-setup.md`
3. **Set up SSL** via Vercel
4. **Use the primary domain** `thegreenlist.online`; keep `greenlist.online` as the secondary/backup domain

### Auth and Supabase Redirects

When configuring auth providers or Supabase redirect allowlists, include:

- `https://thegreenlist.online`
- `https://greenlist.online`
- `https://thegreenlist.online/auth/callback` if callback routes are used
- `https://greenlist.online/auth/callback` if callback routes are used
- `http://localhost:3000` and local callback URLs already used in development

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
- Sponsored disclosure infrastructure

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

- Supabase Auth client/server flows under `/auth/*`
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

For support, email support@thegreenlist.online or join our community forums.

## Disclaimer

The Green List is not affiliated with any cannabis businesses, dispensaries, or sales platforms. All content is user-generated and for informational, educational, transparency, and accountability purposes only. Users should consult local laws regarding cannabis use and purchase.
