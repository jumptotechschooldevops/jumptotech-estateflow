# 05 · CI/CD Automation

**Prerequisites:** [02-deployment-guides/12](../02-deployment-guides/12-github-actions-cicd.md)
**Next step:** [06 · Docker image failures](06-docker-image-failures.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Tell me about a CI/CD pipeline you built or fixed."

## Situation
An existing GitHub Actions workflow had a security-scanning step that looked correct in the
YAML but, on closer inspection, could never have actually worked.

## Task
Find out why, fix it, and build out the missing deploy automation on top of a corrected
foundation.

## Action
I traced the Trivy scan step against the build step above it and found two separate
problems: the scan referenced an image name that didn't match what was actually built, and
the build step was missing the flag needed to load the built image into the runner's local
Docker daemon in the first place — so even with the right name, there was nothing for Trivy
to scan. I fixed both, then built the deploy workflow on top: GitHub OIDC authentication to
AWS (no stored access keys), build-and-push to ECR tagged with both the commit SHA and
`latest`, then a cluster rollout with an explicit health-check smoke test at the end.

## Result
The vulnerability scan now genuinely scans the real built image on every push, and a full
build→push→deploy→verify pipeline runs on merge to `main`, authenticating via short-lived
OIDC credentials rather than any stored secret.

## Follow-up technical questions
- "How would this bug have manifested if you hadn't caught it?"
- "Why tag with both the commit SHA and `latest`?"
- "Why OIDC instead of storing an AWS access key as a secret?"

## Strong sample answers
- Either the scan step would fail outright trying to find a nonexistent image, or (depending
  on the action's exact behavior) silently report nothing meaningful — either way, a real
  vulnerable image could reach production without ever actually being caught by the control
  that was supposed to catch it.
- `latest` is a moving target, useless for a precise rollback; the commit SHA is immutable,
  so it's the reliable reference for "deploy exactly this version" or "roll back to exactly
  this version."
- OIDC issues short-lived credentials scoped by trust-policy conditions (this repo, this
  branch) — nothing persistent to leak, nothing to manually rotate, unlike a static key that
  works forever until someone remembers to rotate it.

## Common mistakes
Describing "I added a CI/CD pipeline" without being able to explain a specific bug you found
and fixed in the existing one — generic descriptions are much weaker than a specific, correct
technical story.

## 60-second version
"I found a real bug in an existing CI pipeline: the vulnerability scan step referenced an
image name that didn't match what was actually built, and the build step was also missing
the flag to load the image locally — so the security scan never actually worked. I fixed
both, then built the deploy side on top: OIDC auth to AWS, build and push to ECR tagged with
the commit SHA and latest, then a cluster rollout with a health-check smoke test."

## 2-3 minute version
Add: how you noticed the bug (reading the two steps side by side, not just trusting the
YAML looked reasonable), the exact tag-name mismatch and missing flag, and the OIDC
trust-policy scoping you used for the deploy role.
