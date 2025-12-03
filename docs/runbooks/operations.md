# Operations Runbook

## Table of Contents
1. [System Overview](#system-overview)
2. [Deployment](#deployment)
3. [Monitoring & Health Checks](#monitoring--health-checks)
4. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
5. [Backup & Recovery](#backup--recovery)
6. [Security](#security)

---

## System Overview

### Architecture
- **Frontend**: Next.js 15 application (port 3000)
- **Backend**: NestJS API server (port 3001)
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7
- **Real-time**: WebSocket via Socket.io

### Key Endpoints
| Service | Health | Metrics |
|---------|--------|---------|
| Backend | `GET /health` | `GET /metrics` |
| Backend | `GET /health/live` | `GET /metrics/prometheus` |
| Backend | `GET /health/ready` | - |

---

## Deployment

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 16
- Redis 7

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=motel_manager

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=<secure-random-string>
JWT_EXPIRES_IN=1d

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Database Migrations

```bash
# Run migrations
cd backend
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database (development only)
npx prisma db seed
```

---

## Monitoring & Health Checks

### Health Check Endpoints

**Full Health Status** (`GET /health`)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": { "status": "up", "responseTime": 5 },
    "websocket": { "status": "up", "details": { "connectedUsers": 10 } },
    "memory": { "status": "up", "details": { "heapUsedMB": 150 } }
  }
}
```

**Liveness Probe** (`GET /health/live`)
- Returns 200 if the process is running
- Used by Kubernetes/Docker for restart decisions

**Readiness Probe** (`GET /health/ready`)
- Returns 200 if the service can accept traffic
- Checks database connectivity

### Prometheus Metrics

```bash
# Fetch metrics
curl http://localhost:3001/metrics/prometheus
```

Available metrics:
- `motel_uptime_seconds` - Application uptime
- `motel_memory_heap_used_bytes` - Memory usage
- `motel_websocket_connections` - Active WebSocket connections
- `motel_websocket_users` - Connected unique users
- `motel_suites_total` - Total suites
- `motel_tasks_total` - Total tasks
- `motel_tasks_pending` - Pending tasks
- `motel_tasks_in_progress` - In-progress tasks

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Memory Usage | > 80% | > 90% |
| Response Time | > 500ms | > 2000ms |
| Error Rate | > 1% | > 5% |
| WebSocket Disconnects | > 10/min | > 50/min |

---

## Common Issues & Troubleshooting

### Database Connection Issues

**Symptoms**: 500 errors, health check failing

**Resolution**:
```bash
# Check PostgreSQL status
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

### WebSocket Connection Issues

**Symptoms**: Real-time updates not working, "Offline" indicator

**Resolution**:
```bash
# Check backend logs for WebSocket errors
docker-compose logs backend | grep -i websocket

# Verify WebSocket port is accessible
curl -I http://localhost:3001/socket.io/

# Check connected clients
curl http://localhost:3001/metrics | grep websocket
```

### High Memory Usage

**Symptoms**: Slow responses, OOM errors

**Resolution**:
```bash
# Check current memory usage
curl http://localhost:3001/health | jq '.checks.memory'

# Restart backend service
docker-compose restart backend

# Increase memory limit (in docker-compose.yml)
# deploy:
#   resources:
#     limits:
#       memory: 1G
```

### Redis Connection Issues

**Symptoms**: Queue jobs not processing, caching failures

**Resolution**:
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# View Redis info
docker-compose exec redis redis-cli info

# Clear Redis cache (if needed)
docker-compose exec redis redis-cli FLUSHALL
```

---

## Backup & Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres motel_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (add to crontab)
0 2 * * * docker-compose exec -T postgres pg_dump -U postgres motel_manager > /backups/daily_$(date +\%Y\%m\%d).sql
```

### Database Restore

```bash
# Stop services
docker-compose stop backend frontend

# Restore from backup
docker-compose exec -T postgres psql -U postgres motel_manager < backup_file.sql

# Run any pending migrations
cd backend && npx prisma migrate deploy

# Restart services
docker-compose start backend frontend
```

### Redis Backup

Redis is configured with AOF persistence. Backups are stored in the redis_data volume.

```bash
# Manual backup
docker-compose exec redis redis-cli BGSAVE
```

---

## Security

### JWT Token Rotation

1. Generate new JWT secret
2. Update `JWT_SECRET` environment variable
3. Restart backend service
4. All existing sessions will be invalidated

```bash
# Generate secure secret
openssl rand -base64 64

# Update and restart
docker-compose up -d backend
```

### SSL/TLS Configuration

For production, configure Nginx with SSL:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://frontend:3000;
    }
    
    location /api {
        proxy_pass http://backend:3001;
    }
    
    location /socket.io {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Security Checklist

- [ ] Change default database passwords
- [ ] Set strong JWT_SECRET (min 64 characters)
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Database access restricted to backend only

