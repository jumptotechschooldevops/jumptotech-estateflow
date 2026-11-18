# 01 · Branching and Pull Requests

**Prerequisites:** [Git and GitHub basics](../02-deployment-guides/01-git-and-github.md)
**Next step:** [02 · Code review, CI, and approvals](02-code-review-ci-and-approvals.md)

## Branch naming

`<your-name>/<short-description>` (e.g. `maria/fix-redis-ttl`) — makes it obvious who owns a
branch and roughly what it does, without opening it.

## Opening a PR

```bash
git push -u origin <your-name>/<short-description>
gh pr create --title "Short, specific title" --body-file .github/PULL_REQUEST_TEMPLATE.md
```
Or use the GitHub web UI — either way, fill out every section of the template
(`.github/PULL_REQUEST_TEMPLATE.md`), don't delete sections because they feel like extra work.

## What a good PR description includes

- **What** changed and **why** (the why matters more — the diff already shows what)
- How you tested it (which commands, what you actually observed — see
  [06-engineering-records](../06-engineering-records/README.md) for the standard for "actually
  observed")
- Anything the reviewer should pay special attention to
- Whether it needs a corresponding infrastructure/manifest change, and whether that's included
  or separate

## Keeping PRs reviewable

- One logical change per PR — a backend feature and an unrelated Dockerfile hardening fix
  should usually be two PRs, not one, so each can be reviewed and reverted independently.
- Keep it small enough that a reviewer can actually hold the whole thing in their head. If a
  PR is sprawling, that's a sign to split it.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| CI fails immediately on open | Branch out of date with `main`, or an actual lint/test failure | `git pull origin main` + rebase/merge, or fix the actual failure |
| "This branch has conflicts" | `main` changed a file your branch also touched | Merge/rebase `main` into your branch, resolve conflicts locally, push again |

## Checklist

- [ ] Branch named per convention
- [ ] PR description filled out completely, not just the diff left to speak for itself
- [ ] CI passing before requesting review
