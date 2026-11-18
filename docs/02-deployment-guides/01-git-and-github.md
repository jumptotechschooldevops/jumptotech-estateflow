# 01 · Git and GitHub

**Prerequisites:** none (this is the first guide).
**Next step:** [02 · Docker and Docker Compose](02-docker-and-docker-compose.md)
**Related:** [07-change-management](../07-change-management/README.md) for the PR/review process once you have changes to ship.

## Why

Every other guide in this folder assumes you can get the code onto your machine and get your
changes back out safely. Getting this step wrong (working on the wrong branch, force-pushing
over someone else's work) is one of the most common ways a new engineer causes an avoidable
problem in their first week.

## Prerequisites

- Git installed: `git --version`
- A GitHub account with access to this repository

## Commands

```bash
# 1. Clone the repo
git clone <this-repo-url>
cd jumptotech-estateflow

# 2. Check which branch you're on and whether it's clean
git status
git branch --show-current

# 3. Always branch off main before changing anything
git checkout main
git pull origin main
git checkout -b <your-name>/<short-description>

# 4. Make your changes, then review them before staging
git status
git diff

# 5. Stage and commit — specific files, not a blanket "add everything"
git add path/to/changed/file.js
git commit -m "Short, specific description of the change"

# 6. Push your branch (not main) to GitHub
git push -u origin <your-name>/<short-description>
```

## Explanation of each command

- `git clone` downloads the full repository history, not just the current files.
- `git status` before doing anything tells you if you already have uncommitted changes
  (someone else's work-in-progress, or your own from a previous session) — never run a
  destructive command (`checkout .`, `reset --hard`, `clean -f`) without checking this first.
- Branching off an up-to-date `main` (`git pull` first) avoids merging stale code.
- `git diff` before committing is how you catch an accidental debug `console.log` or a
  credential pasted into a config file *before* it becomes a permanent part of history.
- `git add <specific files>` avoids accidentally committing `.env`, build artifacts, or other
  files that shouldn't be tracked — check `git status` after a broad `git add` too.
- Pushing your own branch, never `main` directly, is what makes code review (see
  [`07-change-management`](../07-change-management/README.md)) possible at all.

## Expected results

- `git clone` creates a `jumptotech-estateflow/` directory with the full project.
- `git push -u origin <branch>` prints a GitHub-provided URL to open a pull request.

## Verify

```bash
git log --oneline -5             # your commit appears at the top
git remote -v                    # origin points at the correct GitHub repo
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `fatal: not a git repository` | Running git commands outside the cloned folder | `cd` into `jumptotech-estateflow/` first |
| `Updates were rejected because the remote contains work that you do not have` | `main` moved since you branched | `git pull origin main` (on `main`), then rebase or merge your branch on top |
| `Permission denied (publickey)` | No SSH key registered with GitHub, or using the wrong clone URL | Use the HTTPS clone URL, or set up SSH keys per GitHub's docs |

## Troubleshooting

**"I think I just committed a secret."** Do not push. If you haven't pushed yet, `git reset
--soft HEAD~1` to undo the commit (keeps your file changes), remove the secret, recommit. If
you already pushed, tell your team lead immediately — the secret must be rotated/invalidated
regardless of whether you can rewrite history, since it may already be cached by GitHub.

**"I'm on the wrong branch and have uncommitted changes I want to keep."**
```bash
git stash              # saves your changes aside
git checkout <correct-branch>
git stash pop           # re-applies them here
```

## Rollback

Undoing a local, unpushed commit: `git reset --soft HEAD~1` (keeps changes staged) or
`git reset --hard HEAD~1` (discards them — check `git status` first, this is destructive).
Undoing a *pushed* commit on a shared branch: never force-push over others' work — open a new
PR with a revert commit instead (`git revert <commit-sha>`).

## Completion checklist

- [ ] Repository cloned locally
- [ ] Able to create a branch, commit, and push it to GitHub
- [ ] Comfortable running `git status`/`git diff` before every commit
- [ ] Know how to stash changes and how to revert (not force-push over) a shared commit
