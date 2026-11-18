# 01 · Metrics and Dashboards

**Prerequisites:** [README · implemented vs. proposed](README.md)
**Next step:** [02 · Alerting](02-alerting.md)

## What you can actually measure today (implemented)

```bash
kubectl top pods -n estateflow-staging        # live CPU/memory, requires metrics-server
kubectl top nodes
kubectl get hpa -n estateflow-staging          # current replica count + CPU vs target
aws elbv2 describe-target-health --region us-east-1 --target-group-arn <arn>   # ALB target health
curl -s -D - -o /dev/null "http://<ALB_DNS>/api/properties" | grep -i x-cache   # cache hit/miss
```
These are real, verifiable, point-in-time checks — not a dashboard, but genuinely useful for
the daily checks in [03-daily-operations](../03-daily-operations/README.md).

## A proposed dashboard setup (not implemented — for learning/planning)

A production-grade version of this stack would typically add:

- **Prometheus** scraping backend/frontend `/metrics` (would require adding a metrics library
  like `prom-client` to the Express app — not currently present in `backend/package.json`) and
  node/kube-state-metrics for cluster-level data.
- **Grafana** dashboards on top of Prometheus, covering: request rate/latency/error rate per
  endpoint, pod CPU/memory over time, HPA scaling events, Postgres connection count, Redis hit
  rate.
- **CloudWatch Container Insights** (`aws eks create-addon --addon-name
  amazon-cloudwatch-observability`) as a lower-effort alternative/complement — gives
  node/pod/container metrics in CloudWatch without running your own Prometheus.

## If you implement this (a good student exercise — see 09-student-labs)

1. Add a `/metrics` endpoint to the backend (e.g. `prom-client`'s default + custom counters
   for cache hit/miss, upload success/failure).
2. Install `kube-prometheus-stack` via Helm, or enable Container Insights.
3. Build one dashboard panel per row of the table in
   [`README.md`](README.md)'s implemented-capabilities list, so you're adding visibility, not
   just noise.
4. Update this file's status table once it's genuinely running — don't leave documentation
   claiming something exists that was only tried once and torn down.

## Checklist

- [ ] Can run every "implemented" command above and interpret its output
- [ ] Can explain the difference between what exists today and the proposed design
- [ ] If you build the proposed setup, you updated this doc's status table to match reality
