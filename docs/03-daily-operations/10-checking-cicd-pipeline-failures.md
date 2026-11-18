# 10 · Checking CI/CD Pipeline Failures

**Prerequisites:** `gh` CLI installed and authenticated (or use the GitHub web UI's Actions tab)
**Next step:** [11 · Reviewing infrastructure changes](11-reviewing-infrastructure-changes.md)

## Objective

Catch a broken pipeline before someone's legitimate PR gets blocked by it, and before anyone
assumes "CI is red" means their own code is wrong when it's actually an infrastructure issue
(e.g. an expired GitHub Actions OIDC trust, a Trivy CVE database update).

## Commands

```bash
gh run list --limit 10
gh run view <run-id> --log-failed
```
Or in the browser: repository → **Actions** tab → filter by workflow.

## Expected results

Recent runs mostly `success`. Any `failure` has an obvious, specific cause in the failed
step's log (not a vague timeout with no explanation, which usually means a flaky external
dependency rather than a real code bug).

## How to interpret what you see

- A **lint/test failure** is almost always a real problem in the PR's code — don't bypass it.
- A **Docker build/Trivy failure** could be a real new CVE in a base image, or a real bug in
  the Dockerfile — check the actual CVE ID before assuming it's noise.
- A **deploy job failure** (`deploy.yml`) at the AWS auth step usually means the OIDC trust
  policy or repo variables are misconfigured, not a problem with the code being deployed.

## If something looks wrong

| Symptom | Go to |
|---|---|
| Deploy fails at "Configure AWS credentials" | [12 · GitHub Actions CI/CD](../02-deployment-guides/12-github-actions-cicd.md) troubleshooting table |
| Deploy succeeds in the Actions log but the cluster doesn't reflect it | [15 · Failed GitHub Actions deployments](../04-runbooks/15-failed-github-actions-deployments.md) |
| Trivy fails on a specific CVE | Check if a patched base image version is available; this is a real finding, not noise |

## Checklist

- [ ] Reviewed the last 10 workflow runs
- [ ] Any failure's root cause identified from its actual log, not guessed
- [ ] Confirmed whether a failure is a code problem or a pipeline/infrastructure problem
