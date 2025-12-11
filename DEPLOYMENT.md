# Deployment Guide - Vercel

This guide covers deploying the ValorSales application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A MySQL database (PlanetScale, Railway, or other cloud MySQL provider)
3. Git repository connected to Vercel

## Step 1: Prepare Your Database

### Option A: PlanetScale (Recommended for serverless)

1. Create an account at [PlanetScale](https://planetscale.com)
2. Create a new database
3. Get your connection string from the dashboard
4. The connection string format:
   ```
   mysql://username:password@host/database?sslaccept=strict
   ```

### Option B: Railway

1. Create an account at [Railway](https://railway.app)
2. Create a new MySQL database
3. Copy the `DATABASE_URL` from the connection settings

### Option C: Other MySQL Providers

- Aiven
- DigitalOcean Managed Databases
- AWS RDS

## Step 2: Configure Environment Variables

In your Vercel project settings, add the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Secret for JWT tokens | Generate a random 32+ char string |
| `NEXTAUTH_SECRET` | NextAuth secret (if used) | Generate a random 32+ char string |
| `NEXTAUTH_URL` | Your production URL | `https://your-app.vercel.app` |

### Generate Secure Secrets

Run this command to generate secure secrets:

```bash
openssl rand -base64 32
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npx prisma generate && next build`
   - **Output Directory**: `.next` (default)
5. Add environment variables
6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 4: Run Database Migrations

After your first deployment, run Prisma migrations:

### Option A: Using Vercel CLI

```bash
vercel env pull .env.production.local
npx prisma migrate deploy
```

### Option B: Using Prisma Data Platform

1. Connect your database to [Prisma Data Platform](https://cloud.prisma.io)
2. Run migrations from the dashboard

### Option C: Direct Connection

```bash
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

## Step 5: Seed Initial Data (Optional)

To seed the database with initial data:

```bash
DATABASE_URL="your-production-database-url" npx prisma db seed
```

Or run the manual seed SQL:

```bash
# Connect to your database and run prisma/manual-seed.sql
```

## Build Configuration

### vercel.json (Optional)

Create a `vercel.json` file for custom configuration:

```json
{
  "buildCommand": "npx prisma generate && next build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### package.json Scripts

Ensure your `package.json` has the correct build script:

```json
{
  "scripts": {
    "build": "next build",
    "postinstall": "prisma generate"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Prisma Client Not Generated

**Error**: `PrismaClient is not defined` or `Cannot find module '.prisma/client'`

**Solution**: Add `prisma generate` to your build command or use `postinstall` script:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

#### 2. Database Connection Timeout

**Error**: `Connection timed out` or `ETIMEDOUT`

**Solutions**:
- Ensure your database allows connections from Vercel's IP ranges
- Use connection pooling (PlanetScale has this built-in)
- Add `?connect_timeout=30` to your DATABASE_URL

#### 3. SSL Certificate Issues

**Error**: `SSL certificate problem`

**Solution**: Add SSL parameters to your connection string:
```
mysql://user:pass@host:3306/db?sslaccept=strict
```

#### 4. Function Timeout

**Error**: `FUNCTION_INVOCATION_TIMEOUT`

**Solution**: Optimize your API routes or increase timeout in `vercel.json`:
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

#### 5. Build Memory Issues

**Error**: `JavaScript heap out of memory`

**Solution**: In Vercel project settings, increase the build memory or optimize imports.

### Checking Logs

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Deployments" → Select a deployment
4. Click "Functions" tab to see logs

## Post-Deployment Checklist

- [ ] Verify the application loads correctly
- [ ] Test user authentication (login/logout)
- [ ] Test CRUD operations (create a sale, purchase, etc.)
- [ ] Verify database migrations ran successfully
- [ ] Check API routes are working
- [ ] Test file uploads (if applicable)
- [ ] Set up custom domain (optional)
- [ ] Enable Vercel Analytics (optional)

## Custom Domain Setup

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `NEXTAUTH_URL` environment variable to your new domain

## Continuous Deployment

Vercel automatically deploys when you push to your connected Git repository:

- **Production**: Pushes to `main` branch
- **Preview**: Pushes to other branches

## Environment-Specific Variables

You can set different values for different environments:

- **Production**: Used for production deployments
- **Preview**: Used for preview/staging deployments
- **Development**: Used for local development with `vercel dev`

## Security Recommendations

1. **Never commit `.env` files** to your repository
2. **Rotate secrets** periodically
3. **Use strong passwords** for database access
4. **Enable 2FA** on your Vercel account
5. **Review access logs** regularly

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
