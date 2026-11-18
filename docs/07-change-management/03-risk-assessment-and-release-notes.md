# 03 · Risk Assessment and Release Notes

**Prerequisites:** [02 · Code review, CI, and approvals](02-code-review-ci-and-approvals.md)
**Next step:** [04 · Production change record template](04-production-change-record-template.md)

## Assessing a change's risk

| Risk level | Examples in this project | Required before deploy |
|---|---|---|
| **Low** | Docs-only, a new test, a frontend copy change | Normal review + CI |
| **Medium** | A new API endpoint, a new backend dependency, a non-destructive migration | Normal review + CI + a note in release notes |
| **High** | An IAM policy change, a Secret rotation, anything touching the Postgres schema in a way that isn't purely additive, a change to the Ingress/ALB config | Second reviewer with relevant expertise, a rollback plan written *before* merging (see [15 · Rollback and recovery](../02-deployment-guides/15-rollback-and-recovery.md)), deployed during low-traffic hours if this were a real production system |

Ask explicitly: *"If this change is wrong, how would we find out, and how would we undo
it?"* If you can't answer both halves, the change isn't ready to ship.

## Release notes

Keep a short entry per deploy — doesn't need to be fancy, just real:

```markdown
## Release — <date> — <commit SHA or PR link>
- Added: <what>
- Changed: <what>
- Fixed: <what>
- Risk level: Low / Medium / High
- Rollback: <specific command/procedure, or "standard kubectl rollout undo">
```

## Production change records

For a *manual* change made directly against the running environment (not via a normal PR +
CI/CD deploy — e.g. a one-off `kubectl scale` during an incident, or an emergency IAM policy
edit), use the fuller
[04 · Production change record template](04-production-change-record-template.md) instead —
it captures more context than a release note, since there's no PR to point back to.

## Checklist

- [ ] Risk level assessed honestly, not just assumed "low" by default
- [ ] A rollback plan exists and was written before merging, not improvised after something
      went wrong
- [ ] Release notes entry added
