# Alert Configuration

This document defines the alert rules for Web3Central. These rules can be used directly with Prometheus Alertmanager, Grafana, or other monitoring platforms.

## Alert Definitions

### 1. Sustained 5xx Error Spike

**Purpose:** Detect when the backend is experiencing server errors affecting user experience.

```yaml
- alert: HighServerErrorRate
  expr: |
    (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) > 0.05
  for: 2m
  labels:
    severity: critical
    service: web3central-backend
  annotations:
    summary: "High 5xx error rate detected"
    description: "Server error rate is above 5% for more than 2 minutes. Current rate: {{ $value | humanizePercentage }}"
    runbook_url: "docs/ops/RUNBOOK.md#high-server-error-rate"
```

**Thresholds:**
| Severity | Threshold | Duration | Rationale |
|----------|-----------|----------|-----------|
| Warning  | > 1%      | 5m       | Early indicator of issues |
| Critical | > 5%      | 2m       | Significant user impact |

---

### 2. Elevated Transaction Failures

**Purpose:** Detect failures in Web3/DeFi operations like external API calls (DeFiLlama, CoinGecko).

```yaml
- alert: ElevatedTransactionFailures
  expr: |
    increase(transaction_failures_total[15m]) > 10
  for: 5m
  labels:
    severity: warning
    service: web3central-backend
  annotations:
    summary: "Elevated transaction/sync failures"
    description: "More than 10 transaction failures in the last 15 minutes"
    runbook_url: "docs/ops/RUNBOOK.md#transaction-failures"
```

**Thresholds:**
| Metric | Warning | Critical | Rationale |
|--------|---------|----------|-----------|
| Failures in 15m | > 10 | > 50 | DeFiLlama sync failures impact data freshness |

---

### 3. Authentication Failure Spikes

**Purpose:** Detect potential brute-force attacks or misconfigured clients.

```yaml
- alert: AuthFailureSpike
  expr: |
    increase(auth_failures_total[5m]) > 50
  for: 1m
  labels:
    severity: warning
    service: web3central-backend
  annotations:
    summary: "Spike in authentication failures"
    description: "More than 50 auth failures in 5 minutes - possible attack or client misconfiguration"
    runbook_url: "docs/ops/RUNBOOK.md#auth-failure-spike"
```

**Thresholds:**
| Duration | Warning | Critical | Rationale |
|----------|---------|----------|-----------|
| 5 min    | > 50    | > 200    | Rate limiter allows 20/15min, so spikes indicate issues |

---

### 4. High Request Latency

**Purpose:** Detect performance degradation affecting user experience.

```yaml
- alert: HighRequestLatency
  expr: |
    histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 2
  for: 5m
  labels:
    severity: warning
    service: web3central-backend
  annotations:
    summary: "High request latency detected"
    description: "95th percentile latency is above 2 seconds for more than 5 minutes"
    runbook_url: "docs/ops/RUNBOOK.md#high-latency"
```

**Thresholds:**
| Percentile | Warning | Critical | Rationale |
|------------|---------|----------|-----------|
| P95        | > 2s    | > 5s     | User experience degrades beyond 2s |
| P99        | > 5s    | > 10s    | Outliers indicate serious issues |

---

## Implementation Notes

### Using Built-in Metrics Endpoint

Web3Central exposes metrics at `GET /api/metrics`. For simple setups:

1. **Poll the endpoint** periodically (e.g., every 30s)
2. **Compute rates** by comparing successive values
3. **Alert** when thresholds are breached

Example alert script (Node.js):
```javascript
const axios = require('axios');

const THRESHOLDS = {
  serverErrorRate: 0.05,
  authFailuresPerHour: 100,
  avgLatencyMs: 2000
};

async function checkAlerts() {
  const { data } = await axios.get('http://localhost:5000/api/metrics');
  const metrics = data.metrics;
  
  if (metrics.errors.serverErrorRate > THRESHOLDS.serverErrorRate * 100) {
    console.error('ALERT: High server error rate', metrics.errors);
  }
  
  if (metrics.errors.auth > THRESHOLDS.authFailuresPerHour) {
    console.warn('ALERT: High auth failures', metrics.errors.auth);
  }
  
  if (metrics.latency.avg > THRESHOLDS.avgLatencyMs) {
    console.warn('ALERT: High latency', metrics.latency);
  }
}
```

### Prometheus Integration

To integrate with Prometheus, add a `/metrics` endpoint that exports in Prometheus format:

```javascript
const promClient = require('prom-client');
// Register default metrics
promClient.collectDefaultMetrics();
// Expose at GET /metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

### Slack/PagerDuty Integration

Configure your alerting platform to send notifications:

1. **Slack Webhook**: Add incoming webhook to your monitoring tool
2. **PagerDuty**: Use PagerDuty Events API v2
3. **Email**: Configure SMTP in your monitoring tool

## Alert Response SLAs

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| Critical | 15 minutes    | Immediate page to on-call |
| Warning  | 1 hour        | Slack notification |
| Info     | Next business day | Dashboard only |
