# Deployment Guide

This document outlines the deployment options and configurations for the Brand Portal application.

## Quick Start

### Development Environment

```bash
# Start development environment with hot reloading
docker-compose -f docker-compose.dev.yml up --build

# Or start individual services
docker-compose -f docker-compose.dev.yml up postgres redis minio
npm run dev
```

### Production Environment

```bash
# Start full production stack
docker-compose --profile production up --build -d

# Or without nginx (if using external load balancer)
docker-compose up --build -d
```

## Environment Variables

Create a `.env.local` file for local development or set these environment variables:

### Required Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/brand_portal

# Redis Cache
REDIS_URL=redis://localhost:6379

# Authentication
AUTH_SECRET=your-super-secret-auth-key-min-32-chars
NEXTAUTH_URL=https://yourdomain.com

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Optional: Storage (if using S3)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

### Development Variables

```env
NODE_ENV=development
AUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment Options

### 1. Docker Compose (Recommended for small deployments)

**Pros:**
- Simple setup and management
- Includes all dependencies
- Easy scaling of individual services

**Cons:**
- Single server deployment
- Limited high availability options

```bash
# Production deployment
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Scale specific services
docker-compose up --scale app=3 -d
```

### 2. Kubernetes

For larger deployments, use Kubernetes manifests:

```bash
# Apply all Kubernetes resources
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=brand-portal

# View logs
kubectl logs -l app=brand-portal -f
```

### 3. Cloud Platforms

#### Vercel (Recommended for Next.js)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### AWS ECS/Fargate

1. Build and push Docker image to ECR
2. Create ECS task definition
3. Deploy using ECS service

#### DigitalOcean App Platform

1. Connect repository
2. Configure build settings
3. Set environment variables
4. Deploy

## Database Setup

### PostgreSQL

The application uses PostgreSQL with Drizzle ORM. Database migrations are handled automatically.

```bash
# Run migrations manually (if needed)
npm run db:push

# Generate new migrations
npm run db:generate

# View database in Drizzle Studio
npm run db:studio
```

### Redis

Redis is used for session storage and caching. No special setup required.

## Storage Configuration

### Local Development (MinIO)

MinIO provides S3-compatible storage for development:

- Access: http://localhost:9001
- Username: minioadmin
- Password: minioadmin123

### Production (AWS S3)

Configure AWS S3 for production file storage:

1. Create S3 bucket
2. Set up IAM user with S3 permissions
3. Configure environment variables

## SSL/TLS Configuration

### Development

Development uses HTTP by default. For HTTPS testing:

```bash
# Generate self-signed certificates
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### Production

Use Let's Encrypt for free SSL certificates:

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Performance Optimization

### Application Level

- Enable gzip compression (handled by Next.js)
- Optimize images (use Next.js Image component)
- Implement caching strategies
- Use CDN for static assets

### Database Level

- Regular VACUUM and ANALYZE
- Index optimization
- Connection pooling (PgBouncer)

### Infrastructure Level

- Load balancing
- Database read replicas
- Redis clustering
- CDN integration

## Monitoring and Logging

### Health Checks

The application includes health check endpoints:

- `/api/health` - Application health
- Database connectivity check
- Redis connectivity check

### Logging

Logs are structured and can be aggregated using:

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana + Loki
- Cloud logging services

### Monitoring

Set up monitoring for:

- Application performance (APM)
- Database metrics
- Redis metrics
- Server resources

## Backup Strategy

### Database Backups

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres brand_portal > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres brand_portal < backup.sql
```

### File Storage Backups

- S3: Enable versioning and cross-region replication
- MinIO: Regular data snapshots

## Security Considerations

### Production Checklist

- [ ] Change default passwords
- [ ] Use strong AUTH_SECRET
- [ ] Enable HTTPS
- [ ] Configure proper CORS settings
- [ ] Set up proper firewall rules
- [ ] Regular security updates
- [ ] Enable audit logging
- [ ] Implement rate limiting
- [ ] Use secrets management

### Environment Separation

- Separate environments (dev, staging, prod)
- Different databases per environment
- Isolated networks
- Proper access controls

## Troubleshooting

### Common Issues

1. **Database connection issues**
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready -U postgres
   ```

2. **Redis connection issues**
   ```bash
   # Check Redis status
   docker-compose exec redis redis-cli ping
   ```

3. **Application not starting**
   ```bash
   # Check application logs
   docker-compose logs app
   ```

### Debug Mode

Enable debug logging:

```env
DEBUG=true
LOG_LEVEL=debug
```

## Scaling

### Horizontal Scaling

Scale application instances:

```bash
# Scale to 3 app instances
docker-compose up --scale app=3 -d
```

### Database Scaling

- Read replicas for read-heavy workloads
- Connection pooling
- Database sharding (advanced)

### Cache Scaling

- Redis Cluster for high availability
- Multiple Redis instances

## Updates and Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# Zero-downtime deployment (with load balancer)
docker-compose up --scale app=2 --no-recreate
docker-compose stop app_1
docker-compose up --scale app=2 --build
```

### Database Maintenance

```bash
# Run maintenance tasks
docker-compose exec postgres psql -U postgres -d brand_portal -c "VACUUM ANALYZE;"
```

## Support

For deployment issues:

1. Check application logs
2. Verify environment variables
3. Test database and Redis connectivity
4. Review resource usage
5. Check security group/firewall settings

For additional help, refer to the main README.md or create an issue in the repository.