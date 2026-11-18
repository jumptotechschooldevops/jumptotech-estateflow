# 01 · Morning Production Health Check

**Prerequisites:** `kubectl` access to `estateflow-staging` ([02-deployment-guides/04](../02-deployment-guides/04-eks-and-kubernetes-basics.md))
**Next step:** [02 · Checking Kubernetes workloads](02-checking-kubernetes-workloads.md)

## Objective

A fast, top-to-bottom sweep to answer "is everything basically fine?" before you start your
shift — catches obvious problems before a user or an alert does.

## Commands

```bash
kubectl get pods -n estateflow-staging
kubectl get deployment -n estateflow-staging
kubectl get ingress -n estateflow-staging
ALB_DNS=$(kubectl get ingress estateflow-frontend -n estateflow-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl -s "http://$ALB_DNS/api/health"
```

## Expected results

All pods `Running` with full readiness (e.g. `2/2`); Ingress shows a populated `ADDRESS`;
health check returns `{"status":"ok","db":"up","redis":"up"}`.

## If something looks wrong

| Symptom | Go to |
|---|---|
| A pod not `Running`/not ready | [02 · Checking Kubernetes workloads](02-checking-kubernetes-workloads.md) |
| `db` or `redis` shows `down` | [06 · Checking database availability](06-checking-database-availability.md) |
| No `ADDRESS` on the Ingress, or curl times out | [07 · Verifying ALB target group health](07-verifying-alb-target-group-health.md) |

## Checklist

- [ ] All pods `Running` and ready
- [ ] Ingress has a populated `ADDRESS`
- [ ] `/api/health` returns `status: ok`
