# 05 · Monitoring CPU and Memory

**Prerequisites:** `metrics-server` installed on the cluster
**Next step:** [06 · Checking database availability](06-checking-database-availability.md)

## Objective

Catch resource pressure before it causes an `OOMKilled` pod or CPU-throttled slow responses —
and tell the difference between "normal load" and "something is actually leaking/looping."

## Commands

```bash
kubectl top pods -n estateflow-staging
kubectl top nodes
kubectl get hpa -n estateflow-staging
```

## Expected results

Pod CPU/memory usage well under the `limits` set in `infra/k8s/05-backend.yaml`/
`06-frontend.yaml` (100m–500m CPU, 128Mi–256Mi memory for the backend, similar for the
frontend) under normal load. HPA `REPLICAS` near `MINPODS` (2) when idle.

## How to interpret what you see

- Memory climbing steadily over hours/days with no corresponding traffic increase usually
  means a leak — restart the pod as an immediate mitigation (`kubectl rollout restart
  deployment/backend -n estateflow-staging`) and file a bug, don't just ignore it.
- CPU pinned at/near its `limit` with the HPA already at `MAXPODS` means you're genuinely
  under-provisioned for current load — raise `maxReplicas` in `infra/k8s/08-hpa.yaml`
  temporarily (via a reviewed PR, not an ad hoc `kubectl edit`) rather than just watching it
  stay maxed out.

## If something looks wrong

| Symptom | Go to |
|---|---|
| Pod `OOMKilled` in `kubectl describe pod` | [14 · High CPU and memory](../04-runbooks/14-high-cpu-and-memory.md) |
| CPU pinned, HPA maxed, users report slowness | [14 · High CPU and memory](../04-runbooks/14-high-cpu-and-memory.md) |

## Checklist

- [ ] Pod CPU/memory checked against their configured limits
- [ ] HPA replica count matches current load expectations
- [ ] No unexplained steady memory growth
