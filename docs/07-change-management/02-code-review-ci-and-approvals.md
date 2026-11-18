# 02 · Code Review, CI, and Approvals

**Prerequisites:** [01 · Branching and pull requests](01-branching-and-pull-requests.md)
**Next step:** [03 · Risk assessment and release notes](03-risk-assessment-and-release-notes.md)

## What must pass before merge

`.github/workflows/ci.yml`, automatically on every push/PR against `main`:
- Backend: `npm ci`, `eslint`, `jest` (against throwaway Postgres+Redis containers)
- Frontend: `npm ci`, `eslint`, `vitest`, `vite build`
- `docker-build`: both images build, load into the runner, Trivy-scanned (fails on
  CRITICAL/HIGH CVEs)

None of these should ever be bypassed with `--no-verify` or a forced merge past a failing
check — a red CI check on `main` is a real signal, not noise to work around.

## What a reviewer should actually check

- Does the diff match what the PR description claims?
- Are there tests for new behavior (see the existing pattern in `backend/tests/` and
  `frontend/src/__tests__/`)?
- Any security concern — secrets, overly broad IAM, missing input validation?
- Does it touch `infra/k8s/`, `infra/iam/`, or `infra/s3/`? If so, check against
  [03 · Risk assessment and release notes](03-risk-assessment-and-release-notes.md) — these
  changes affect the live environment differently than application code.
- Is documentation updated if behavior changed (a new endpoint, a new env var)?

## Approval requirements

At minimum, one reviewer other than the author for any change — never self-merge. For changes
touching `infra/` or anything with production impact, require a second reviewer with relevant
expertise (see [`CODEOWNERS`](../../.github/CODEOWNERS) — update its placeholders to your
real team before relying on it to enforce this).

## Common errors

| Error | Cause | Fix |
|---|---|---|
| CI green but reviewer still blocks | A legitimate human concern CI can't catch (design, security judgment) | Address the feedback — CI passing is necessary, not sufficient |
| Approval given, then new commits pushed | Most repos re-require approval after new pushes by default | Re-request review after addressing feedback, don't assume the old approval still counts |

## Checklist

- [ ] All CI checks green
- [ ] At least one independent approval
- [ ] A second, more senior approval for any `infra/` change
- [ ] Documentation updated if behavior changed
