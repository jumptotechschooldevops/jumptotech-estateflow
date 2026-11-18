# 18 · GitHub OIDC Authentication

**Prerequisites:** [17 · CI vs. CD](17-ci-vs-cd.md)
**Next step:** [19 · Deployment approvals](19-deployment-approvals.md)

## The problem this solves

`deploy.yml` needs to prove its identity to AWS before AWS will let it do anything. The old
way: generate a long-lived AWS access key + secret key for a dedicated IAM user, paste it
into a GitHub secret. That key works forever, from anywhere, until someone remembers to
rotate it — if it ever leaks (a careless log line, a forked PR exposing secrets, a compromised
dependency), whoever has it can use it from their own laptop with no connection to this repo
at all.

**OIDC (OpenID Connect) federation** replaces that permanent key with a short-lived token
that's only ever valid for a few minutes, tied to specific facts about the exact workflow run
that requested it.

## How it actually works, step by step

1. GitHub Actions itself can issue signed JSON Web Tokens (JWTs) to any workflow run, if that
   run requests `permissions: id-token: write` (see `deploy.yml`'s top-level `permissions:`
   block).
2. That JWT's `sub` (subject) claim encodes facts about the run — by default, something like
   `repo:jumptotechschooldevops/jumptotech-estateflow:ref:refs/heads/main` — which repo, which
   ref, and (if the job uses an `environment:`) which environment.
3. AWS has an **OIDC identity provider** registered
   (`token.actions.githubusercontent.com`, created once via
   `aws iam create-open-id-connect-provider` — see [12](12-github-actions-cicd.md)).
4. The deploy IAM role's **trust policy** says: "allow `sts:AssumeRoleWithWebIdentity`, but
   only if the presented token's `sub` claim exactly matches this specific string" (the
   `repo:...:ref:refs/heads/main` pattern above).
5. `aws-actions/configure-aws-credentials@v4` (used in `deploy.yml`) presents the GitHub-
   issued JWT to AWS STS, which checks it against the trust policy, and — if it matches —
   returns temporary AWS credentials, valid for roughly an hour, scoped to exactly that one
   role's permissions.

No step above ever involves a long-lived secret. If today's token leaked somehow, it would be
useless within the hour and useless outside the exact GitHub Actions run it was issued to in
the first place.

## Why the `sub` claim condition matters so much

The trust policy's condition is the **entire** security boundary. If it's written too loosely
(e.g. matching any branch, or any repo under an org, instead of this one repo's `main`
branch specifically), *any* workflow matching that looser pattern can assume the role — which
could mean a completely different, unrelated repo in the same GitHub org, or a feature branch
nobody reviewed, gets to deploy to this project's AWS account. Always scope it to the exact
repo and ref (or environment) that should be allowed to deploy — see
`infra/iam/backend-trust-policy.json` for the same pattern applied to the backend's own IRSA
role, which is conceptually identical even though it's a different role for a different
purpose.

## Verifying it's set up correctly

```bash
aws iam get-role --role-name estateflow-github-deploy --query "Role.AssumeRolePolicyDocument"
```
Check the printed trust policy's `Condition.StringEquals` (or `StringLike`) block names
exactly `repo:<your-org>/<your-repo>:ref:refs/heads/main` — not a wildcard, not a different
repo.

## What to do if it fails

See [20 · Troubleshooting failed AWS authentication](20-troubleshooting-aws-auth-failures.md)
for the exact diagnostic steps and a real example from this project's own history.
