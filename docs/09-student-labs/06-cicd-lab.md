# 06 · CI/CD Lab

**Prerequisites:** [02-deployment-guides/12 · GitHub Actions CI/CD](../02-deployment-guides/12-github-actions-cicd.md)
**Next step:** [07 · Incident response lab](07-incident-response-lab.md)

## Guided lab

Complete the one-time OIDC/role/variables setup in
[02-deployment-guides/12](../02-deployment-guides/12-github-actions-cicd.md), then trigger
`deploy.yml` manually (`gh workflow run deploy.yml --ref main -f reason="..."`) and watch it
succeed end to end — approving the run if the `staging` environment has a required reviewer
configured ([19 · Deployment approvals](../02-deployment-guides/19-deployment-approvals.md)).

## Independent practice assignment

Without re-reading the guide: open a small PR (e.g. a documentation fix), confirm `ci.yml`
runs and passes all three jobs, merge it, and **confirm `deploy.yml` does NOT run** — merging
to `main` only triggers CI, never CD, in this project (see
[17 · CI vs. CD](../02-deployment-guides/17-ci-vs-cd.md)). Then trigger a deploy yourself,
deliberately, to confirm the manual path still works.

## Controlled failure scenario

Introduce a deliberate lint error in `backend/src/routes/properties.js` on a branch (e.g. an
unused variable), push it, open a PR.

## Troubleshooting exercise

Read the failing `ci.yml` run's log for the `backend` job — identify the exact line ESLint
flagged, fix it, push again, confirm it goes green without needing to re-open the PR.

## Expected outcome

CI correctly blocks a PR with a real lint error; after fixing and pushing, the same PR's
checks re-run and pass.

## Verification checklist

- [ ] One-time OIDC/IAM/variables setup completed and verified
- [ ] A full PR → CI → merge cycle completed, and confirmed it did **not** trigger a deploy
- [ ] A deliberate, manual `deploy.yml` dispatch completed successfully end to end
- [ ] Deliberately broke and then correctly fixed a CI check

## Interview questions

1. **Why use GitHub OIDC instead of storing an AWS access key as a repository secret?**
2. **What's the actual bug this project's `ci.yml` had around Trivy scanning, and why did it
   matter?**
3. **Why does `deploy.yml` push both a commit-SHA tag and `latest`, instead of just `latest`?**
4. **Why doesn't merging a PR into `main` automatically deploy, given that's a common pattern
   at real companies?**

## Sample answers

1. An OIDC-federated role issues short-lived credentials scoped by trust-policy conditions
   (e.g. only from this exact repo/branch) — nothing persistent to leak, nothing to manually
   rotate. A static access key stored as a secret is valid indefinitely from anywhere until
   someone remembers to rotate it, and if it leaks, it works for anyone who has it.
2. The workflow built images tagged `estateflow-backend:latest` but ran Trivy against
   `jumptotech-estateflow-backend:latest` — a name that was never built — and didn't pass
   `load: true` to actually load the built image into the runner's Docker daemon. Either
   issue alone means the vulnerability scan never actually scanned the real image, silently
   defeating its purpose.
3. `latest` is a moving target — useful for "give me whatever's current," but useless as a
   rollback target since it keeps changing. The commit-SHA tag is immutable, so
   `kubectl rollout undo`/manual rollback to a specific known-good SHA tag always works,
   regardless of what `latest` currently points to.
4. Auto-deploy-on-merge is legitimate at a company where every merge to `main` is already a
   deliberate, reviewed "ship it" decision. In a teaching repo merged into by many students,
   that's not true — a routine documentation PR shouldn't silently trigger a real AWS deploy
   attempt. This project actually hit exactly that: a documentation-only merge once triggered
   `deploy.yml`, which failed at the AWS auth step because the deploy role variable had never
   been configured — harmless since it failed immediately, but a clear signal that "merge =
   deploy" was the wrong default here. Manual `workflow_dispatch` means a deploy only happens
   because someone specifically asked for one.
