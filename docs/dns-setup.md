# DNS Configuration for The Green List

## Domain Registrar: Porkbun

### Prerequisites
- Primary domain: thegreenlist.online
- Secondary domain: greenlist.online
- Porkbun account with domain ownership
- Vercel account for deployment

## DNS Records Setup

### Porkbun DNS Configuration

1. Log in to your Porkbun account
2. Go to Domain Management for `thegreenlist.online`
3. Repeat the same production setup for `greenlist.online` if it should resolve as a backup domain
4. Access DNS settings

#### Required Records for Vercel Deployment

For each domain connected directly to Vercel:

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 300

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 300
```

If Vercel gives project-specific DNS instructions in the dashboard, follow Vercel's current instructions over this static example.

#### Additional Records

Use your email provider's exact values. Example placeholders:

```
Type: MX
Name: @
Value: mail.protonmail.ch
Priority: 10
TTL: 3600

Type: MX
Name: @
Value: mailsec.protonmail.ch
Priority: 20
TTL: 3600

Type: TXT
Name: @
Value: "protonmail-verification=XXXXXXXXXXXXXXXXXXXX"
TTL: 3600

Type: TXT
Name: @
Value: "v=spf1 include:_spf.protonmail.ch ~all"
TTL: 3600
```

### Vercel Domain Setup

1. Add `thegreenlist.online` as the primary production domain
2. Add `greenlist.online` as a secondary/backup production domain
3. Add `www` variants only if you want them to resolve publicly
4. Set the canonical production URL in environment variables:

```
NEXT_PUBLIC_SITE_URL=https://thegreenlist.online
NEXTAUTH_URL=https://thegreenlist.online
```

### Optional Cloudflare Setup

If Cloudflare is used later for CDN/protection:

1. Add `thegreenlist.online` as a site
2. Add `greenlist.online` if it needs separate Cloudflare management
3. Update Porkbun nameservers to Cloudflare's nameservers
4. Configure Cloudflare settings:

#### SSL/TLS Settings
- SSL/TLS encryption mode: Full (strict)
- Always Use HTTPS: On
- Automatic HTTPS Rewrites: On

#### Speed Settings
- Auto Minify: Enable for HTML, CSS, JS
- Brotli compression: On

#### Security Settings
- Security Level: Medium
- Challenge Passage: 30 minutes
- Browser Integrity Check: On

#### Page Rules (if using Cloudflare)
- URL: `https://thegreenlist.online/*`
- Setting: Always Use HTTPS

### Email Configuration

Using ProtonMail for support@thegreenlist.online:

1. Set up ProtonMail account
2. Configure DNS records as shown by ProtonMail
3. Verify domain ownership

### Auth and Supabase Redirects

When configuring auth providers or Supabase redirect allowlists, include:

```
https://thegreenlist.online
https://greenlist.online
https://thegreenlist.online/auth/callback
https://greenlist.online/auth/callback
http://localhost:3000
http://localhost:3000/auth/callback
```

Only include callback paths that the app actually uses.

### Verification Steps

1. **DNS Propagation Check**
   ```bash
   nslookup thegreenlist.online
   nslookup greenlist.online
   dig thegreenlist.online
   dig greenlist.online
   ```

2. **SSL Certificate**
   - Vercel automatically provisions SSL
   - Check with: `openssl s_client -connect thegreenlist.online:443`

3. **Email Verification**
   - Send test email to support@thegreenlist.online
   - Verify DKIM/SPF records

### Troubleshooting

#### DNS Not Propagating
- Wait 24-48 hours for DNS propagation
- Check with multiple DNS checkers (dnschecker.org, whatsmydns.net)
- Verify records are correctly set in Porkbun

#### SSL Issues
- Ensure Vercel deployment is successful
- Check Cloudflare SSL settings if using Cloudflare
- Verify both domains are properly configured in Vercel

#### Email Delivery Issues
- Verify all MX/TXT records are correct
- Check SPF/DKIM alignment
- Test with mail-tester.com

### Monitoring

- Set up uptime monitoring
- Monitor DNS changes
- Regularly check SSL certificate expiration
- Monitor email deliverability

### Backup Configuration

Keep a record of all DNS settings in a secure location for disaster recovery.
