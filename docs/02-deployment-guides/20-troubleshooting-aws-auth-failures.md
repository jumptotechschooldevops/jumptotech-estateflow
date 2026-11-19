# 20 · Troubleshooting Failed AWS Authentication in GitHub Actions

**Prerequisites:** [19 · Deployment approvals](19-deployment-approvals.md)
**Next step:** none — last file in this folder. Return to
[02-deployment-guides/README.md](README.md).

## A real example from this project

On 2026-11-18, merging a documentation PR into `main` (back when `deploy.yml` still
auto-triggered on every push to `main`, before the fix in this same change) caused a real
GitHub Actions run of `deploy.yml`. It failed immediately at the **"Configure AWS credentials
via OIDC"** step. Checking the run's job steps individually showed every subsequent step
(ECR login, image build/push, Trivy scan, the entire `deploy` job) as **skipped** — nothing
after the auth failure ever ran. The cause was simple: `AWS_DEPLOY_ROLE_ARN` had never been
set as a repository variable, so `aws-actions/configure-aws-credentials` had nothing to
assume. No AWS resource was touched. This is a genuinely useful example precisely because
it's mundane — most AWS-auth failures in CI are exactly this unglamorous.

## Diagnostic steps, in order

### 1. Confirm the workflow even requested an OIDC token
```yaml
permissions:
  id-token: write   # must be present at the workflow or job level
```
Missing this entirely produces an error before AWS is even contacted — GitHub itself refuses
to issue a token.

### 2. Confirm the repository variable is actually set
```bash
gh variable list --repo <org>/<repo>
```
If `AWS_DEPLOY_ROLE_ARN` (or `ECR_REGISTRY`) is missing or empty, that's the single most
common cause — exactly what happened in the example above.

### 3. Read the exact error in the failed step's log
```bash
gh run view <run-id> --log-failed
```
The error message is almost always specific enough to tell you which of the remaining causes
applies:

| Error text contains | Likely cause |
|---|---|
| `Not authorized to perform sts:AssumeRoleWithWebIdentity` | Trust policy's `sub`/`aud` condition doesn't match this exact repo/ref |
| `Role ... does not exist` or `Invalid principal` | `AWS_DEPLOY_ROLE_ARN` has a typo, or the role was deleted/renamed |
| `Could not load credentials from any providers` (inside *application* code, not the auth step itself) | A different problem — see the note at the bottom about this exact message appearing in two unrelated contexts |
| No error at the auth step, fails later at `aws eks` or `kubectl` calls | Role assumed fine, but has no EKS/IAM permissions, or no in-cluster RBAC mapping — see [12](12-github-actions-cicd.md)'s common-errors table |

### 4. Confirm the OIDC provider itself is registered and matches
```bash
aws iam list-open-id-connect-providers
aws iam get-open-id-connect-provider --open-id-connect-provider-arn <arn-from-above>
```
Check the `ClientIDList` includes `sts.amazonaws.com` and the `ThumbprintList` is current —
GitHub rotates its certificate occasionally; an outdated thumbprint is a rarer but real cause.

### 5. Confirm the trust policy's exact condition string
```bash
aws iam get-role --role-name estateflow-github-deploy --query "Role.AssumeRolePolicyDocument"
```
Compare the `sub` condition character-for-character against what the actual run would
present — `repo:<org>/<repo>:ref:refs/heads/main` for a run dispatched against `main`. A
single typo (wrong repo name casing, wrong branch name, a stray trailing slash) causes
exactly the `AssumeRoleWithWebIdentity` denial from step 3.

## A specific gotcha: this exact error message, in two unrelated places

`CredentialsProviderError: Could not load credentials from any providers` can appear in two
completely different contexts in this project, and it's easy to misdiagnose which one you're
looking at:

1. **In the `deploy.yml` workflow's own steps** — means exactly what this doc covers: the
   GitHub Actions job itself couldn't authenticate to AWS.
2. **Inside the backend application's own logs/tests** — a different problem entirely: the
   Node.js AWS SDK, running *inside* the application (not inside the GitHub Actions runner),
   couldn't resolve credentials for an S3 call. This is what
   [`backend/tests/propertyImages.test.js`](../../backend/tests/propertyImages.test.js) hit
   before it was fixed — `getSignedUrl()` needed real credentials because it doesn't go
   through the mocked `.send()` path. Same error text, same underlying AWS SDK behavior
   (no credentials resolvable), but a completely different system and a completely different
   fix. Always check *which process* logged the error before chasing the wrong cause.

## Prevention

- Treat `AWS_DEPLOY_ROLE_ARN`/`ECR_REGISTRY` as required setup, checked explicitly, before
  the first real deploy attempt — not discovered missing by a failed run.
- Keep `deploy.yml` manual-only (`workflow_dispatch`, no `push` trigger) specifically so a
  missing/broken auth configuration surfaces when someone *intends* to deploy, not as a
  surprise side-effect of an unrelated merge — see
  [17 · CI vs. CD](17-ci-vs-cd.md) for why this project made that change.
- Re-run the verification command in [18](18-github-oidc-authentication.md) after any change
  to the trust policy, the OIDC provider, or the repository variables — before assuming the
  next deploy will work.
