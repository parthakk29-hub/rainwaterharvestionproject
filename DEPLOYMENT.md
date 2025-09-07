# Deploying to Vercel

## Prerequisites

1. A Vercel account
2. Neon PostgreSQL database (or compatible PostgreSQL service)
3. Environment variables configured

## Environment Variables Required

Add these environment variables in your Vercel dashboard:

```bash
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production

# If using authentication (Replit OAuth):
# Add any additional OAuth credentials if needed
```

## Deployment Steps

1. **Connect your repository to Vercel**
   - Go to vercel.com
   - Import your project from GitHub/GitLab
   - Vercel will automatically detect the configuration from `vercel.json`

2. **Configure Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add `DATABASE_URL` with your Neon/PostgreSQL connection string
   - Add any other required environment variables

3. **Deploy**
   - Vercel will automatically build and deploy your application
   - The build process runs: `vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`

## Database Setup

1. **Create a Neon Database** (recommended for Vercel)
   - Go to console.neon.tech
   - Create a new project
   - Copy the connection string

2. **Run Database Migrations**
   ```bash
   npm run db:push
   ```

## Project Structure on Vercel

- Frontend: Static files served from `/dist/public/`
- API: Serverless functions from `/dist/index.js`
- Routes: All `/api/*` routes handled by the backend
- Static files: Everything else served from the frontend build

## Notes

- The application uses a single-server architecture that works well with Vercel's serverless functions
- Weather API integration with Open-Meteo (no API key required)
- Real-time features may be limited due to serverless nature
- PostgreSQL connection pooling is handled by Neon/Drizzle

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Ensure `DATABASE_URL` is correctly set in Vercel environment variables
   - Check that your database is accessible from Vercel's edge network

2. **Build Errors**
   - Ensure all dependencies are listed in `package.json`
   - Check that TypeScript compilation succeeds locally

3. **API Route Issues**
   - Verify that API routes are prefixed with `/api/`
   - Check serverless function timeout limits (30s max)

4. **Static File Issues**
   - Ensure static assets are in the correct build output directory
   - Check that asset paths are correctly configured

### Performance Optimization for Vercel:

- Database queries are optimized for serverless cold starts
- Weather data caching implemented to reduce API calls
- Static assets are automatically optimized by Vercel

## Manual Deployment Commands

If needed, you can deploy manually:

```bash
# Build the project
npm run build

# Deploy to Vercel (after installing Vercel CLI)
vercel --prod
```