# 15 · Failed GitHub Actions Deployments

**Related guides:** [12 · GitHub Actions CI/CD](../02-deployment-guides/12-github-actions-cicd.md), [20 · Troubleshooting failed AWS authentication](../02-deployment-guides/20-troubleshooting-aws-auth-failures.md)

## Symptoms
`deploy.yml` fails, or reports success but `kubectl get deployment ... -o
jsonpath='{.spec.template.spec.containers[0].image}'` doesn't show the expected new tag.

## Potential customer impact
Usually none directly — a failed deploy means the *old* version keeps running, not that it
breaks. The risk is a team believing a fix has shipped when it hasn't.

## Detection and alerts
GitHub Actions run status; [10 · Checking CI/CD pipeline failures](../03-daily-operations/10-checking-cicd-pipeline-failures.md).

## Severity assessment
SEV4 on its own (nothing is actually broken for users) — escalate severity only if a critical
fix is now stuck undeployed during an active separate incident.

## Diagnosis (🔍 read-only)
```bash
gh run view <run-id> --log-failed
kubectl get deployment backend -n estateflow-staging -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

## How to interpret the output
Match the failing step name against the stages in
[12 · GitHub Actions CI/CD](../02-deployment-guides/12-github-actions-cicd.md): auth failure
(OIDC/role misconfigured), ECR push failure (registry/permissions), Trivy failure (real CVE),
or the `kubectl set image`/rollout step itself (RBAC mapping missing, or the rollout genuinely
failed — see [01](01-imagepullbackoff.md)/[02](02-crashloopbackoff.md)).

## Possible causes
- `AWS_DEPLOY_ROLE_ARN`/`ECR_REGISTRY` repository variables unset or wrong
- GitHub OIDC trust policy `sub` condition doesn't match the branch that triggered the run
- Deploy role's Kubernetes RBAC mapping missing or too narrow
- A genuine new CRITICAL/HIGH CVE failing the Trivy gate
- The rollout itself failed for an application reason (not a pipeline reason)

## Safe mitigation steps (⚠️ changes infrastructure)
No infrastructure change belongs in this runbook itself — the fix depends entirely on which
stage failed. Re-run after fixing the actual cause (the `reason` input is required):
```bash
gh workflow run deploy.yml --ref main -f reason="Re-run after fixing <the actual cause>"
```
If the `staging` environment has a required reviewer configured, this pauses for approval —
see [19 · Deployment approvals](../02-deployment-guides/19-deployment-approvals.md).

## Escalation criteria
If repository variables/trust policy look correct and it still fails at the AWS auth step,
escalate to whoever manages the GitHub OIDC provider/deploy role for this AWS account.

## Recovery verification
```bash
gh run list --workflow=deploy.yml --limit 1   # success
kubectl get deployment backend -n estateflow-staging -o jsonpath='{.spec.template.spec.containers[0].image}'
# matches the commit that was supposed to deploy
```

## Prevention recommendations
Never let a human directly `kubectl set image` to "unblock" a broken pipeline without also
fixing the pipeline itself afterward — otherwise the next real deploy fails the same way
again, and worse, the cluster and the pipeline's expectations silently diverge.
