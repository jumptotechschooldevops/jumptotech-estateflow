# 15 · Rollback and Recovery

**Prerequisites:** [14 · Scaling and rolling updates](14-scaling-and-rolling-updates.md)
**Next step:** [16 · Safe resource cleanup](16-safe-resource-cleanup.md)
**Related:** [05-incident-management](../05-incident-management/README.md) if this rollback is happening during an active incident

## Why

Every deploy carries some risk of shipping a bug. The fastest, safest recovery is almost
always "go back to the last known-good version," not "try to forward-fix under pressure."
Know this procedure *before* you need it at 2am.

## Prerequisites

- `kubectl` access to `estateflow-staging`

## Commands

```bash
kubectl rollout history deployment/backend -n estateflow-staging                 # 1
kubectl rollout undo deployment/backend -n estateflow-staging                    # 2
kubectl rollout undo deployment/backend -n estateflow-staging --to-revision=3    # 2b (specific revision)
kubectl rollout status deployment/backend -n estateflow-staging                  # 3
```

## Explanation of each command

1. Lists past ReplicaSet revisions for this Deployment — helps you confirm which revision was
   actually "known good" before undoing.
2. Rolls back to the immediately previous revision. Kubernetes does this as a rolling update
   too — no downtime, same mechanism as a forward deploy.
2b. Rolls back to a *specific* revision, if the immediately-previous one isn't the one you
    want (e.g. two bad deploys in a row).
3. Confirms the rollback itself completed successfully — don't assume `rollout undo` finishing
   instantly means pods are actually healthy yet.

## When a Deployment rollback isn't enough

- **Database schema change was part of the bad deploy** — a rolling back the application code
  does *not* undo a database migration. Since this project's migrations are additive-only
  (never `DROP`/`ALTER ... DROP`), an old app version should still work against a newer schema
  — this is *why* migrations here are additive. If a migration ever needs to be destructive,
  it needs its own separate rollback plan, reviewed before merging — see
  [07-change-management](../07-change-management/README.md).
- **A bad image was pushed to `latest` and nothing else changed the Deployment spec** —
  `kubectl rollout undo` has nothing to roll back to if the Deployment spec didn't change (same
  tag, different contents). Instead, re-tag and re-push a known-good image, or
  `kubectl set image` to a specific previous commit-SHA tag (CI pushes both `latest` and
  the SHA — always keep the SHA tag as your real rollback target, never rely on `latest`).
- **The CI/CD pipeline itself is the problem** — see
  [15 · Failed GitHub Actions deployments](../04-runbooks/15-failed-github-actions-deployments.md).

## Expected results

```
deployment.apps/backend rolled back
deployment "backend" successfully rolled out
```

## Verify

Re-run [13 · Deployment verification](13-deployment-verification.md) in full after any
rollback — don't assume it worked just because the command succeeded.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `error: deployment "backend" can't be rolled back: no revision history` | Only one revision has ever existed, or history limit was exceeded | Nothing to roll back to — recover by deploying a specific known-good image tag manually instead |
| Rollback completes but the bug is still present | The bug is in data (DB rows), not code | Code rollback can't fix bad data — see if a targeted data fix is needed, with care (never edit production data without a second person reviewing) |

## Troubleshooting

If you're not sure which revision was "good," check `kubectl rollout history deployment/backend
-n estateflow-staging --revision=<N>` for each candidate — it shows the exact image tag used
in that revision.

## Completion checklist

- [ ] Know how to list rollout history and undo to a specific revision
- [ ] Understand database migrations don't roll back with `kubectl rollout undo`
- [ ] Know to always keep commit-SHA image tags as real rollback targets, not just `latest`
- [ ] Re-ran full deployment verification after a practice rollback
