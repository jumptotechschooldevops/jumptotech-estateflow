# 02 · Alerting

**Prerequisites:** [01 · Metrics and dashboards](01-metrics-and-dashboards.md)
**Next step:** [03 · SLI, SLO, and error budgets](03-sli-slo-error-budgets.md)

## Current state: no automated alerting exists

There is no Prometheus Alertmanager, no CloudWatch Alarm, no paging integration configured for
this project. [09 · Reviewing alerts](../03-daily-operations/09-reviewing-alerts.md) already
names the manual substitute (checking `kubectl get events` and CI/CD run status by hand) —
this file is about the proposed design, for learning and planning purposes.

## A proposed alerting design (not implemented)

| Alert | Condition | Severity (see [05-incident-management](../05-incident-management/README.md)) |
|---|---|---|
| All backend targets unhealthy | `UnHealthyHostCount == HealthyHostCount` total for >2 min | SEV1 |
| `/api/health` returning non-200 | Synthetic check fails 3x consecutively | SEV1/SEV2 |
| Pod restart rate | >3 restarts in 10 min for any pod | SEV2/SEV3 |
| HPA maxed with CPU still over target | 5+ min sustained | SEV2/SEV3 |
| PVC usage | >85% full | SEV3 |
| Trivy scan failure on `main` | Any CRITICAL CVE | SEV3/SEV4 |
| GitHub Actions deploy failure | Any failure on `deploy.yml` | SEV4 (unless blocking an urgent fix) |

## On-call procedures (once real alerting exists)

1. Alert fires → page goes to whoever is Primary On-Call ([05-incident-management/01](../05-incident-management/01-roles-and-responsibilities.md))
2. Acknowledge within the response-time target for its severity
   ([05-incident-management/02](../05-incident-management/02-communication-and-escalation.md))
3. Match the alert to a runbook ([04-runbooks](../04-runbooks/README.md)) and begin diagnosis

## Implementing this (student exercise)

1. Pick a tool (CloudWatch Alarms are the lowest-effort starting point given the ALB/EBS
   metrics are already native AWS data — no Prometheus required to start).
2. Wire exactly one alert end-to-end first (e.g. "ALB target group unhealthy") before building
   the rest — prove the full alert → notification path works before scaling up the rule set.
3. Update [`README.md`](README.md)'s status table once something is genuinely wired up and
   tested, not just configured and untested.

## Checklist

- [ ] Can explain that no real alerting exists today, specifically and honestly
- [ ] Understands the proposed alert table and can justify each severity assignment
- [ ] Knows the manual substitute procedure for today's actual state
