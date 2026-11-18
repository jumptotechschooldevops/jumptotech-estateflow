# 08 · Monitoring and Observability

**Prerequisites:** [02-deployment-guides](../02-deployment-guides/README.md)
**Next step:** [09-student-labs](../09-student-labs/README.md)

## Implemented vs. proposed — read this first

| Capability | Status | Where |
|---|---|---|
| `/api/health` endpoint (db + redis status) | ✅ Implemented | `backend/src/server.js` |
| `X-Cache: HIT`/`MISS` header on property reads | ✅ Implemented | `backend/src/routes/properties.js` |
| Kubernetes readiness/liveness probes | ✅ Implemented | `infra/k8s/05-backend.yaml`, `06-frontend.yaml`, `03-postgres.yaml`, `04-redis.yaml` |
| `kubectl top` via metrics-server | ✅ Implemented *if* the `metrics-server` add-on is installed on the cluster (assumed, not provisioned by this repo — verify per [02-deployment-guides/04](../02-deployment-guides/04-eks-and-kubernetes-basics.md)) | — |
| HorizontalPodAutoscaler | ✅ Implemented | `infra/k8s/08-hpa.yaml` |
| ALB target group health (native AWS feature) | ✅ Implemented (always available once the ALB exists — no extra setup) | `aws elbv2 describe-target-health` |
| GitHub Actions CI/CD run status | ✅ Implemented | `.github/workflows/` |
| Trivy image vulnerability scanning | ✅ Implemented | `.github/workflows/ci.yml` |
| **Prometheus** | ❌ Proposed, not implemented | — |
| **Grafana dashboards** | ❌ Proposed, not implemented | — |
| **CloudWatch Container Insights / alarms** | ❌ Proposed, not implemented | — |
| **Any automated alerting/paging** | ❌ Proposed, not implemented | — |
| **SLIs/SLOs/error budgets as tracked metrics** | ❌ Proposed, not implemented (the concepts are explained in [03](03-sli-slo-error-budgets.md) for learning purposes) | — |

**Do not tell a student, an interviewer, or a teammate that dashboards or alerts exist in this
project unless you've personally verified them running** — [09-reviewing-alerts](../03-daily-operations/09-reviewing-alerts.md)
already flags this; this page is the canonical source of truth for what's real.

## In this folder

| File | Covers |
|---|---|
| [01 · Metrics and dashboards](01-metrics-and-dashboards.md) | What's measurable today vs. a proposed Prometheus/Grafana setup |
| [02 · Alerting](02-alerting.md) | Current manual substitute vs. a proposed alerting design |
| [03 · SLI, SLO, and error budgets](03-sli-slo-error-budgets.md) | The concepts, applied to EstateFlow as a worked example — not live-tracked numbers |
