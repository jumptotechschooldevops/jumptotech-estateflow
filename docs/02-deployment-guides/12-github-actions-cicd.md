# 12 · GitHub Actions CI/CD

**Prerequisites:** [03 · AWS CLI and ECR](03-aws-cli-and-ecr.md), [09 · Ingress](09-ingress-alb-and-target-groups.md) deployed at least once manually
**Next step:** [13 · Deployment verification](13-deployment-verification.md)

## Why

Manually building, pushing, and `kubectl set image`-ing every change doesn't scale past one
person, and is easy to get wrong under pressure. `.github/workflows/ci.yml` and `deploy.yml`
automate it, with no long-lived AWS credentials stored anywhere in GitHub.

## What `ci.yml` does (every push/PR)

| Job | Steps |
|---|---|
| `backend` | spins up throwaway Postgres+Redis service containers, `npm ci`, `eslint`, `jest` |
| `frontend` | `npm ci --legacy-peer-deps`, `eslint`, `vitest`, `vite build` |
| `docker-build` | builds both images, loads them into the runner's Docker daemon, Trivy-scans each (fails on CRITICAL/HIGH CVEs) |

A real bug this project's maintainers fixed: the `docker-build` job used to scan an image name
that was never actually built (`jumptotech-estateflow-backend:latest` vs. the real
`estateflow-backend:latest`), and was missing `load: true` so the built image never reached
the local Docker daemon for Trivy to find. Both are fixed now — scanned image names match
built ones exactly.

## What `deploy.yml` does (push to `main` / manual dispatch)

1. **`build-and-push`**: OIDC-authenticates to AWS, logs into ECR, builds+pushes both images
   tagged with the short commit SHA *and* `latest`, Trivy-scans the exact pushed tag.
2. **`deploy`**: re-authenticates, points `kubectl` at `eks-node`, runs `kubectl set image` on
   both Deployments, waits for rollout, smoke-tests `/api/health` from inside the cluster.

## Prerequisites (one-time AWS/GitHub setup)

```bash
aws iam create-open-id-connect-provider \                                                # 1
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

aws iam create-role --role-name estateflow-github-deploy \                               # 2
  --assume-role-policy-document file://<your-github-oidc-trust-policy.json>
# trust policy Principal.Federated = the OIDC provider ARN from step 1; Condition on
# token.actions.githubusercontent.com:sub = "repo:<org>/<repo>:ref:refs/heads/main"

eksctl create iamidentitymapping \                                                       # 3
  --cluster eks-node --region us-east-1 \
  --arn arn:aws:iam::<AWS_ACCOUNT_ID>:role/estateflow-github-deploy \
  --username github-actions-deploy \
  --group estateflow-deployers    # bind this group to a Role/RoleBinding scoped to estateflow-staging

aws ecr create-repository --repository-name estateflow-backend --region us-east-1        # 4
aws ecr create-repository --repository-name estateflow-frontend --region us-east-1
```
Then in GitHub (Settings → Secrets and variables → Actions → **Variables**, not Secrets, since
none of these are sensitive by themselves):
- `AWS_DEPLOY_ROLE_ARN` = the role ARN from step 2
- `ECR_REGISTRY` = `<account-id>.dkr.ecr.us-east-1.amazonaws.com`

## Explanation of each command

1. One-time per AWS account: registers GitHub's OIDC issuer as trusted.
2. Creates the role GitHub Actions assumes — scoped by the trust policy's `sub` condition to
   only this repo's `main` branch, so no other repo/branch can assume it.
3. IAM alone doesn't grant Kubernetes RBAC — this maps the IAM role to a Kubernetes identity
   with permissions scoped to `estateflow-staging` only, never cluster-admin.
4. Creates the registries the workflow pushes to (skip if already done in
   [03](03-aws-cli-and-ecr.md)).

## Expected results

A `gh run watch` (or the Actions tab) shows both jobs green, ending with
`deployment "backend" successfully rolled out` / same for frontend, then a `200` from the
smoke-test curl.

## Verify

```bash
kubectl get deployment backend -n estateflow-staging \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
# shows the new commit-SHA tag after a successful deploy run
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| Fails at "Configure AWS credentials" | `AWS_DEPLOY_ROLE_ARN` variable unset, or trust policy `sub` condition doesn't match the branch/repo | Re-check the trust policy exactly matches `repo:<org>/<repo>:ref:refs/heads/main` |
| Fails at "Update kubeconfig" step succeeding but `kubectl` commands failing after | Role has `eks:DescribeCluster` but no in-cluster RBAC mapping | Re-check step 3 above was actually applied |
| Trivy step fails the build | A real CRITICAL/HIGH CVE in a base image | [15 · Failed GitHub Actions deployments](../04-runbooks/15-failed-github-actions-deployments.md) |

## Troubleshooting

Read the failing step's full log in the Actions tab first — it names the exact command and
exit code. Don't guess; the log output is complete.

## Rollback

A bad automated deploy is undone the same way as a manual one — see
[15 · Rollback and recovery](15-rollback-and-recovery.md). The workflow itself has no
auto-rollback; a human decides.

## Completion checklist

- [ ] GitHub OIDC provider registered in this AWS account
- [ ] Deploy role created, scoped to this repo's `main` branch only
- [ ] Deploy role mapped to in-cluster RBAC scoped to `estateflow-staging`
- [ ] `AWS_DEPLOY_ROLE_ARN` and `ECR_REGISTRY` set as repository variables
- [ ] A manual `gh workflow run deploy.yml` (or a push to `main`) completes successfully end to end
