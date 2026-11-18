# 01 · Sample Handover Document

**Prerequisites:** [README · handover template](README.md)
**Next step:** none — last file in the numbered documentation set.

This is a realistic, honestly-labeled example — written for a lab/training context, not
describing a real production shift. Use it as a model for format and level of detail, not as
a claim that these specific events happened against real customer traffic.

```markdown
## Shift Handover — 2026-11-17 — Engineer A → Engineer B

### Overall status
All clear in the lab environment. No active incidents. One pending follow-up item below.

### Open incidents
None open. One training incident exercise was run and fully resolved earlier today — see
docs/05-incident-management/04-training-incident-scenarios.md Scenario 2 (bad image tag).
Recovery verified via full deployment verification; no lingering effect.

### Pending deployments
None pending — `main` and the lab cluster's running image tags are in sync as of this
handover (confirmed via `kubectl get deployment backend -n estateflow-staging -o
jsonpath='{.spec.template.spec.containers[0].image}'` against the latest merged commit SHA).

### Known infrastructure problems (not yet incidents, but worth knowing)
None currently known in the lab environment.

### Scheduled maintenance
None scheduled.

### Unresolved alerts
N/A — no automated alerting is implemented for this project yet (see
docs/08-monitoring-and-observability/README.md's implemented-vs-proposed table). Manual
checks per docs/03-daily-operations/09-reviewing-alerts.md were run this shift with nothing
found.

### Changes made this shift
- Ran the training incident Scenario 2 exercise (bad image tag), recovered via
  `kubectl rollout undo`, recorded in docs/06-engineering-records/ per the standard template.
- No other changes to the running environment.

### Next engineer action items
- No action required before your shift starts — environment is in a known-good, fully
  verified state.
- If you haven't yet, review docs/04-runbooks/README.md so the runbook structure is familiar
  before you need it under time pressure.
```

## What makes this a useful handover

It states the *actual* current state honestly (including "no alerting exists yet" rather
than pretending otherwise), distinguishes a completed training exercise from a real incident
explicitly, and gives the next engineer a concrete, checkable starting point rather than a
vague "everything's fine, I think."
