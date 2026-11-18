# 13 · Student Assessments

**Prerequisites:** [02-deployment-guides](../02-deployment-guides/README.md), [09-student-labs](../09-student-labs/README.md)
**Next step:** [14-incident-simulations](../14-incident-simulations/README.md)

Formal, gradable assessments for the EstateFlow EKS lab. These are stricter and more
evidence-based than the practice labs in [09-student-labs](../09-student-labs/README.md) —
every assessment here requires the student to prove they did the work themselves, not just
follow steps.

## In this folder

| # | File | What it assesses |
|---|---|---|
| 01 | [Guided deployment assessment](01-guided-deployment-assessment.md) | Following the deployment guides correctly, with evidence |
| 02 | [Independent deployment challenge](02-independent-deployment-challenge.md) | Deploying without step-by-step guidance |
| 03 | [Architecture verification checklist](03-architecture-verification-checklist.md) | Understanding, not just execution |
| 04 | [Database and S3 integration tests](04-database-and-s3-integration-tests.md) | Data layer correctness |
| 05 | [Kubernetes and AWS troubleshooting assessment](05-kubernetes-and-aws-troubleshooting-assessment.md) | Diagnostic skill under a graded scenario |
| 06 | [Grading rubric](06-grading-rubric.md) | The shared 100-point rubric used across assessments |
| 07 | [Student submission template](07-student-submission-template.md) | What to hand in |
| 09 | [Final capstone examination](09-final-capstone-examination.md) | The comprehensive final practical exam |

The instructor evaluation template and the capstone's incident-assignment/grading guide are
kept in the private `jumptotech-estateflow-instructor` repository, not here — grading
guidance and (for the capstone) which incidents get assigned shouldn't be visible to students
browsing this repo.

## Pass/fail criteria (applies to every assessment in this folder unless overridden)

- **Pass:** score ≥ 70/100 on the rubric in [06](06-grading-rubric.md), **and** all
  "mandatory" checklist items in the specific assessment are met (a mandatory item missing is
  an automatic fail regardless of total score — e.g. submitting someone else's evidence).
- **Fail:** below 70/100, or any mandatory item unmet, or evidence that the work wasn't
  performed by the student themselves (see [07](07-student-submission-template.md)'s
  authenticity requirements).
- **Resubmission:** allowed once per assessment after addressing the instructor's written
  feedback (instructors grade using the evaluation template in the private
  `jumptotech-estateflow-instructor` repository).

## Evidence requirements (every assessment)

Every assignment in this folder requires the student to submit: the objective they were
given, the exact commands they ran, the actual output (not paraphrased), required
screenshots (terminal output and, where specified, browser screenshots of the running app),
and a completed [execution record](../06-engineering-records/01-execution-record-template.md)
or the assessment's own submission template. Screenshots and terminal output must show
visible, verifiable evidence of the student's own environment (e.g. their own shell prompt,
their own cluster context) — see each assessment's "Required screenshots" section for exactly
what to capture.
