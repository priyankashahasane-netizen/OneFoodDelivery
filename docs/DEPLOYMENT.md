# Deployment Guide

This guide covers deploying the Stack Delivery platform to production.

## Prerequisites

- Docker and Docker Compose (for local/staging)
- Kubernetes cluster (for production)
- PostgreSQL 16+
- Redis 7+
- Node.js 20+ (for local development)

## Local Development with Docker Compose

1. **Copy environment files:**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/tracking-web/.env.example apps/tracking-web/.env.local
   cp apps/admin-dashboard/.env.example apps/admin-dashboard/.env.local
   ```

2. **Update environment variables** in `.env` files with your API keys:
   - `OPTIMOROUTE_API_KEY`
   - `IPSTACK_API_KEY`
   - `JWT_SECRET` (use a strong random string in production)

3. **Start services:**
   ```bash
   docker-compose up -d
   ```

4. **Run migrations:**
   ```bash
   cd apps/backend
   npm install
   npm run build
   npm run migration:run
   ```

5. **Access services:**
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs
   - Tracking Web: http://localhost:3001
   - Admin Dashboard: http://localhost:3002

## Production Deployment with Kubernetes

### 1. Prepare Secrets

Create a Kubernetes secret with environment variables:

```bash
kubectl create secret generic stack-delivery-secrets \
  --from-literal=database-url='postgres://user:pass@host:5432/dbname' \
  --from-literal=redis-url='redis://host:6379' \
  --from-literal=jwt-secret='your-secret-here' \
  --from-literal=optimoroute-api-key='your-key' \
  --from-literal=ipstack-api-key='your-key'
```

### 2. Deploy PostgreSQL and Redis

Use managed services (e.g., AWS RDS, ElastiCache) or deploy using Helm charts.

### 3. Apply Kubernetes Manifests

```bash
# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy tracking web
kubectl apply -f k8s/tracking-web-deployment.yaml

# Deploy admin dashboard
kubectl apply -f k8s/admin-dashboard-deployment.yaml
```

### 4. Set Up Ingress

Configure an ingress controller (nginx, traefik, etc.) to route traffic:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: stack-delivery-ingress
spec:
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 80
  - host: track.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tracking-web
            port:
              number: 80
  - host: admin.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-dashboard
            port:
              number: 80
```

### 5. Run Database Migrations

Before starting the backend, run migrations:

```bash
# Option 1: Run as init container in Kubernetes
# Option 2: Run manually
kubectl exec -it deployment/backend -- npm run migration:run
```

## Database Migrations

### Generate Migration

```bash
cd apps/backend
npm run migration:generate -- src/migrations/MigrationName
```

### Run Migrations

```bash
npm run migration:run
```

### Revert Last Migration

```bash
npm run migration:revert
```

## CI/CD Pipeline

GitHub Actions workflows are configured in `.github/workflows/`:

- **ci.yml**: Runs linting and tests on pull requests
- **docker-build.yml**: Builds and pushes Docker images on pushes to main

### Manual Deployment

For production, tag releases:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

This triggers the Docker build workflow.

## Health Checks

All services expose health check endpoints:

- Backend: `GET /api/health`
- Tracking Web: `GET /health` (if configured)
- Admin Dashboard: `GET /health` (if configured)

Use these for Kubernetes liveness and readiness probes.

## Backup Strategy

### PostgreSQL Backups

```bash
# Automated backup script (run via cron)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Redis Backups

Redis persistence should be configured via `redis.conf`:
- AOF (Append Only File) for durability
- RDB snapshots for point-in-time recovery

## Monitoring

Set up monitoring for:

1. **Application Metrics**: Use the `/api/metrics` endpoint
2. **Health Checks**: Monitor `/api/health`
3. **Database**: Monitor PostgreSQL connection pool and query performance
4. **Redis**: Monitor memory usage and connection counts
5. **APM**: Consider integrating Sentry, DataDog, or New Relic

## Scaling

### Horizontal Scaling

Increase replicas in Kubernetes deployments:

```bash
kubectl scale deployment/backend --replicas=5
```

### Vertical Scaling

Adjust resource requests/limits in deployment YAMLs.

### Database Scaling

- Use read replicas for read-heavy workloads
- Consider connection pooling (e.g., PgBouncer)

## Security Checklist

- [ ] Use strong `JWT_SECRET` in production
- [ ] Enable TLS/HTTPS via ingress
- [ ] Configure CORS appropriately
- [ ] Use secrets management (Kubernetes Secrets, AWS Secrets Manager, etc.)
- [ ] Enable database SSL connections
- [ ] Restrict Redis access to internal network
- [ ] Implement rate limiting
- [ ] Regular security updates for dependencies

## Rollback Procedure

1. Identify previous working image tag
2. Update deployment to previous image:

```bash
kubectl set image deployment/backend backend=stackdelivery/backend:v1.0.0
```

3. If database migration issues, revert migration:

```bash
kubectl exec -it deployment/backend -- npm run migration:revert
```


