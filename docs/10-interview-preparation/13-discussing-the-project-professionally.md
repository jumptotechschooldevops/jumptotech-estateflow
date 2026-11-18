# 13 · Discussing the Project Professionally

**Prerequisites:** [12 · Production troubleshooting scenarios](12-production-troubleshooting-scenarios.md)
**Next step:** [14 · STAR-format answers](14-star-format-answers.md)

## Be accurate about what this is

EstateFlow is a training-lab project built for a DevOps course. It has never served real
customer traffic, and any "incident" referenced anywhere in this documentation is a labeled
training exercise (see
[05-incident-management/04](../05-incident-management/04-training-incident-scenarios.md)), not
a real production outage. **Never claim otherwise** — misrepresenting lab work as real
production experience is dishonest, and a competent interviewer can usually tell when
follow-up questions start revealing the gap, which is far worse than being upfront from the
start.

## What to emphasize instead — it's genuinely substantial

- You built and deployed real infrastructure, not just application code: Kubernetes
  manifests, IAM/IRSA, an ALB with correct health-check routing, a working CI/CD pipeline.
- You made and can justify specific engineering trade-offs (admin-token auth instead of a
  full login system, CLI/JSON instead of Terraform, server-mediated upload instead of
  client-side presigned POST) — this demonstrates judgment, which matters more to most
  interviewers than knowing every tool exists.
- You practiced real operational skills: runbook-driven troubleshooting, incident report
  writing, rollback procedures — on realistic failure modes this project's own infrastructure
  can actually produce (verified, not invented).

## How to phrase it

- "I built this as part of a DevOps training program, deploying it end-to-end on AWS EKS" —
  accurate, confident, no overclaiming.
- "In a real production system I'd add X" — shows you know the lab's limits and what a
  production system additionally needs (see
  [01-project-and-architecture.md](01-project-and-architecture.md)'s "what would you change"
  answer).
- If asked directly "was this a real production incident?" — answer honestly: "No, this was
  a training exercise I ran against a lab environment, but the failure mode and the
  diagnostic process were real."

## Common pitfalls to avoid

- Don't claim dashboards/alerting exist that don't (see
  [08-monitoring-and-observability](../08-monitoring-and-observability/README.md)'s
  implemented-vs-proposed table before answering any monitoring question).
- Don't claim a decision was made for a reason you can't actually explain if pressed — if you
  don't know *why* something in this repo is built a certain way, read the relevant guide
  before the interview, don't guess in the room.
- Don't pad your answer with every tool name you've heard of — a specific, correct answer
  about one real decision beats a vague answer that name-drops five tools.
