# 17 · CI vs. CD

**Prerequisites:** [12 · GitHub Actions CI/CD](12-github-actions-cicd.md)
**Next step:** [18 · GitHub OIDC authentication](18-github-oidc-authentication.md)

A lot of beginners use "CI/CD" as one word. They're two different jobs, with two different
risk levels — and this project now deliberately treats them differently.

## CI — Continuous Integration

**Question it answers:** "Is this change safe to merge?"

- Runs automatically on **every** push and every pull request (`.github/workflows/ci.yml`).
- Lints, tests, builds, and scans — all read-only against your code, never touches AWS.
- If it's red, the PR shouldn't merge. If it's green, that's necessary but not sufficient
  evidence the change is safe to run in a real environment.
- **Nobody has to decide to run CI** — it's automatic by design, because the whole point is
  catching problems before a human even looks at the PR.

## CD — Continuous Delivery/Deployment

**Question it answers:** "Should this change go live right now?"

- In this project, CD (`.github/workflows/deploy.yml`) runs **only** when someone explicitly
  triggers it via `workflow_dispatch` — never automatically on merge.
- It builds real container images, pushes them to a real registry (ECR), and changes what's
  actually running in a real cluster (`eks-node`). Getting this wrong has real consequences —
  downtime, a bad version serving real traffic, wasted cloud spend.
- **A human decides when this runs**, and (if the `staging` environment's required-reviewer
  rule is configured) a second human has to approve it before it's allowed to touch AWS.

## Why this project chose manual CD instead of "merge = deploy"

"Merge to `main` automatically deploys" is a legitimate, common pattern — plenty of real
companies run exactly that. It's also exactly backwards for a *teaching* environment: this
repo gets pushed to and merged by many students, and every merge used to silently kick off an
attempt to authenticate to AWS and deploy, whether or not anyone intended that merge to be a
real deploy. That's how a routine documentation PR ends up triggering an AWS deploy attempt —
which is exactly what happened once in this project's own history (see
[20 · Troubleshooting failed AWS authentication](20-troubleshooting-aws-auth-failures.md) for
that exact incident). Manual dispatch means a deploy only ever happens because someone
specifically asked for one, with a stated reason, optionally approved by a second person.

## The rule of thumb

If a check only *reads* (lints, tests, scans, builds an image without pushing it) → it's CI,
and it should run on every push/PR with no human deciding each time. If a check *writes* to
something real (pushes an image, changes a running deployment, touches a cloud resource) →
it's CD, and a human should decide when, every time — even if "every time" usually means
"right after merging," the decision should still be a deliberate click, not an automatic
side-effect of `git merge`.
