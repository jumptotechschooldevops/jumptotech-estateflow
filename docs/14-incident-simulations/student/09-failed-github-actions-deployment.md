# Incident 09 (Student) · Failed GitHub Actions Deployment

**Related runbook:** [04-runbooks/15](../../04-runbooks/15-failed-github-actions-deployments.md)

## Scenario

> *Labeled training exercise, lab environment only.*

A teammate says they merged a fix an hour ago, but it "doesn't seem deployed." The app is
running fine — the question is whether it's running the *right version*.

## Detection and alerts

[03-daily-operations/10](../../03-daily-operations/10-checking-cicd-pipeline-failures.md).

## Investigation checklist

- [ ] Check the actual GitHub Actions run history for `deploy.yml` — did it run, and did it
      succeed?
- [ ] If it failed, read the exact failing step's log
- [ ] Compare the currently-running image tag in the cluster against the commit that was
      supposed to deploy
- [ ] Determine: pipeline problem, or application rollout problem?

## Relevant commands

```bash
gh run list --workflow=deploy.yml --limit 5
gh run view <run-id> --log-failed
kubectl get deployment backend -n estateflow-staging -o jsonpath='{.spec.template.spec.containers[0].image}'
git log --oneline -5 main
```

## What to submit

- The exact failing step and error message (or confirmation that no run even triggered)
- The gap between expected and actual running image tag, quantified
- Completed [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
