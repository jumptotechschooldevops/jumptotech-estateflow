# 02 · Checking Kubernetes Workloads

**Prerequisites:** `kubectl` access to `estateflow-staging`
**Next step:** [03 · Reviewing failed deployments](03-reviewing-failed-deployments.md)

## Objective

Go one level deeper than the morning sweep — confirm every workload type (Deployments,
StatefulSet, HPA) is in the state it's supposed to be in, not just "pods exist."

## Commands

```bash
kubectl get deployment,statefulset,hpa -n estateflow-staging
kubectl get pods -n estateflow-staging -o wide
kubectl get events -n estateflow-staging --sort-by=.lastTimestamp | tail -20
```

## Expected results

- `backend`/`frontend` Deployments: `READY` matches `UP-TO-DATE` matches `AVAILABLE` (e.g. `2/2  2  2`)
- `postgres` StatefulSet: `READY 1/1`
- HPA: `REPLICAS` between its min/max, current CPU not `<unknown>`
- No pod shows a `RESTARTS` count climbing minute to minute
- No recent `Warning`-type events

## If something looks wrong

| Symptom | Go to |
|---|---|
| `RESTARTS` climbing | [02 · CrashLoopBackOff](../04-runbooks/02-crashloopbackoff.md) |
| Pod `Pending` | [03 · Pod Pending](../04-runbooks/03-pod-pending.md) |
| `ImagePullBackOff` in pod status | [01 · ImagePullBackOff](../04-runbooks/01-imagepullbackoff.md) |
| HPA current CPU `<unknown>` | [14 · High CPU and memory](../04-runbooks/14-high-cpu-and-memory.md) (covers metrics-server) |

## Checklist

- [ ] All Deployments/StatefulSet show matching ready/available counts
- [ ] No pod has a climbing restart count
- [ ] No recent `Warning` events unexplained
- [ ] HPA reporting real (not `<unknown>`) metrics
