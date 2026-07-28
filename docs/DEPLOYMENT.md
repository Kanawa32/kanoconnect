# Deployment Guide

## Docker Deployment

### Production
```bash
docker-compose -f docker-compose.yml up -d
```

### Environment Setup
1. Copy `.env.example` to `.env` in both `backend/` and `frontend/`
2. Update all environment variables
3. Ensure MongoDB and Redis are accessible

## Manual Deployment

### Backend
```bash
cd backend
npm ci --only=production
npm start
```

### Frontend
```bash
cd frontend
npm ci
npm run build
# Serve dist/ folder with nginx
```

## SSL/HTTPS

Use Let's Encrypt with certbot:
```bash
certbot --nginx -d your-domain.com
```

## Monitoring

- Use PM2 for process management
- Configure Winston logs to external service
- Set up MongoDB backups
- Monitor Socket.IO connections
