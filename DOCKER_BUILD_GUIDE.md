
# Docker Build Guide for CVLab Frontend

This guide explains how to build and deploy the CVLab frontend with Docker, including the dynamic profile page functionality.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)
- `.env.production` file configured with all required environment variables

## Environment Variables

The following environment variables are required for the build and runtime:

### Build-time Variables (NEXT_PUBLIC_*)
These are baked into the frontend bundle during build:

```env
NEXT_PUBLIC_SITE_URL=https://cvlab.sa
NEXT_PUBLIC_API_URL=https://cvlab.sa/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_UPLOAD_API_URL=/api/upload
```

### Runtime Variables
These are needed during container runtime:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=me-central-1
S3_BUCKET=your_bucket_name
```

## Building the Docker Image

### Option 1: Using Docker Compose (Recommended)

Ensure your `.env.production` file contains all the variables listed above, then run:

```bash
# Build and start the container
docker-compose up -d --build

# View logs
docker-compose logs -f cvlab

# Stop the container
docker-compose down
```

### Option 2: Using Docker CLI

```bash
# Build the image with build arguments
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://cvlab.sa \
  --build-arg NEXT_PUBLIC_API_URL=https://cvlab.sa/api \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key \
  --build-arg NEXT_PUBLIC_UPLOAD_API_URL=/api/upload \
  -t cvlab-frontend:latest \
  .

# Run the container
docker run -d \
  --name cvlab-app \
  -p 8001:8001 \
  --env-file .env.production \
  cvlab-frontend:latest
```

## Multi-Stage Build Explanation

The Dockerfile uses a 3-stage build process:

1. **Dependencies Stage**: Installs npm packages
2. **Builder Stage**: Builds the Next.js application with environment variables
3. **Runner Stage**: Minimal runtime image with only production files

### Stage Details

#### Stage 1: Dependencies
- Uses `node:20-alpine` for small image size
- Installs all dependencies via `npm ci --legacy-peer-deps`
- Creates reusable node_modules layer

#### Stage 2: Builder
- Copies dependencies from stage 1
- Receives build arguments for NEXT_PUBLIC_* variables
- Builds Next.js in production mode with `output: 'standalone'`
- Generates optimized bundles

#### Stage 3: Runner
- Minimal production image
- Runs as non-root user (nextjs:1001)
- Only includes necessary files:
  - `public/` directory
  - `.next/standalone/` (server files)
  - `.next/static/` (static assets)

## Dynamic Profile Page Features

The updated Docker build ensures the following profile features work correctly:

✅ **Dynamic User Data**
- First name, last name from Supabase `user_metadata.full_name`
- Email from Supabase `user.email`
- Avatar from `user_metadata.avatar_url` or `user_metadata.picture`

✅ **Account Information**
- Member since date from `user.created_at`
- Last active time from `user.last_sign_in_at`

✅ **Account Actions**
- Logout functionality via Supabase auth
- Delete account (with confirmation dialog)

All of these features require proper Supabase configuration at build time.

## Verifying the Build

After building and starting the container:

```bash
# Check if container is running
docker ps | grep cvlab

# Check container logs
docker logs cvlab-app

# Test the application
curl http://localhost:8001

# Check health status
docker inspect cvlab-app | grep -A 5 Health
```

## Troubleshooting

### Build Fails with "Module not found"
- Ensure `npm ci --legacy-peer-deps` completed successfully
- Check that all dependencies in `package.json` are compatible

### Profile Page Shows Empty Data
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
- Check browser console for Supabase connection errors

### Environment Variables Not Available
- Build-time variables (NEXT_PUBLIC_*) must be passed as `--build-arg`
- Runtime variables must be in `.env.production` or passed via `-e`
- Remember: Next.js bakes NEXT_PUBLIC_* into the bundle at build time

### Image Size Too Large
- The multi-stage build should keep the final image under 300MB
- Use `docker images cvlab-frontend` to check size
- If too large, verify `.dockerignore` is excluding unnecessary files

## Production Deployment

For production deployment:

1. **Ensure .env.production is configured** with actual production values
2. **Build with production URLs**:
   ```bash
   docker-compose -f docker-compose.yml build
   ```
3. **Start the container**:
   ```bash
   docker-compose up -d
   ```
4. **Set up reverse proxy** (nginx, Caddy, etc.) to handle HTTPS
5. **Monitor logs** for any errors:
   ```bash
   docker-compose logs -f
   ```

## Health Check

The container includes a health check that:
- Runs every 30 seconds
- Checks if the app responds on port 8001
- Marks unhealthy after 3 failed attempts
- Waits 40 seconds before starting checks

Monitor health status:
```bash
docker inspect cvlab-app --format='{{.State.Health.Status}}'
```

## Security Notes

- Container runs as non-root user (nextjs:1001)
- Only necessary files are included in final image
- Secrets should be passed via environment variables, not baked into image
- Use Docker secrets or environment variable injection in production
- Never commit `.env.production` to version control

## Updating the Application

To deploy updates:

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Clean up old images
docker image prune -f
```

## Support

For issues with:
- Docker build: Check this guide and Docker logs
- Profile functionality: Verify Supabase configuration
- Environment variables: Ensure all required vars are set

For production issues, check:
1. Container logs: `docker-compose logs cvlab`
2. Health status: `docker inspect cvlab-app`
3. Supabase dashboard for auth issues
4. Network connectivity to Supabase
