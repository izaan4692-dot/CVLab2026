# Production Setup for cvlab.sa

## Port Configuration

- **Frontend (Next.js)**: Port 8001
- **Backend (FastAPI)**: Port 8002

## Configuration Files Updated

### Backend
- `backend.env.production`: APP_PORT=8002
- `backend/docker-compose.prod.yml`: Maps external port 8002 to internal port 8000

### Frontend
- `frontend/docker-compose.yml`: Maps external port 8001 to internal port 8001
- `frontend/Dockerfile`: EXPOSE 8001, ENV PORT=8001

### Nginx
- `nginx.conf`: Configured for cvlab.sa domain
  - Frontend: `http://localhost:8001`
  - Backend API: `http://localhost:8002` (via `/api/` location)

## Deployment Steps

1. **Copy nginx configuration**:
   ```bash
   sudo cp nginx.conf /etc/nginx/conf.d/cvlab.conf
   sudo nginx -t
   sudo systemctl restart nginx
   ```

2. **Start Backend**:
   ```bash
   cd backend
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   docker-compose up -d
   ```

4. **Verify Services**:
   - Frontend: `http://localhost:8001` or `http://cvlab.sa`
   - Backend API: `http://localhost:8002/api/v1` or `http://cvlab.sa/api/v1`

## Environment Variables

Make sure `NEXT_PUBLIC_API_URL` is set to `https://cvlab.sa/api` in your frontend `.env.production` file.

## SSL/HTTPS Setup

When ready to enable HTTPS:
1. Install certbot: `sudo apt-get install certbot python3-certbot-nginx`
2. Get certificate: `sudo certbot --nginx -d cvlab.sa -d www.cvlab.sa`
3. Uncomment the HTTPS server block in `/etc/nginx/conf.d/cvlab.conf`
4. Reload nginx: `sudo systemctl reload nginx`

