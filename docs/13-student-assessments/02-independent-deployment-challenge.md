# 02 · Independent Deployment Challenge

**Prerequisites:** [01 · Guided deployment assessment](01-guided-deployment-assessment.md) passed
**Next step:** [03 · Architecture verification checklist](03-architecture-verification-checklist.md)

## Objective

Prove you internalized the *why*, not just the command sequence — deploy EstateFlow again, in
a **second, separate** lab environment, without opening `02-deployment-guides/` except to
look up an exact command syntax you've genuinely forgotten.

## Prerequisites

- Passed [01 · Guided deployment assessment](01-guided-deployment-assessment.md)
- A second, fresh lab AWS account/namespace, distinct from the one used in assessment 01

## Tasks

1. From a clean clone of the repository, deploy the full stack to the second environment,
   using only your own notes/memory for the sequence of steps.
2. Deliberately do **not** follow the guide folder's file order as a checklist this time —
   work from your own understanding of what needs to exist before what (e.g. "the namespace
   before the ConfigMap, the ConfigMap before the Deployment that reads it").
3. Time yourself from `git clone` to a fully passing
   [deployment verification](../02-deployment-guides/13-deployment-verification.md).
4. Write a short reflection: which step did you get wrong or forget first, and why?

## Expected outcomes

A second, independently-deployed, fully working EstateFlow instance, plus an honest
self-assessment of where your understanding was weakest.

## Verification commands

Run the complete checklist in
[02-deployment-guides/13 · Deployment verification](../02-deployment-guides/13-deployment-verification.md)
without modification — this is the same bar as the guided assessment, just reached without
guided steps.

## Required screenshots

1. Terminal showing `git clone` through to the final passing health check, with timestamps
   visible (e.g. via `history` with timestamps, or a recorded terminal session)
2. `kubectl get pods -n estateflow-staging` from the **second** environment (confirm the
   namespace/cluster context differs from assessment 01's evidence, proving this is genuinely
   a separate deployment)
3. The reflection write-up (can be a text file screenshot or pasted directly into your
   submission)

## Completion criteria

- [ ] Deployed successfully without directly following the guide folder step-by-step
- [ ] Full deployment verification passes in the second environment
- [ ] Honest reflection on at least one real mistake or gap submitted
- [ ] Submitted using the [student submission template](07-student-submission-template.md)

Graded against [06 · Grading rubric](06-grading-rubric.md) — this assessment weights the
reflection section more heavily than assessment 01, since the point here is demonstrated
understanding, not just repeated execution.
