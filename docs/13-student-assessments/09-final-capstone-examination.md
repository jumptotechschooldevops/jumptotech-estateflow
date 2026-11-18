# 09 · Final Capstone Examination

**Prerequisites:** all of [01–05](README.md), [14-incident-simulations](../14-incident-simulations/README.md), [15-star-interview-portfolio](../15-star-interview-portfolio/README.md)
**Next step:** none — this is the final assessment. See [16-student-portfolios](../16-student-portfolios/README.md) to record the result.

## Objective

A single, comprehensive practical exam proving end-to-end DevOps/SRE competency on
EstateFlow: deploy it, verify it, survive two injected incidents, document the recovery, and
defend your work verbally — the same shape as a real on-call shift plus a technical
interview, back to back.

## Prerequisites

- A clean lab AWS account/namespace, provisioned fresh for the exam (not reused from earlier
  assessments, so there's no leftover state to lean on)
- Completed all assessments 01–05 and at least 5 STAR examples from
  [15-star-interview-portfolio](../15-star-interview-portfolio/README.md)

## Exam tasks

1. **Clone** the EstateFlow repository from a clean checkout.
2. **Deploy** the full application to the lab environment.
3. **Verify** Frontend, Backend, PostgreSQL, Redis, ALB, and S3 — all six, individually, with
   real commands (not just "the homepage loaded").
4. **Troubleshoot two instructor-assigned incidents** from
   [14-incident-simulations](../14-incident-simulations/README.md), injected without warning
   as in [13-student-assessments/05](05-kubernetes-and-aws-troubleshooting-assessment.md).
5. **Restore service** for both incidents.
6. **Document** the investigation and recovery for both, in real time (not reconstructed
   afterward from memory).
7. **Complete incident reports** using the
   [incident report template](../05-incident-management/03-incident-templates.md#incident-report-template)
   for both.
8. **Explain the architecture** verbally to the instructor, from memory, including at least
   two deliberate trade-offs and why they were made.
9. **Present two STAR stories** from your
   [STAR interview portfolio](../15-star-interview-portfolio/README.md), live, in the
   60-second format first, then expand to the 2-3 minute format on request.
10. **Answer technical follow-up questions** the instructor asks based on your own
    submission — not generic trivia, specifically about what you did and why.

## Expected outcomes

A fully deployed, verified EstateFlow instance; two resolved incidents with complete,
contemporaneous documentation; a confident, accurate verbal walkthrough of the architecture;
and two well-delivered STAR stories.

## Verification commands

All of [02-deployment-guides/13 · Deployment verification](../02-deployment-guides/13-deployment-verification.md),
plus each incident's specific recovery-verification steps from its
[student scenario file](../14-incident-simulations/README.md).

## Required screenshots / evidence

1. Full deployment verification output (all six components)
2. Diagnostic command transcripts for both incidents, in the order run
3. Both completed incident reports
4. A note confirming the live verbal portions (architecture explanation, STAR delivery,
   follow-up Q&A) were completed, signed by the instructor

## Completion criteria

- [ ] All 10 exam tasks completed
- [ ] Both incidents correctly diagnosed and resolved
- [ ] Both incident reports complete and submitted in real time, not backfilled
- [ ] Architecture explained correctly and specifically, not generically
- [ ] Both STAR stories delivered in both the 60-second and 2-3 minute formats

## Scoring

Graded against the 100-point rubric in
[06 · Grading rubric](06-grading-rubric.md), with capstone-specific weighting and the full
instructor grading process kept in the private `jumptotech-estateflow-instructor` repository
(which incidents get assigned and how they're scored isn't shared with students ahead of the
exam). **Pass requires ≥ 70/100 and no automatic-fail condition**, same as every other assessment in
this folder.
