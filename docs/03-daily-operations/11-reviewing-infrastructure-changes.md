# 11 · Reviewing Infrastructure Changes

**Prerequisites:** `kubectl`/`git` access
**Next step:** [12 · Shift handover](12-shift-handover.md)

## Objective

Know what changed recently — in Git and in the live cluster — before you start debugging
something "randomly" broken. Most "mystery" incidents trace back to a change someone forgot
to mention.

## Commands

```bash
git log --since="24 hours ago" --oneline main
kubectl rollout history deployment/backend -n estateflow-staging
kubectl rollout history deployment/frontend -n estateflow-staging
kubectl get events -n estateflow-staging --field-selector reason=ScalingReplicaSet --sort-by=.lastTimestamp
```

## Expected results

A short, explainable list of recent commits/rollouts/scaling events — each one you can match
to a known PR or a known traffic pattern.

## How to interpret what you see

An infrastructure change (manifest edit, IAM policy change, StorageClass change) that *isn't*
reflected in `git log` for this repo likely happened as a manual `kubectl`/`aws` command
outside the normal change process — see
[`07-change-management/README.md`](../07-change-management/README.md). That's worth raising
with whoever made it, not silently reverting.

## If something looks wrong

| Symptom | Go to |
|---|---|
| An unexplained manual change to a live resource | Ask the team; document it in [`06-engineering-records`](../06-engineering-records/README.md) retroactively if legitimate |
| A recent deploy correlates with a new problem | [15 · Rollback and recovery](../02-deployment-guides/15-rollback-and-recovery.md) |

## Checklist

- [ ] Recent commits to `main` reviewed
- [ ] Recent rollout/scaling history reviewed
- [ ] Any unexplained manual change identified and followed up on
