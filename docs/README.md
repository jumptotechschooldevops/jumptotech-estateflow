# EstateFlow Engineering Documentation

A complete, numbered documentation set for operating EstateFlow like a real company's
engineering knowledge base — onboarding, step-by-step deployment guides, daily operations,
production runbooks, incident management, change management, monitoring, hands-on labs,
graded assessments, incident simulations, interview preparation, portfolios, and shift
handover. Everything here is organized so you can clone this repository and find the right
procedure — including how to prove you learned it — without asking an instructor.

**Nothing in this documentation has been applied to real AWS/EKS infrastructure on your
behalf.** Every command is something *you* run, deliberately, checking the stated expected
result at each step — see each guide's own safety notes.

## Three recommended reading orders

Pick the one matching what you're trying to do right now. All three draw from the same
numbered folders below — nothing is duplicated between them, each is just a different order
to read the same material in.

### Path A — New DevOps Engineer (first time through)
[00](00-start-here/README.md) → [01](01-architecture/README.md) → [02](02-deployment-guides/README.md)
→ [03](03-daily-operations/README.md) → [04](04-runbooks/README.md) → [06](06-engineering-records/README.md)
→ [07](07-change-management/README.md) → [09](09-student-labs/README.md) →
[13](13-student-assessments/README.md)

### Path B — On-Call / SRE (operational readiness)
[03](03-daily-operations/README.md) → [04](04-runbooks/README.md) → [05](05-incident-management/README.md)
→ [08](08-monitoring-and-observability/README.md) → [09 lab 07](09-student-labs/07-incident-response-lab.md)
→ [14](14-incident-simulations/README.md) → [11](11-handover/README.md)

### Path C — Interview Preparation
[01](01-architecture/README.md) → [02](02-deployment-guides/README.md) → [04](04-runbooks/README.md)
→ [09 lab 08 (capstone)](09-student-labs/08-capstone-end-to-end-deployment.md) →
[10](10-interview-preparation/README.md) → [15](15-star-interview-portfolio/README.md) →
[16](16-student-portfolios/README.md)

## Full folder index

| # | Folder | What's in it |
|---|---|---|
| 00 | [start-here](00-start-here/README.md) | What EstateFlow is, first day as a DevOps engineer |
| 01 | [architecture](01-architecture/README.md) | The full system design and the reasoning behind it |
| 02 | [deployment-guides](02-deployment-guides/README.md) | 16 step-by-step, tool-by-tool guides, Git through cleanup |
| 03 | [daily-operations](03-daily-operations/README.md) | 12 independently-executable routine health checks |
| 04 | [runbooks](04-runbooks/README.md) | 17 symptom → diagnosis → mitigation procedures |
| 05 | [incident-management](05-incident-management/README.md) | Severities, roles, templates, labeled training scenarios |
| 06 | [engineering-records](06-engineering-records/README.md) | How to document any task so it's verifiable later |
| 07 | [change-management](07-change-management/README.md) | Branching, PRs, review, risk, production change records |
| 08 | [monitoring-and-observability](08-monitoring-and-observability/README.md) | What's implemented today vs. proposed — read before claiming either |
| 09 | [student-labs](09-student-labs/README.md) | Guided + independent practice labs per technology, plus the capstone lab |
| 10 | [interview-preparation](10-interview-preparation/README.md) | Per-topic Q&A, troubleshooting scenarios, STAR format |
| 11 | [handover](11-handover/README.md) | End-of-shift handover template and a worked example |
| 13 | [student-assessments](13-student-assessments/README.md) | Graded assessments, 100-point rubric, final capstone exam |
| 14 | [incident-simulations](14-incident-simulations/README.md) | 10 gradable incidents, student/instructor content kept separate |
| 15 | [star-interview-portfolio](15-star-interview-portfolio/README.md) | 12 complete STAR examples + an editable template for your own |
| 16 | [student-portfolios](16-student-portfolios/README.md) | A portfolio README template for your own GitHub repository |

*(There is no folder 12 — numbering is intentionally stable as this documentation set grows;
nothing was removed.)*

## Related configuration outside `docs/`

- `infra/k8s/README.md` — exact `kubectl`/`kustomize` commands for the Kubernetes manifests
- `infra/iam/README.md` — exact IAM role/policy commands (IRSA)
- `infra/s3/README.md` — exact S3 bucket provisioning commands
- `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`, `.github/CODEOWNERS` — GitHub-native templates referenced throughout [07-change-management](07-change-management/README.md)
- Root [`README.md`](../README.md) — local Docker Compose quick start

## For instructors

This repository (`jumptotech-estateflow`) is public and contains **only** student-facing
material. Fault-injection steps, expected diagnostic findings, root causes, completed
example postmortems, and grading guides for
[13-student-assessments](13-student-assessments/README.md) and
[14-incident-simulations](14-incident-simulations/README.md) live in a separate, **private**
companion repository: `jumptotech-estateflow-instructor`. Request access to that repository
if you're an instructor; students should never be given access to it. Each student-facing
file that used to link directly to an answer key now says so in plain text instead of linking
to it, so this repository has no broken or misleading links either way.

## How to navigate this on GitHub

Every folder has its own `README.md` that lists its numbered files in the order you should
read them, with **Prerequisites**/**Next step** links at the top of each file, and
**Related runbook**/**Related guide** links where relevant. Start at whichever folder's
`README.md` matches your reading order above, and follow the links forward — you should
never need to guess what to read next.
