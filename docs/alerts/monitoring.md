# Monitoring & Alerting Configuration

## Overview
This document defines the monitoring strategy, key metrics, alert thresholds, and escalation procedures for the Motel Manager application.

---

## Monitoring Stack

### Recommended Tools
| Component | Tool | Purpose |
|-----------|------|---------|
| Metrics Collection | Prometheus | Scrape `/metrics/prometheus` endpoint |
| Metrics Storage | Prometheus / InfluxDB | Time-series data storage |
| Visualization | Grafana | Dashboards and charts |
| Log Aggregation | Loki / ELK Stack | Centralized logging |
| Alerting | Prometheus Alertmanager | Alert routing and notifications |
| APM (Optional) | Datadog / New Relic | Full observability suite |

### Endpoints
| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `GET /health` | Full health status | No |
| `GET /health/live` | Liveness probe | No |
| `GET /health/ready` | Readiness probe | No |
| `GET /metrics` | JSON metrics | No (restrict in prod) |
| `GET /metrics/prometheus` | Prometheus format | No (restrict in prod) |

---

## Key Metrics

### Application Metrics

| Metric | Type | Description | Source |
|--------|------|-------------|--------|
| `motel_uptime_seconds` | Gauge | Application uptime | Backend |
| `motel_memory_heap_used_bytes` | Gauge | Heap memory usage | Backend |
| `motel_websocket_connections` | Gauge | Active WebSocket connections | Backend |
| `motel_websocket_users` | Gauge | Unique connected users | Backend |
| `motel_suites_total` | Gauge | Total number of suites | Database |
| `motel_tasks_total` | Gauge | Total number of tasks | Database |
| `motel_tasks_pending` | Gauge | Pending tasks count | Database |
| `motel_tasks_in_progress` | Gauge | In-progress tasks count | Database |
| `motel_employees_total` | Gauge | Total employees | Database |

### Infrastructure Metrics

| Metric | Description | Collection Method |
|--------|-------------|-------------------|
| CPU Usage | Container/host CPU utilization | cAdvisor / node_exporter |
| Memory Usage | Container/host memory utilization | cAdvisor / node_exporter |
| Disk I/O | Read/write operations | node_exporter |
| Network I/O | Bytes in/out | node_exporter |
| Database Connections | Active PostgreSQL connections | pg_stat_activity |
| Redis Memory | Redis memory usage | Redis INFO command |

### Business Metrics

| Metric | Description | Query |
|--------|-------------|-------|
| Tasks Completed Today | Daily task completion rate | `motel_tasks_completed_today` |
| Overdue Tasks | Tasks past scheduled end | Custom query |
| Suite Occupancy Rate | Occupied / Total suites | Custom calculation |
| Average Task Duration | Time from assignment to completion | Custom query |

---

## Alert Rules

### Critical Alerts (P1) - Immediate Response

```yaml
# Prometheus alerting rules
groups:
  - name: motel-critical
    rules:
      - alert: ServiceDown
        expr: up{job="motel-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Motel Manager backend is down"
          description: "Backend service has been unreachable for more than 1 minute"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL database is down"
          description: "Database has been unreachable for more than 1 minute"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for the last 5 minutes"
```

### High Alerts (P2) - Response within 1 hour

```yaml
      - alert: HighMemoryUsage
        expr: motel_memory_heap_used_bytes / motel_memory_heap_total_bytes > 0.85
        for: 10m
        labels:
          severity: high
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 85% for 10 minutes"

      - alert: WebSocketDisconnectSpike
        expr: rate(motel_websocket_disconnects_total[5m]) > 10
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "High WebSocket disconnect rate"
          description: "More than 10 disconnects per minute for 5 minutes"

      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: high
        annotations:
          summary: "Slow API responses"
          description: "95th percentile response time is above 2 seconds"
```

### Warning Alerts (P3) - Response within 4 hours

```yaml
      - alert: HighPendingTasks
        expr: motel_tasks_pending > 50
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "High number of pending tasks"
          description: "More than 50 tasks pending for 30 minutes"

      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.2
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
          description: "Less than 20% disk space available"

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage high"
          description: "Redis memory usage above 80%"
```

---

## Alert Routing

### Notification Channels

```yaml
# Alertmanager configuration
route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    - match:
        severity: critical
      receiver: 'slack-critical'
    - match:
        severity: high
      receiver: 'slack-high'
    - match:
        severity: warning
      receiver: 'slack-warning'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#motel-alerts'
        send_resolved: true

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<PAGERDUTY_SERVICE_KEY>'
        severity: critical

  - name: 'slack-critical'
    slack_configs:
      - channel: '#motel-critical'
        send_resolved: true
        title: '🚨 CRITICAL: {{ .CommonLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'

  - name: 'slack-high'
    slack_configs:
      - channel: '#motel-alerts'
        send_resolved: true
        title: '⚠️ HIGH: {{ .CommonLabels.alertname }}'

  - name: 'slack-warning'
    slack_configs:
      - channel: '#motel-alerts'
        send_resolved: true
        title: '📢 WARNING: {{ .CommonLabels.alertname }}'
```

---

## Grafana Dashboards

### Main Dashboard Panels

1. **Service Health**
   - Uptime indicator
   - Health check status (green/red)
   - Version information

2. **Request Metrics**
   - Requests per second (line chart)
   - Response time percentiles (p50, p95, p99)
   - Error rate percentage
   - Status code distribution (pie chart)

3. **WebSocket Metrics**
   - Connected users (gauge)
   - Total connections (gauge)
   - Connection/disconnection rate (line chart)

4. **Business Metrics**
   - Tasks by status (stacked bar)
   - Tasks completed today (counter)
   - Suite occupancy rate (gauge)
   - Active employees (gauge)

5. **Infrastructure**
   - CPU usage (line chart)
   - Memory usage (line chart)
   - Database connections (gauge)
   - Redis memory (gauge)

### Dashboard JSON Template

```json
{
  "dashboard": {
    "title": "Motel Manager Overview",
    "panels": [
      {
        "title": "Service Uptime",
        "type": "stat",
        "targets": [
          {
            "expr": "motel_uptime_seconds",
            "legendFormat": "Uptime"
          }
        ]
      },
      {
        "title": "WebSocket Connections",
        "type": "gauge",
        "targets": [
          {
            "expr": "motel_websocket_connections",
            "legendFormat": "Connections"
          }
        ]
      },
      {
        "title": "Tasks by Status",
        "type": "piechart",
        "targets": [
          { "expr": "motel_tasks_pending", "legendFormat": "Pending" },
          { "expr": "motel_tasks_in_progress", "legendFormat": "In Progress" }
        ]
      }
    ]
  }
}
```

---

## Log Aggregation

### Structured Log Format
All backend logs use JSON format:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "context": "HTTP",
  "method": "POST",
  "path": "/api/tasks",
  "statusCode": 201,
  "duration": 45,
  "userId": "user-123",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

### Log Queries (Loki/LogQL)

```logql
# All errors in the last hour
{job="motel-backend"} |= "error" | json | level="error"

# Slow requests (>1s)
{job="motel-backend"} | json | duration > 1000

# Authentication failures
{job="motel-backend"} |= "auth" | json | statusCode=401

# WebSocket events
{job="motel-backend"} |= "WebSocket"
```

---

## Escalation Matrix

| Severity | Response Time | Primary Contact | Escalation |
|----------|---------------|-----------------|------------|
| Critical (P1) | 15 minutes | On-call engineer | Engineering Manager → CTO |
| High (P2) | 1 hour | On-call engineer | Team Lead |
| Warning (P3) | 4 hours | Team channel | On-call engineer |
| Low (P4) | 24 hours | Team channel | N/A |

---

## Maintenance Windows

- **Scheduled Maintenance:** Sundays 2:00 AM - 4:00 AM UTC
- **Alert Suppression:** Configure silence rules during maintenance
- **Notification:** Post to #motel-alerts 24 hours before maintenance

```yaml
# Alertmanager silence for maintenance
silences:
  - matchers:
      - name: job
        value: motel-backend
    startsAt: '2024-01-07T02:00:00Z'
    endsAt: '2024-01-07T04:00:00Z'
    createdBy: 'ops-team'
    comment: 'Scheduled maintenance window'
```

