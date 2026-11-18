# 03 · SLI, SLO, and Error Budgets

**Prerequisites:** [02 · Alerting](02-alerting.md)
**Next step:** [09-student-labs](../09-student-labs/README.md)

## The concepts, in plain English

- **SLI (Service Level Indicator)** — a number you actually measure. E.g. "percentage of
  `/api/health` checks returning 200 in the last 5 minutes."
- **SLO (Service Level Objective)** — the target for that number. E.g. "99.5% of `/api/health`
  checks succeed over a rolling 30 days."
- **Error budget** — the inverse of the SLO, as an allowance. A 99.5% SLO gives you a 0.5%
  "budget" for failures — about 3.6 hours of full downtime per month, or a proportionally
  larger amount of partial degradation. Spending the whole budget early in the month is a
  signal to slow down risky changes until it resets.

**None of these are currently tracked as live numbers for EstateFlow** — this file teaches the
concept using EstateFlow as the worked example, per
[08-monitoring-and-observability/README.md](README.md)'s implemented-vs-proposed table.

## A worked example SLO for EstateFlow (illustrative target, not a tracked metric)

| SLI | Proposed SLO | Why this target |
|---|---|---|
| `/api/health` success rate | 99.5% over 30 days | A teaching-lab app can tolerate more risk than a real business-critical system; 99.5% still forces real discipline without demanding a huge ops investment |
| `GET /api/properties` P95 latency | < 500ms | Generous enough to allow a Postgres cold cache miss, tight enough to catch a real regression |
| Image upload success rate | 99% | Slightly looser — depends on a third party (S3) and user-supplied files, more inherent variance |

## How this would connect to real alerting/incident response

An error-budget *burn rate* alert (e.g. "we've used 10% of this month's error budget in the
last hour") is a more mature alerting pattern than a flat threshold — it catches both sudden
severe outages and slow, creeping degradation. Implementing burn-rate alerting requires the
Prometheus/Grafana (or equivalent) setup described as proposed in
[01 · Metrics and dashboards](01-metrics-and-dashboards.md) — it isn't achievable with
`kubectl top` alone.

## Checklist

- [ ] Can define SLI, SLO, and error budget in your own words
- [ ] Can propose a reasonable SLO for a given SLI and justify the number
- [ ] Understands this is a worked teaching example, not a live-tracked production metric for
      this project
