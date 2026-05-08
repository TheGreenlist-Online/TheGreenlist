# DNS Configuration for THEBLACKLIST.ONLINE

## Domain Registrar: Porkbun

### Prerequisites
- Domain: theblacklist.online
- Porkbun account with domain ownership
- Vercel account for deployment
- Cloudflare account for CDN/protection

## DNS Records Setup

### Porkbun DNS Configuration

1. Log in to your Porkbun account
2. Go to Domain Management → theblacklist.online
3. Access DNS settings

#### Required Records for Vercel Deployment

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

#### Additional Records

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

### Cloudflare Setup (Optional but Recommended)

1. Sign up for Cloudflare
2. Add theblacklist.online as a site
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
- URL: `https://theblacklist.online/*`
- Setting: Always Use HTTPS

### Email Configuration

Using ProtonMail for support@theblacklist.online:

1. Set up ProtonMail account
2. Configure DNS records as shown above
3. Verify domain ownership

### Verification Steps

1. **DNS Propagation Check**
   ```bash
   nslookup theblacklist.online
   dig theblacklist.online
   ```

2. **SSL Certificate**
   - Vercel automatically provisions SSL
   - Check with: `openssl s_client -connect theblacklist.online:443`

3. **Email Verification**
   - Send test email to support@theblacklist.online
   - Verify DKIM/SPF records

### Troubleshooting

#### DNS Not Propagating
- Wait 24-48 hours for DNS propagation
- Check with multiple DNS checkers (dnschecker.org, whatsmydns.net)
- Verify records are correctly set in Porkbun

#### SSL Issues
- Ensure Vercel deployment is successful
- Check Cloudflare SSL settings if using Cloudflare
- Verify domain is properly configured in Vercel

#### Email Delivery Issues
- Verify all MX/TXT records are correct
- Check SPF/DKIM alignment
- Test with mail-tester.com

### Monitoring

- Set up uptime monitoring (e.g., UptimeRobot)
- Monitor DNS changes
- Regularly check SSL certificate expiration
- Monitor email deliverability

### Backup Configuration

Keep a record of all DNS settings in a secure location for disaster recovery.