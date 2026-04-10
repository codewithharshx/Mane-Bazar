# ✅ Production Readiness Checklist

**Complete checklist for deploying Mane Bazar to production**

---

## 🔐 Security

- [ ] Change default admin password (admin@manebazar.com / Admin@123)
- [ ] Generate strong JWT secrets (minimum 64 characters)
  - [ ] JWT_SECRET
  - [ ] JWT_REFRESH_SECRET
- [ ] Set `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=strict`
- [ ] Enable HTTPS (SSL/TLS certificate via Let's Encrypt)
- [ ] Update CORS whitelist to production domains only
- [ ] Set `NODE_ENV=production`
- [ ] Implement rate limiting for all public endpoints
- [ ] Enable helmet security headers
- [ ] Set up Web Application Firewall (WAF)
- [ ] Disable stack trace in production (already done in errorMiddleware)
- [ ] Enable HTTP-only cookies for refresh tokens
- [ ] Implement CSRF protection if using form submissions
- [ ] Set up security headers (CSP, X-Frame-Options, etc.)

---

## 🗄️ Database

- [ ] Migrate from MongoDB Memory Server to MongoDB Atlas
  - [ ] Create Atlas cluster
  - [ ] Get production connection string
  - [ ] Update MONGO_URI in production `.env`
  - [ ] Set `MONGODB_MEMORY_SERVER=false`
- [ ] Create database backups (daily recommended)
- [ ] Enable database authentication (username/password)
- [ ] Restrict database access by IP whitelist
- [ ] Set up database monitoring
- [ ] Enable automatic backups
- [ ] Test backup restore process
- [ ] Index frequently queried fields
- [ ] Monitor database performance and optimize slow queries

---

## 🔑 Third-Party Integrations

### Google OAuth
- [ ] Update OAuth consent screen to "Production"
- [ ] Add production domain to OAuth redirect URIs
- [ ] Use production Google Client ID and Secret
- [ ] Set up privacy policy page (required for production apps)
- [ ] Add terms of service page

### Razorpay
- [ ] Switch from test keys to live keys (only after KYC verification)
- [ ] Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
- [ ] Set up webhook endpoint for payment notifications
- [ ] Test webhook delivery
- [ ] Configure email notifications for payments
- [ ] Set up SMS notifications for orders

### Email Service (Optional)
- [ ] Configure SMTP server for order notifications
- [ ] Set up transactional email provider (SendGrid, Mailgun, etc.)
- [ ] Create email templates
- [ ] Test email delivery
- [ ] Set up email logging

---

## 📧 Frontend

- [ ] Run production build: `npm run build`
- [ ] Verify all environment variables in `.env.local`
- [ ] Test Google OAuth login
- [ ] Test Razorpay payment flow
- [ ] Verify error handling and user feedback
- [ ] Test on multiple browsers
- [ ] Set up analytics (Google Analytics, Mixpanel, etc.)
- [ ] Configure error logging (Sentry, LogRocket, etc.)
- [ ] Optimize images and assets
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Enable service worker for offline support (optional)
- [ ] Add PWA manifest (optional)

---

## 🖥️ Backend

- [ ] Install production dependencies only
- [ ] Test all API endpoints
- [ ] Verify authentication and authorization
- [ ] Test rate limiting
- [ ] Verify all environment variables are set
- [ ] Set up error logging (Winston, Sentry, etc.)
- [ ] Configure application monitoring (New Relic, Datadog, etc.)
- [ ] Set up performance monitoring
- [ ] Test database connection pooling
- [ ] Implement request/response logging
- [ ] Set up API documentation (Swagger/OpenAPI)

---

## 🚀 Deployment

### Infrastructure
- [ ] Choose hosting platform (Vercel, Heroku, AWS, DigitalOcean, etc.)
- [ ] Set up production server(s)
- [ ] Configure auto-scaling if applicable
- [ ] Set up load balancing
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up SSL/TLS certificates (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Set up VPC/private subnets for security
- [ ] Enable DDoS protection

### CI/CD
- [ ] Set up GitHub Actions or similar CI/CD
- [ ] Automate testing on every push
- [ ] Automate linting and code quality checks
- [ ] Automate deployment to staging
- [ ] Automate deployment to production
- [ ] Set up automated backups before deployment
- [ ] Enable blue-green deployment strategy

### Monitoring & Logging
- [ ] Set up application monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Set up log aggregation (ELK Stack, Splunk, etc.)
- [ ] Configure alerting for critical errors
- [ ] Set up performance monitoring
- [ ] Configure email/SMS alerts for critical issues

---

## 📊 Performance

- [ ] Minify and bundle JavaScript/CSS
- [ ] Optimize images (WebP format, lazy loading)
- [ ] Enable gzip compression on server
- [ ] Set up CDN for static assets
- [ ] Optimize database queries
- [ ] Implement caching (Redis/Memcached)
- [ ] Use connection pooling for database
- [ ] Enable browser caching headers
- [ ] Optimize API response times (< 200ms target)
- [ ] Load test the application
- [ ] Monitor and optimize Core Web Vitals

---

## 🧪 Testing

- [ ] Run unit tests: `npm test`
- [ ] Run integration tests
- [ ] Run end-to-end tests
- [ ] Test auth flow (register, login, refresh, logout)
- [ ] Test payment flow (create order, verify payment)
- [ ] Test admin dashboard
- [ ] Test order management
- [ ] Test product catalog
- [ ] Test cart and checkout
- [ ] Test error scenarios
- [ ] Load test (1000+ concurrent users)
- [ ] Security penetration testing
- [ ] Test on target devices (mobile, tablet, desktop)

---

## 📱 Mobile Optimization

- [ ] Verify responsive design on all screens
- [ ] Test touch interactions
- [ ] Verify Google OAuth works on mobile
- [ ] Test payment flow on mobile browsers
- [ ] Optimize images for mobile
- [ ] Test performance on 3G/4G networks
- [ ] Configure viewport meta tags
- [ ] Test native app wrapper if applicable

---

## 🔔 Monitoring & Alerting

- [ ] Set up uptime monitoring
- [ ] Set up error alerting
- [ ] Set up performance monitoring
- [ ] Set up database monitoring
- [ ] Create alert runbooks
- [ ] Test alert notification channels
- [ ] Set up on-call rotation
- [ ] Document incident response procedures

---

## 📚 Documentation

- [ ] Create API documentation
- [ ] Document deployment process
- [ ] Document rollback procedures
- [ ] Create troubleshooting guide
- [ ] Document architecture and design decisions
- [ ] Create runbook for common issues
- [ ] Document admin procedures
- [ ] Create user onboarding guide

---

## 🚨 Pre-Launch

- [ ] Final security audit
- [ ] Final performance audit
- [ ] Create backup of all data
- [ ] Test backup restore process
- [ ] Brief team on deployment
- [ ] Prepare rollback plan
- [ ] Notify customers of launch
- [ ] Monitor closely for first 24 hours

---

## ✨ Post-Launch

- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Fix any critical issues
- [ ] Optimize based on real-world data
- [ ] Gather and act on user feedback
- [ ] Plan future improvements
- [ ] Celebrate launch! 🎉

---

## 🛠️ Tools & Services Checklist

- [ ] GitHub (version control)
- [ ] GitHub Actions (CI/CD)
- [ ] MongoDB Atlas (database)
- [ ] Google Cloud Console (OAuth)
- [ ] Razorpay Dashboard (payments)
- [ ] Vercel or similar (frontend hosting)
- [ ] Docker Hub (container registry)
- [ ] Sentry (error tracking)
- [ ] DataDog or New Relic (monitoring)
- [ ] Cloudflare or similar (CDN, DDoS protection)
- [ ] SendGrid or Mailgun (email)
- [ ] Twilio (SMS notifications)
- [ ] Let's Encrypt (SSL certificates)

---

**Status**: In Progress
**Last Updated**: April 2026
**Target Launch**: Ready when all items are checked
