# 14 · Incident Simulations

**Prerequisites:** [04-runbooks](../04-runbooks/README.md), [05-incident-management](../05-incident-management/README.md)
**Next step:** [15-star-interview-portfolio](../15-star-interview-portfolio/README.md)

Ten realistic, **labeled training** incidents, each grounded in a failure mode this project's
own infrastructure can actually produce — verified against `infra/k8s/`, not invented. These
are used in [13-student-assessments/05](../13-student-assessments/05-kubernetes-and-aws-troubleshooting-assessment.md)
and the [capstone exam](../13-student-assessments/09-final-capstone-examination.md).

## ⚠️ Run these only in an isolated training environment

**Never inject any of these faults into a shared, staging, or production environment without
explicit approval.** Every scenario here assumes a disposable lab AWS account/namespace that
only the student and instructor are using. Fault injection against anything else is exactly
the kind of unapproved, blast-radius-unknown action this entire documentation set is designed
to train people *away* from doing.

## Structure: student-facing vs. instructor-only

- **[`student/`](student/README.md)** — what a student sees: the scenario, detection
  signals, an investigation checklist, relevant diagnostic commands, a blank incident report
  template, and practice interview questions. No answers.
- **The instructor-only side (fault-injection steps, expected diagnostic findings, root
  cause, mitigation/recovery, verification, a completed example postmortem, and a sample STAR
  answer — the answer key) lives in a separate, private repository**,
  `jumptotech-estateflow-instructor`, not in this repo. Ask your instructor for access if you
  are an instructor yourself; students should not have access to it.

This repository used to keep an `instructor-only/` folder alongside `student/` here, but a
public GitHub repository cannot actually keep a folder secret from a student who browses the
repo — so that content now lives in the private companion repository instead, where it
belongs.

## The 10 incidents

| # | Incident | Student file |
|---|---|---|
| 01 | ImagePullBackOff | [student](student/01-imagepullbackoff.md) |
| 02 | CrashLoopBackOff | [student](student/02-crashloopbackoff.md) |
| 03 | PostgreSQL EBS AZ mismatch | [student](student/03-postgresql-ebs-az-mismatch.md) |
| 04 | ALB 503 / unhealthy target groups | [student](student/04-alb-503-unhealthy-targets.md) |
| 05 | PostgreSQL connection failure | [student](student/05-postgresql-connection-failure.md) |
| 06 | S3 AccessDenied | [student](student/06-s3-accessdenied.md) |
| 07 | High CPU and HPA scaling | [student](student/07-high-cpu-hpa-scaling.md) |
| 08 | NetworkPolicy blocking database access | [student](student/08-networkpolicy-blocking-database.md) |
| 09 | Failed GitHub Actions deployment | [student](student/09-failed-github-actions-deployment.md) |
| 10 | Redis unavailable | [student](student/10-redis-unavailable.md) |

## How these relate to `04-runbooks`

Each incident here maps to exactly one runbook in [04-runbooks](../04-runbooks/README.md) —
the runbook is the *general* reference procedure anyone can read anytime; the simulation here
is a *graded exercise* built on top of it (fault injection + evidence + reporting). Students
should be able to use the runbook during the exercise, same as they would during a real
incident — the point is practicing the process, not memorizing undisclosed answers.
