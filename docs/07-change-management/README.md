# 07 · Change Management

**Prerequisites:** [01 · Git and GitHub](../02-deployment-guides/01-git-and-github.md)
**Next step:** [08-monitoring-and-observability](../08-monitoring-and-observability/README.md)

How changes get proposed, reviewed, and shipped safely. This project does **not** auto-deploy
to production on every merge without review — `deploy.yml` runs on push to `main` *after* a PR
has already been reviewed and merged, and both of its jobs use `environment: staging`, which
supports requiring a human approval gate before the deploy job runs (configure this in the
repo's Environment protection rules if it isn't already).

## In this folder

| File | Covers |
|---|---|
| [01 · Branching and pull requests](01-branching-and-pull-requests.md) | Creating a PR correctly |
| [02 · Code review, CI, and approvals](02-code-review-ci-and-approvals.md) | What reviewers check, what must pass |
| [03 · Risk assessment and release notes](03-risk-assessment-and-release-notes.md) | Judging how risky a change is, documenting what shipped |
| [04 · Production change record template](04-production-change-record-template.md) | Recording a change made directly against the running environment |

## Related GitHub configuration

- `.github/PULL_REQUEST_TEMPLATE.md` — every PR starts from this
- `.github/ISSUE_TEMPLATE/` — bug report and incident templates
- `.github/CODEOWNERS` — placeholder; **replace the example usernames with your actual team**
  before relying on it for required reviews

## Progress checklist

- [ ] Opened a PR using the template
- [ ] Understand what CI must pass before merge ([ci.yml](../../.github/workflows/ci.yml))
- [ ] Can assess a change's risk level and write release notes
- [ ] Know the production change record template for changes made outside normal CI/CD
