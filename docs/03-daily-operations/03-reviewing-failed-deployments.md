# 03 · Reviewing Failed Deployments

**Prerequisites:** `kubectl` access to `estateflow-staging`
**Next step:** [04 · Investigating application logs](04-investigating-application-logs.md)

## Objective

Confirm the most recent rollout actually completed, and if it didn't, understand why before
anyone tries to deploy again on top of a half-finished rollout.

## Commands

```bash
kubectl rollout status deployment/backend -n estateflow-staging --timeout=10s
kubectl rollout status deployment/frontend -n estateflow-staging --timeout=10s
kubectl rollout history deployment/backend -n estateflow-staging
kubectl describe deployment backend -n estateflow-staging | grep -A5 Conditions
```

## Expected results

Both `rollout status` commands print `successfully rolled out` immediately (not timing out).
`Conditions` shows `Progressing: True, Reason: NewReplicaSetAvailable` (fully settled) — not
stuck mid-progress.

## If something looks wrong

| Symptom | Go to |
|---|---|
| `rollout status` times out / never completes | [02 · CrashLoopBackOff](../04-runbooks/02-crashloopbackoff.md) or [03 · Pod Pending](../04-runbooks/03-pod-pending.md) depending on what the new pods are doing |
| Old image tag still running despite a "successful" CI/CD run | [15 · Failed GitHub Actions deployments](../04-runbooks/15-failed-github-actions-deployments.md) |
| Rollout succeeded but the app behaves wrong | [15 · Rollback and recovery](../02-deployment-guides/15-rollback-and-recovery.md) |

## Checklist

- [ ] Both Deployments report a completed (not stuck) rollout
- [ ] Current image tag matches what was intended to be deployed
- [ ] No half-finished rollout left for the next person to accidentally build on top of
