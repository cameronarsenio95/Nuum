# NUUM Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account and project set up
- Domain configured (optional)

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Database Setup

1. Run all migrations in order:
   ```bash
   # In Supabase SQL Editor, execute migrations in order from:
   supabase/migrations/
   ```

2. Verify RLS policies are enabled on all tables

3. Create initial support staff account (if needed):
   ```sql
   SELECT create_support_account('admin@nuum.app', 'admin');
   ```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Access at `http://localhost:5173`

## Production Build

1. Build for production:
   ```bash
   npm run build
   ```

2. Preview production build:
   ```bash
   npm run preview
   ```

3. Build output is in `dist/` directory

## Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Add environment variables in Netlify dashboard

### Option 3: Custom Server

1. Build the project:
   ```bash
   npm run build
   ```

2. Copy `dist/` contents to your web server

3. Configure web server to:
   - Serve `index.html` for all routes (SPA)
   - Set appropriate cache headers
   - Enable gzip/brotli compression
   - Add security headers

#### Nginx Configuration Example:

```nginx
server {
    listen 80;
    server_name nuum.app;
    root /var/www/nuum/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test authentication flow (signup, login, logout)
- [ ] Test dashboard functionality
- [ ] Verify Supabase connection works
- [ ] Check database queries and RLS policies
- [ ] Test file upload functionality
- [ ] Verify email notifications (if configured)
- [ ] Test on multiple devices and browsers
- [ ] Run Lighthouse audit for performance
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure CDN (optional)

## Monitoring

### Production Monitoring Tools

1. **Supabase Dashboard**
   - Monitor database performance
   - Check API usage
   - Review logs

2. **Browser Performance**
   - Run Lighthouse audits regularly
   - Monitor Core Web Vitals
   - Check bundle size

3. **Error Tracking** (Recommended)
   - Sentry
   - LogRocket
   - Rollbar

## Backup Strategy

### Database Backups

Supabase provides automatic daily backups. For additional safety:

1. Set up manual backup script:
   ```bash
   # Export database
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

2. Store backups in secure location (S3, Google Cloud Storage)

### Storage Backups

Content media is stored in Supabase Storage. Consider:
- Enabling versioning
- Setting up cross-region replication
- Regular exports of critical content

## Scaling Considerations

### Database

- Monitor query performance using Supabase dashboard
- Add indexes for frequently queried columns (already included in migrations)
- Consider read replicas for high traffic
- Upgrade Supabase plan as needed

### Frontend

- Use CDN for static assets
- Enable HTTP/2
- Implement service worker for offline support
- Consider edge functions for dynamic content

## Support

For deployment issues:
- Check Supabase status: https://status.supabase.com
- Review application logs
- Contact support: support@nuum.app

## Security Notes

1. Never commit `.env` file to git
2. Rotate API keys regularly
3. Enable 2FA for all admin accounts
4. Review Supabase RLS policies periodically
5. Keep dependencies updated
6. Monitor for security vulnerabilities

## Updates

To update the application:

1. Pull latest changes
2. Install new dependencies: `npm install`
3. Run new migrations (if any)
4. Build and deploy: `npm run build`
5. Clear CDN cache (if applicable)
