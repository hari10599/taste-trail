# Taste Trail - Render Deployment Guide

Complete guide to deploy Taste Trail (Next.js + PostgreSQL) to Render.com

## 📋 Prerequisites

- Git repository (✅ Already done)
- Render account (free tier available)
- GitHub account for repository hosting

## 🚀 Step-by-Step Deployment

### Step 1: Push Repository to GitHub

1. **Create GitHub Repository**
   ```bash
   # If you haven't already, create a new repository on GitHub
   # Then add it as remote origin
   git remote add origin https://github.com/YOUR_USERNAME/taste-trail.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy PostgreSQL Database on Render

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Sign up/Login to your account

2. **Create PostgreSQL Database**
   - Click **"+ New"** → **"PostgreSQL"**
   - Fill in the details:
     - **Name**: `taste-trail-db`
     - **Database**: `tastetrailv2` (matches your schema)
     - **User**: `postgres` (or leave default)
     - **Region**: Choose closest to your location
   - **Instance Type**: 
     - Free tier: Select "Free" (1GB storage, expires after 30 days)
     - Paid: Choose based on your needs
   - Click **"Create Database"**

3. **Get Database Connection Details**
   - After creation, go to your database's **Info** page
   - Copy the **Internal Database URL** (for best performance)
   - Format: `postgresql://username:password@hostname:port/database`

### Step 3: Deploy Next.js Application

1. **Create Web Service**
   - Click **"+ New"** → **"Web Service"**
   - Connect your GitHub repository
   - Select the `taste-trail` repository

2. **Configure Build Settings**
   ```yaml
   # Build settings
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Set Environment Variables**
   Go to **Environment** tab and add:
   ```
   # Database
   DATABASE_URL=<paste-your-render-postgres-internal-url>

   # JWT Secrets (generate strong secrets)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

   # Next.js
   NEXTAUTH_URL=https://your-app-name.onrender.com
   NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production
   NODE_ENV=production

   # Optional: Email settings (if you want email features)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@tastetrail.com

   # Optional: ImageKit (for image uploads)
   IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
   IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
   ```

4. **Advanced Settings**
   - **Instance Type**: Free tier or paid based on needs
   - **Region**: Same as your database
   - **Auto-Deploy**: Enable (deploys automatically on git push)

### Step 4: Database Migration

1. **Add Build Hook for Prisma**
   Update your `package.json` scripts:
   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma db push && next build",
       "postinstall": "prisma generate"
     }
   }
   ```

2. **Alternative: Manual Migration**
   If the above doesn't work, you can run migrations manually:
   - Use Render's **Shell** feature
   - Or connect to your database externally and run:
   ```bash
   npx prisma db push
   npx prisma db seed  # Optional: seed initial data
   ```

### Step 5: Domain and SSL

1. **Custom Domain** (Optional)
   - Go to **Settings** → **Custom Domains**
   - Add your domain
   - Configure DNS records as shown

2. **SSL Certificate**
   - Automatically provided by Render
   - No additional configuration needed

## 🔧 Configuration Files

### 1. Update next.config.js for Production

Create or update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['ik.imagekit.io'], // Add your image domains
  },
  // For Render deployment
  output: 'standalone',
}

module.exports = nextConfig
```

### 2. Add Dockerfile (Optional - for better control)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 🔐 Security Considerations

### Environment Variables Checklist
- [ ] Strong JWT secrets (use password generator)
- [ ] Secure database password
- [ ] Production NEXTAUTH_URL
- [ ] Enable HTTPS only in production

### Database Security
- [ ] Use internal database URL for better performance
- [ ] Restrict database access to your application only
- [ ] Regular backups (available in paid plans)

## 📊 Monitoring and Maintenance

### Render Features
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and request metrics
- **Health Checks**: Automatic health monitoring
- **Scaling**: Easy horizontal scaling

### Database Management
- **Backups**: Automatic daily backups (paid plans)
- **Monitoring**: Query performance and connection pooling
- **Scaling**: Upgrade instance type as needed

## 💰 Cost Estimation

### Free Tier
- **Web Service**: 750 hours/month (sleeps after 15 min inactivity)
- **PostgreSQL**: 1GB storage, expires after 30 days
- **Total**: $0/month

### Production Tier (Recommended)
- **Web Service**: $7-25/month (based on instance size)
- **PostgreSQL**: $7-15/month (based on storage and instance)
- **Total**: ~$15-40/month

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check if all dependencies are in package.json
   npm install
   npm run build  # Test locally first
   ```

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Use internal database URL, not external
   - Check if database is in same region

3. **Prisma Issues**
   ```bash
   # Regenerate Prisma client
   npx prisma generate
   npx prisma db push
   ```

4. **Environment Variables**
   - Double-check all required env vars are set
   - No spaces around the = sign
   - Use production URLs in production

### Debug Steps
1. Check Render logs for error messages
2. Verify all environment variables
3. Test database connection
4. Check build output for errors

## 🎉 Post-Deployment

### Verify Deployment
1. **Database**: Check tables were created correctly
2. **Authentication**: Test login/register functionality  
3. **Features**: Test core features like restaurants, reviews, map
4. **Performance**: Check page load times

### Optional Enhancements
1. **CDN**: Enable Render's CDN for better performance
2. **Monitoring**: Set up external monitoring (e.g., UptimeRobot)
3. **Analytics**: Add analytics tracking
4. **Backup Strategy**: Regular database exports

## 📞 Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)
- **Status**: [status.render.com](https://status.render.com)

---

Your Taste Trail application will be live at: `https://your-app-name.onrender.com`

**Next Steps**: After deployment, test all features and monitor performance metrics in the Render dashboard.