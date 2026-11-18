# 04 · Production Change Record Template

**Prerequisites:** [03 · Risk assessment and release notes](03-risk-assessment-and-release-notes.md)
**Next step:** none — last file in this folder. Return to
[08-monitoring-and-observability](../08-monitoring-and-observability/README.md)

Use this for any change made **directly** against a running environment outside the normal
PR → CI → `deploy.yml` path (an emergency `kubectl` command during an incident, a manual
`aws iam` edit, a manual scale). These changes are sometimes necessary, but they bypass
review, so they need to be documented *immediately*, not "later."

```markdown
## Production Change Record — <short title>

- **Date/time (UTC):**
- **Engineer:**
- **Related incident (if any):** <link to the incident record>
- **Risk level:** Low / Medium / High

### Why this was done outside the normal change process
<e.g. "SEV1 in progress, no time to wait for a PR merge">

### Exact command(s) run

\`\`\`bash
<paste exactly what was run>
\`\`\`

### Expected effect

### Actual effect (what you verified afterward)

### Rollback plan
<how to undo this specific change, concretely>

### Follow-up required
<e.g. "open a PR to make this permanent in infra/k8s/05-backend.yaml" — a manual change that
should stick around needs to be reflected in version control afterward, or it will silently
drift from what's in Git and confuse the next person>
```

## Why this matters

Manual changes that are never recorded are exactly how a cluster's actual state quietly
diverges from what's in `infra/k8s/` — the next `kubectl apply -k infra/k8s/` either silently
reverts the manual fix (if it conflicts) or leaves an undocumented inconsistency. Recording it
immediately, and opening a follow-up PR to make a lasting fix permanent in Git, is what
prevents that drift.

## Checklist

- [ ] Record created immediately, not from memory days later
- [ ] Exact commands captured, not paraphrased
- [ ] Rollback plan written
- [ ] Follow-up PR opened if the change should be made permanent
