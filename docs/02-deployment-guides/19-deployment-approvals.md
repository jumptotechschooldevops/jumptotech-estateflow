# 19 · Deployment Approvals

**Prerequisites:** [18 · GitHub OIDC authentication](18-github-oidc-authentication.md)
**Next step:** [20 · Troubleshooting failed AWS authentication](20-troubleshooting-aws-auth-failures.md)

## What a GitHub Environment actually is

A **GitHub Environment** (Settings → Environments) is a named target (here, `staging`) that
a workflow job can reference via `environment: staging`. By itself, naming an environment
does nothing special — its value comes from the **protection rules** you attach to it:

- **Required reviewers** — the run pauses right before any step in that job executes, and
  stays paused until someone with reviewer permission on that environment approves it from
  the Actions tab.
- **Deployment branch policy** — restricts which branches/tags are even allowed to deploy to
  this environment (e.g. only `main`, or only tags matching `v*`).
- **Wait timer** — a forced delay before the job starts, even after approval.

`deploy.yml`'s `build-and-push` and `deploy` jobs both already reference `environment:
staging` — that line alone does nothing until the environment's protection rules are
configured in the repository's settings.

## Setting up a required reviewer (UI — the normal way)

1. Repository → **Settings → Environments → staging** (create it if it doesn't exist yet).
2. Under **Deployment protection rules**, enable **Required reviewers**.
3. Add at least one person (not a team with zero members, and ideally not *only* the person
   who's also the one triggering the deploy — the point is a second set of eyes).
4. Save.

## Setting it up via the GitHub CLI / API (for scripting or documentation purposes)

```bash
# Look up the numeric user ID of the reviewer you want to add:
gh api users/<github-username> --jq .id

# Create/update the environment with that user as a required reviewer:
gh api --method PUT "repos/<org>/<repo>/environments/staging" \
  -f "reviewers[][type]=User" -F "reviewers[][id]=<numeric-user-id>" \
  -f "deployment_branch_policy[protected_branches]=false" \
  -f "deployment_branch_policy[custom_branch_policies]=true"
```
Then separately restrict which branches can deploy to it:
```bash
gh api --method POST "repos/<org>/<repo>/environments/staging/deployment-branch-policies" \
  -f "name=main"
```

## What this gate protects against — and what it doesn't

**Does protect against:** one person accidentally (or hastily) triggering a real AWS deploy
alone, under pressure, without a second person's sanity check — exactly the kind of mistake
that's easy to make and expensive to walk back once real traffic is pointed at a bad version.

**Does not protect against:** a reviewer rubber-stamping an approval without actually looking
at what's being deployed. The control only works if the reviewer treats the approval click as
a real decision — check the commit SHA/tag being deployed and the stated `reason` input (see
[deploy.yml](../../.github/workflows/deploy.yml)) before approving, not just click-approve
because a notification showed up.

## Verifying the gate actually works

```bash
gh workflow run deploy.yml --ref main -f reason="Testing the approval gate"
gh run list --workflow=deploy.yml --limit 1
```
If a required reviewer is configured, the run should show status `waiting` (not `in_progress`
or `completed`) until someone approves it from the Actions tab or via
`gh api --method POST repos/<org>/<repo>/actions/runs/<run-id>/deployment_protection_rule`
style approval (the UI is simpler for a one-off approval).

## Completion checklist

- [ ] `staging` environment exists
- [ ] At least one required reviewer configured, verified not to be only the person who'll
      usually trigger deploys
- [ ] Deployment branch policy restricts to `main` (or whichever branches should be allowed
      to deploy)
- [ ] A test dispatch confirmed the run actually pauses for approval before touching AWS
