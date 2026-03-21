# Operational Runbook - Web3Central

This runbook provides guidance for responding to operational issues in the Web3Central platform.

## Table of Contents

1. [What is Monitored](#what-is-monitored)
2. [Finding Logs and Correlation IDs](#finding-logs-and-correlation-ids)
3. [Alert Response Guides](#alert-response-guides)
4. [Escalation Procedures](#escalation-procedures)

---

## What is Monitored

### Metrics Tracked

| Metric | Description | Endpoint |
|--------|-------------|----------|
| Request Count | Total requests by route and status code | `GET /api/metrics` |
| Error Rate | Percentage of 4xx/5xx responses | `GET /api/metrics` |
| Auth Failures | Failed authentication attempts | `GET /api/metrics` |
| Transaction Failures | Failed external API calls (DeFiLlama, CoinGecko) | `GET /api/metrics` |
| Request Latency | P50, P95, P99 latency in ms | `GET /api/metrics` |
| Uptime | Time since last restart | `GET /api/metrics` |

### Key Logs

All logs are output as structured JSON with the following fields:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info|warn|error",
  "message": "Request completed",
  "service": "web3central-backend",
  "environment": "production",
  "correlationId": "req-1705315800000-a1b2c3d4",
  "route": "/api/tools",
  "method": "GET",
  "statusCode": 200,
  "latencyMs": 45
}
```

### Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Backend is live",
  "version": "1.0.3",
  "db": "connected"
}
```

---

## Finding Logs and Correlation IDs

### Render (Production)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select the `web3central` service
3. Click "Logs" tab
4. Search for correlation ID or error message

### Local Development

Logs are output to stdout. Use:
```bash
cd backend && npm run dev 2>&1 | jq '.'
```

### Correlation ID Lookup

Every request receives a unique correlation ID:
- Passed in request: `X-Correlation-ID` header
- Generated if missing: `req-{timestamp}-{random}`
- Returned in response: `X-Correlation-ID` header

To trace a request:
```bash
# Search logs for a specific correlation ID
grep "req-1705315800000-a1b2c3d4" logs/*.log
```

### Error Format

Errors include correlation ID for tracing:
```json
{
  "success": false,
  "message": "An internal error occurred",
  "correlationId": "req-1705315800000-a1b2c3d4"
}
```

---

## Alert Response Guides

### High Server Error Rate

**Alert:** `HighServerErrorRate` (5xx rate > 5% for 2+ minutes)

**Impact:** Users experiencing failures

**First Response Steps:**

1. **Check service health:**
   ```bash
   curl -s https://your-domain.com/api/health | jq
   ```

2. **Check recent error logs:**
   - Render: Dashboard > Logs > Filter by "error"
   - Look for stack traces or error patterns

3. **Check database connectivity:**
   - Health endpoint shows `db: "connected"` or `db: "disconnected"`
   - If disconnected, check MongoDB Atlas status

4. **Check recent deployments:**
   - Was there a recent code push?
   - Consider rollback if error started after deploy

5. **Check external dependencies:**
   ```bash
   # DeFiLlama API
   curl -s https://api.llama.fi/protocols | head -c 100
   
   # CoinGecko API
   curl -s "https://api.coingecko.com/api/v3/ping"
   ```

**Resolution:**
- If database issue: Check MongoDB Atlas, may need to restart connection
- If code issue: Roll back to previous deployment
- If external API: Errors may resolve on their own, monitor

---

### Transaction Failures

**Alert:** `ElevatedTransactionFailures` (>10 failures in 15 min)

**Impact:** Stale DeFi data, inaccurate TVL/volume metrics

**First Response Steps:**

1. **Check DeFiLlama API:**
   ```bash
   curl -s "https://api.llama.fi/protocols" | jq '. | length'
   # Expected: 2000+ protocols
   ```

2. **Check CoinGecko API:**
   ```bash
   curl -s "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
   # Expected: {"bitcoin":{"usd":...}}
   ```

3. **Check rate limiting:**
   - CoinGecko has rate limits (10-50 req/min for free tier)
   - If rate limited, sync will retry in 6 hours

4. **Check logs for specific errors:**
   ```
   grep "DeFiLlama sync failed" logs/*.log
   grep "Token price fetch failed" logs/*.log
   ```

**Resolution:**
- External API down: Wait for recovery, data refreshes every 6 hours
- Rate limited: No action needed, will retry
- Persistent failures: Check API credentials or network issues

---

### Auth Failure Spike

**Alert:** `AuthFailureSpike` (>50 failures in 5 min)

**Impact:** Potential security threat or broken client

**First Response Steps:**

1. **Check for attack patterns:**
   ```bash
   # Look for repeated IPs or patterns in logs
   grep "Auth failed" logs/*.log | tail -50
   ```

2. **Check rate limiter is working:**
   - Rate limit is 20 requests per 15 min per IP
   - Should see "Too many requests" messages

3. **Check for legitimate client issues:**
   - Was there a frontend deployment?
   - Is a third-party integration broken?

4. **Review JWT configuration:**
   - Is `JWT_SECRET` set correctly?
   - Has it changed recently?

**Resolution:**
- If attack: Rate limiter should handle it; consider IP blocking at CDN level
- If client issue: Fix client code, communicate with users
- If JWT issue: Check environment variables, may need restart

---

### High Latency

**Alert:** `HighRequestLatency` (P95 > 2s)

**Impact:** Slow user experience

**First Response Steps:**

1. **Check metrics endpoint:**
   ```bash
   curl -s https://your-domain.com/api/metrics | jq '.metrics.latency'
   ```

2. **Check database performance:**
   - MongoDB Atlas > Performance Advisor
   - Look for slow queries

3. **Check for hot routes:**
   ```bash
   curl -s https://your-domain.com/api/metrics | jq '.metrics.requests.topRoutes'
   ```

4. **Check external API latency:**
   ```bash
   time curl -s "https://api.llama.fi/protocols" > /dev/null
   # Should be < 5s
   ```

**Resolution:**
- Database slow: Add indexes, optimize queries
- External API slow: Consider caching
- High traffic: Scale service or optimize hot paths

---

## Escalation Procedures

### Severity Levels

| Level | Response Time | Examples |
|-------|---------------|----------|
| P1 - Critical | 15 min | Service completely down, data breach |
| P2 - High | 1 hour | Degraded service, high error rate |
| P3 - Medium | 4 hours | Non-critical feature broken |
| P4 - Low | 24 hours | Minor issues, improvements |

### Escalation Path

1. **First Responder:** Check runbook, attempt resolution
2. **Engineering Lead:** If unresolved after 30 min (P1/P2)
3. **External Support:** For third-party service issues

### Communication

- **Internal:** Post updates in #incidents channel
- **External:** If user-facing impact > 15 min, update status page
- **Post-Incident:** Create incident report within 24 hours

### Emergency Contacts

| Role | Contact Method |
|------|----------------|
| On-Call Engineer | PagerDuty rotation |
| Engineering Lead | Slack @lead-eng |
| MongoDB Support | Atlas support portal |
| Render Support | support@render.com |

---

## Quick Reference

### Common Commands

```bash
# Check health
curl -s https://your-domain.com/api/health | jq

# Check metrics
curl -s https://your-domain.com/api/metrics | jq

# Restart service (Render)
# Dashboard > Manual Deploy or Suspend/Resume

# View recent logs (Render)
# Dashboard > Logs tab
```

### Key URLs

| Service | URL |
|---------|-----|
| Production API | https://web3central.onrender.com/api |
| Frontend | https://web3central.vercel.app |
| MongoDB Atlas | https://cloud.mongodb.com |
| Render Dashboard | https://dashboard.render.com |

### Environment Variables

See `.env.example` for complete list. Critical ones:
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication key
- `NODE_ENV` - production/development
