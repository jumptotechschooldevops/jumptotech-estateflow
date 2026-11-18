## What changed and why

<!-- The diff shows WHAT changed. Explain WHY. -->

## How this was tested

<!-- Exact commands run and what you actually observed. See docs/06-engineering-records/
     for the standard this project uses for "actually observed" vs. assumed. -->

## Risk level

- [ ] Low (docs, tests, copy changes)
- [ ] Medium (new endpoint/dependency, additive migration)
- [ ] High (IAM, Secret rotation, schema change, Ingress/ALB config) — requires a second
      reviewer with relevant expertise and a written rollback plan below

## Rollback plan

<!-- How to undo this if it's wrong. "Standard kubectl rollout undo" is fine for most
     Deployment changes — say so explicitly rather than leaving this blank. -->

## Checklist

- [ ] CI is green
- [ ] Tests added/updated for new behavior
- [ ] Documentation updated if behavior changed (new endpoint, new env var, new infra)
- [ ] No secrets/credentials committed
- [ ] If this touches `infra/`, I've read [docs/07-change-management](../docs/07-change-management/03-risk-assessment-and-release-notes.md)
