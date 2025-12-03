# Incident Response Playbook

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P1 - Critical | Complete service outage | 15 minutes | Database down, backend crash |
| P2 - High | Major feature broken | 1 hour | Auth failing, WebSocket down |
| P3 - Medium | Minor feature broken | 4 hours | Specific API errors |
| P4 - Low | Cosmetic/minor issues | 24 hours | UI glitches |

---

## P1: Service Outage

### Initial Response (First 15 minutes)

1. **Acknowledge** the incident
2. **Verify** the outage scope
   ```bash
   # Check all services
   docker-compose ps
   
   # Check health endpoints
   curl http://localhost:3001/health
   curl http://localhost:3000
   ```

3. **Communicate** to stakeholders
   - Post in #incidents channel
   - Update status page

### Diagnosis

1. **Check logs**
   ```bash
   docker-compose logs --tail=100 backend
   docker-compose logs --tail=100 frontend
   docker-compose logs --tail=100 postgres
   ```

2. **Check resources**
   ```bash
   docker stats
   df -h
   free -m
   ```

3. **Check network**
   ```bash
   docker network ls
   docker-compose exec backend ping postgres
   ```

### Recovery Actions

**Database Down**
```bash
# Restart PostgreSQL
docker-compose restart postgres

# If data corruption suspected
docker-compose stop postgres
docker volume rm motel_postgres_data  # WARNING: Data loss
docker-compose up -d postgres
# Then restore from backup
```

**Backend Crash Loop**
```bash
# Check for OOM
dmesg | grep -i oom

# Increase memory limits
docker-compose up -d --scale backend=0
# Edit docker-compose.yml memory limits
docker-compose up -d backend
```

**Frontend Build Issues**
```bash
# Rebuild from scratch
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

---

## P2: Authentication Failure

### Symptoms
- Users cannot log in
- "Unauthorized" errors
- JWT validation failures

### Diagnosis
```bash
# Check backend logs for auth errors
docker-compose logs backend | grep -i auth

# Verify JWT_SECRET is set
docker-compose exec backend env | grep JWT

# Test auth endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Resolution
```bash
# If JWT_SECRET changed/missing
# 1. Set correct JWT_SECRET in .env
# 2. Restart backend
docker-compose restart backend

# If database auth table corrupted
# Run migrations
cd backend && npx prisma migrate deploy
```

---

## P2: WebSocket Disconnections

### Symptoms
- "Offline" indicator in UI
- Real-time updates not working
- Frequent reconnection attempts

### Diagnosis
```bash
# Check WebSocket connections
curl http://localhost:3001/metrics | grep websocket

# Check for connection errors
docker-compose logs backend | grep -i "websocket\|socket"

# Test WebSocket endpoint
wscat -c ws://localhost:3001/realtime
```

### Resolution
```bash
# If too many connections
# Check for connection leaks in client code

# If server overloaded
docker-compose restart backend

# If firewall/proxy issues
# Ensure WebSocket upgrade headers are passed
```

---

## P3: Slow API Responses

### Symptoms
- Response times > 2 seconds
- Timeouts on certain endpoints
- High CPU/memory usage

### Diagnosis
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/suites

# Check database query times
docker-compose exec postgres psql -U postgres -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# Check memory usage
curl http://localhost:3001/health | jq '.checks.memory'
```

### Resolution
```bash
# If database slow
# Add missing indexes
cd backend && npx prisma migrate deploy

# If memory high
docker-compose restart backend

# If specific query slow
# Analyze and optimize the query
EXPLAIN ANALYZE SELECT * FROM tasks WHERE ...;
```

---

## Post-Incident

### Checklist

- [ ] Incident timeline documented
- [ ] Root cause identified
- [ ] Fix implemented and verified
- [ ] Monitoring/alerts updated
- [ ] Runbook updated if needed
- [ ] Post-mortem scheduled (for P1/P2)

### Post-Mortem Template

```markdown
## Incident: [Title]
**Date**: YYYY-MM-DD
**Duration**: X hours
**Severity**: P1/P2/P3/P4
**Impact**: [Description of user impact]

### Timeline
- HH:MM - Incident detected
- HH:MM - Team notified
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Service restored

### Root Cause
[Detailed explanation]

### Resolution
[What was done to fix it]

### Action Items
- [ ] Action 1 - Owner - Due date
- [ ] Action 2 - Owner - Due date

### Lessons Learned
- What went well
- What could be improved
```

