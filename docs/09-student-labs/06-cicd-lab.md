# 06 · CI/CD Lab

**Prerequisites:** [02-deployment-guides/12 · GitHub Actions CI/CD](../02-deployment-guides/12-github-actions-cicd.md)
**Next step:** [07 · Incident response lab](07-incident-response-lab.md)

## Guided lab

Complete the one-time OIDC/role/variables setup in
[02-deployment-guides/12](../02-deployment-guides/12-github-actions-cicd.md), then trigger
`deploy.yml` manually (`gh workflow run deploy.yml`) and watch it succeed end to end.

## Independent practice assignment

Without re-reading the guide: open a small PR (e.g. a documentation fix), confirm `ci.yml`
runs and passes all three jobs, merge it, confirm `deploy.yml` then runs automatically.

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
- [ ] A full PR → CI → merge → auto-deploy cycle completed successfully
- [ ] Deliberately broke and then correctly fixed a CI check

## Interview questions

1. **Why use GitHub OIDC instead of storing an AWS access key as a repository secret?**
2. **What's the actual bug this project's `ci.yml` had around Trivy scanning, and why did it
   matter?**
3. **Why does `deploy.yml` push both a commit-SHA tag and `latest`, instead of just `latest`?**

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
