# First Day as a DevOps Engineer

**Prerequisites:** [What is EstateFlow?](01-what-is-estateflow.md)
**Next step:** [01-architecture](../01-architecture/README.md)

This is a practical checklist for your literal first day. Work through it top to bottom.

## 1. Accounts and access to request

Ask your manager or the cluster owner for each of these — don't wait until you need them mid-task:

- [ ] GitHub access to this repository (write access if you'll open PRs)
- [ ] AWS account access — an IAM user or SSO role that can run `aws sts get-caller-identity`
- [ ] Confirmation of which AWS account/region hosts the `eks-node` cluster (this project assumes
      `us-east-1`)
- [ ] `kubectl` access to the `eks-node` cluster, namespace `estateflow-staging` — ask to be
      added to the cluster's `aws-auth` ConfigMap / access entries with at least read access
      first
- [ ] Access to whatever dashboards/alerting the team actually uses today — see
      [`08-monitoring-and-observability/README.md`](../08-monitoring-and-observability/README.md)
      for what is and isn't set up yet for this project
- [ ] Access to the team's on-call/paging tool and incident chat channel, if you'll go on-call
      (see [`05-incident-management/README.md`](../05-incident-management/README.md))

**If you don't have access to something a doc tells you to use:** stop and ask for it — don't
work around a missing permission by using someone else's credentials or a personal AWS account.

## 2. Tools to install

| Tool | Check it's installed | Docs |
|---|---|---|
| Git | `git --version` | [Git and GitHub guide](../02-deployment-guides/01-git-and-github.md) |
| Docker | `docker --version` | [Docker guide](../02-deployment-guides/02-docker-and-docker-compose.md) |
| Node.js 20+ | `node --version` | — |
| AWS CLI v2 | `aws --version` | [AWS CLI/ECR guide](../02-deployment-guides/03-aws-cli-and-ecr.md) |
| kubectl | `kubectl version --client` | [EKS/Kubernetes guide](../02-deployment-guides/04-eks-and-kubernetes-basics.md) |
| eksctl (optional) | `eksctl version` | same as above |

## 3. Clone and run the project locally

```bash
git clone <this-repo-url>
cd jumptotech-estateflow
cp .env.example .env            # set ADMIN_API_TOKEN to anything for local use
docker compose up --build -d
docker compose ps               # all four services should say "healthy"
curl http://localhost:8080/api/health
```
Expected: `{"status":"ok","db":"up","redis":"up"}`. If this doesn't work, stop here and fix it
before going further — everything else assumes a working local environment. Full detail:
[Docker and Docker Compose](../02-deployment-guides/02-docker-and-docker-compose.md).

## 4. Read the architecture doc

[`01-architecture/README.md`](../01-architecture/README.md) — read it fully before writing any
infrastructure code. You should be able to redraw the diagram from memory afterward.

## 5. Where to find things once you're on a real team

| Need | Where to look |
|---|---|
| "Is prod healthy right now?" | [Daily ops: morning health check](../03-daily-operations/01-morning-production-health-check.md) |
| "This specific thing is broken" | [Runbooks index](../04-runbooks/README.md) |
| "There's an active incident" | [Incident management](../05-incident-management/README.md) |
| "I need to document what I just did" | [Engineering records](../06-engineering-records/README.md) |
| "I want to open a PR" | [Change management](../07-change-management/README.md) |
| "What dashboards/alerts exist?" | [Monitoring and observability](../08-monitoring-and-observability/README.md) |
| "I want structured practice" | [Student labs](../09-student-labs/README.md) |

## 6. Your first real tasks

1. Complete the capstone lab once, start to finish, in a sandbox/lab AWS account —
   [`09-student-labs/08-capstone-end-to-end-deployment.md`](../09-student-labs/08-capstone-end-to-end-deployment.md).
2. Pick one runbook and actually run its *diagnostic* (read-only) commands against the lab
   environment, even with nothing broken, so the commands aren't unfamiliar during a real
   incident.
3. Open one small PR (even a documentation fix) to practice the actual review workflow —
   [`07-change-management/01-branching-and-pull-requests.md`](../07-change-management/01-branching-and-pull-requests.md).

## 7. How to escalate when you're stuck or something looks wrong

- **Not an emergency, just confused:** ask in the team channel — include what you ran and what
  you expected vs. what happened. Don't spend more than ~30 minutes silently stuck.
- **Something in a shared environment looks broken:** check
  [`04-runbooks/README.md`](../04-runbooks/README.md) for a matching symptom first; if it's
  actively affecting other engineers or looks customer-facing, follow
  [`05-incident-management/02-communication-and-escalation.md`](../05-incident-management/02-communication-and-escalation.md)
  instead of trying to fix it quietly on your own.
- **You think you might have caused a problem:** say so immediately, with what you ran. A fast,
  honest report is always the right call — faster escalation means a smaller blast radius.
