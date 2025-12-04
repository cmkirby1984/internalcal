# Launch Checklist

## Overview
This checklist ensures all critical items are verified before launching the Motel Manager application to production.

---

## Pre-Launch (1 Week Before)

### Infrastructure
- [ ] Production environment provisioned
- [ ] Database server configured and accessible
- [ ] Redis server configured and accessible
- [ ] Load balancer / reverse proxy configured
- [ ] SSL certificates installed and valid
- [ ] DNS records configured
- [ ] CDN configured (if applicable)

### Configuration
- [ ] Environment variables set for production
- [ ] JWT_SECRET generated (64+ characters, unique)
- [ ] DATABASE_URL configured with production credentials
- [ ] REDIS_URL configured
- [ ] CORS origins set to production domains only
- [ ] API rate limits configured
- [ ] Log levels set appropriately

### Security
- [ ] Security checklist completed (see `docs/security/checklist.md`)
- [ ] All default passwords changed
- [ ] Admin accounts created with strong passwords
- [ ] HTTPS enforced
- [ ] Security headers configured

### Monitoring
- [ ] Health check endpoints verified
- [ ] Prometheus/metrics endpoint accessible
- [ ] Grafana dashboards configured
- [ ] Alert rules configured
- [ ] On-call rotation established
- [ ] PagerDuty/Slack integration tested

---

## Pre-Launch (1 Day Before)

### Database
- [ ] Production database migrations run
- [ ] Seed data loaded (if needed)
- [ ] Database backup verified
- [ ] Backup restoration tested

### Testing
- [ ] All CI tests passing
- [ ] E2E tests passing against staging
- [ ] Manual smoke tests completed
- [ ] Performance/load testing completed
- [ ] Security scan completed

### Documentation
- [ ] API documentation up to date
- [ ] Runbooks reviewed and accessible
- [ ] Incident response plan reviewed
- [ ] Team trained on procedures

---

## Launch Day

### Pre-Deployment (T-2 hours)
- [ ] Team availability confirmed
- [ ] Communication channels open
- [ ] Rollback plan reviewed
- [ ] Database backup taken
- [ ] Current version tagged in git

### Deployment (T-0)
- [ ] Deploy backend services
- [ ] Verify backend health checks pass
- [ ] Deploy frontend application
- [ ] Verify frontend loads correctly
- [ ] Verify WebSocket connections working

### Smoke Tests (T+15 min)

#### Backend (Railway)
- [ ] Health check: `curl https://YOUR-BACKEND.up.railway.app/health/live` returns 200
- [ ] Readiness check: `curl https://YOUR-BACKEND.up.railway.app/health/ready` returns `ready: true`
- [ ] Metrics: `curl https://YOUR-BACKEND.up.railway.app/metrics` returns JSON
- [ ] Swagger: `https://YOUR-BACKEND.up.railway.app/api/docs` loads
- [ ] Auth: POST to `/api/auth/login` with valid credentials returns token

#### Frontend (Vercel)
- [ ] Homepage redirects to login for unauthenticated users
- [ ] Login page loads without console errors
- [ ] Login with seeded credentials (admin/admin123) works
- [ ] Dashboard loads with sidebar and header visible
- [ ] No CORS errors in browser console

#### Full Flow Tests
- [ ] Login functionality works
- [ ] Dashboard loads with data (tasks count, suite status)
- [ ] Can create a task (opens modal, fills form, submits)
- [ ] Can update suite status (click suite, change status)
- [ ] Real-time updates working (open two tabs, create task in one)
- [ ] Mobile/tablet views working (resize browser, check sidebar)

### Monitoring (T+30 min)
- [ ] No error spikes in logs
- [ ] Response times within SLA
- [ ] Database connections stable
- [ ] Memory usage normal
- [ ] No WebSocket disconnection spikes

---

### Automated Verification

Run the deployment verification script:
```bash
# Make script executable (first time only)
chmod +x scripts/verify-deployment.sh

# Run verification
./scripts/verify-deployment.sh https://YOUR-BACKEND.up.railway.app https://YOUR-APP.vercel.app
```

The script checks:
- Backend health/readiness endpoints
- Database connectivity
- API authentication
- Frontend accessibility

---

## Post-Launch (First 24 Hours)

### Hour 1
- [ ] Monitor error rates
- [ ] Check user feedback channels
- [ ] Verify all features working
- [ ] Check performance metrics

### Hour 4
- [ ] Review logs for anomalies
- [ ] Check database performance
- [ ] Verify backup jobs running
- [ ] Address any reported issues

### Hour 24
- [ ] Comprehensive metrics review
- [ ] User feedback summary
- [ ] Bug triage meeting
- [ ] Post-launch retrospective scheduled

---

## Rollback Procedure

### When to Rollback
- Error rate > 5% for 5+ minutes
- Critical functionality broken
- Security vulnerability discovered
- Data corruption detected

### Rollback Steps
1. **Announce** rollback in #incidents channel
2. **Stop** new deployments
3. **Revert** to previous container images:
   ```bash
   docker-compose down
   docker-compose -f docker-compose.rollback.yml up -d
   ```
4. **Verify** health checks pass
5. **Test** critical functionality
6. **Communicate** status to stakeholders
7. **Investigate** root cause

### Post-Rollback
- [ ] Incident documented
- [ ] Root cause identified
- [ ] Fix developed and tested
- [ ] Re-deployment scheduled

---

## Contacts

| Role | Name | Contact |
|------|------|---------|
| Engineering Lead | | |
| On-Call Engineer | | |
| DevOps | | |
| Product Owner | | |
| Support Lead | | |

---

## Communication Templates

### Launch Announcement
```
Subject: Motel Manager - Production Launch

Team,

We are launching Motel Manager to production today at [TIME].

Key information:
- Production URL: [URL]
- Support channel: #motel-support
- Incident channel: #motel-incidents

Please report any issues immediately.

Thanks,
[Name]
```

### Incident Communication
```
Subject: [SEVERITY] Motel Manager - [Brief Description]

Status: [Investigating/Identified/Resolved]
Impact: [Description of user impact]
Start Time: [Time]
Current Status: [What we know]
Next Update: [Time]

Updates will be posted to #motel-incidents.
```

### Resolution Communication
```
Subject: [RESOLVED] Motel Manager - [Brief Description]

The issue has been resolved.

Duration: [Start] - [End]
Root Cause: [Brief description]
Resolution: [What was done]
Follow-up: [Any planned actions]

Thank you for your patience.
```

---

## Sign-off

| Area | Owner | Date | Status |
|------|-------|------|--------|
| Infrastructure | | | |
| Security | | | |
| Testing | | | |
| Documentation | | | |
| Monitoring | | | |

**Launch Approval:** _________________ Date: _________

**Go/No-Go Decision:** ☐ GO  ☐ NO-GO

**Notes:**

