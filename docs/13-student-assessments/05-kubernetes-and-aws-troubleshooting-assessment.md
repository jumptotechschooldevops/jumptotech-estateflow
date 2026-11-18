# 05 · Kubernetes and AWS Troubleshooting Assessment

**Prerequisites:** [04-runbooks](../04-runbooks/README.md), [09-student-labs/07](../09-student-labs/07-incident-response-lab.md)
**Next step:** [06 · Grading rubric](06-grading-rubric.md)

## Objective

A graded, timed diagnostic exercise — the instructor injects a fault from
[14-incident-simulations](../14-incident-simulations/README.md) without telling you which
one, and you diagnose and resolve it using only your own skills and the public runbooks.

## Prerequisites

- Instructor access to the private `jumptotech-estateflow-instructor` repository's
  `incident-simulations/` folder, to select and inject a fault
- A lab environment the student doesn't control the fault-injection on (to keep it a genuine
  diagnostic exercise)

## Tasks

1. Instructor injects **one** fault from the 10 scenarios in
   [14-incident-simulations](../14-incident-simulations/README.md), without revealing which.
2. Student has 30 minutes to: detect the problem, classify its severity per
   [05-incident-management](../05-incident-management/README.md), diagnose the root cause
   using only 🔍 read-only commands, and propose (but not necessarily execute, if the
   instructor wants to assess diagnosis separately from remediation) the correct fix.
3. Student writes up findings using the
   [incident report template](../05-incident-management/03-incident-templates.md#incident-report-template).
4. Instructor compares the student's findings against the matching answer key in the
   private `jumptotech-estateflow-instructor` repository for that scenario.

## Expected outcomes

Correct identification of the fault category (even if the exact wording differs from the
answer key), a correctly justified severity classification, and a complete, honest incident
report — including noting anything the student wasn't sure about, rather than guessing and
presenting it as fact.

## Verification commands

Whatever the student used during diagnosis — this is the evidence itself; see the required
screenshots below.

## Required screenshots

1. Every diagnostic command run and its output, in the order run (a terminal transcript is
   ideal)
2. The completed incident report
3. Timestamp evidence showing the exercise was completed within the time limit (or an honest
   note that it wasn't, with how far they got)

## Completion criteria

- [ ] Root cause correctly identified (matches the instructor's answer key's category)
- [ ] Severity classification justified, not just stated
- [ ] Incident report complete and honest about uncertainty
- [ ] Completed within the time limit, or a clear account of where time ran out

Graded against [06 · Grading rubric](06-grading-rubric.md) — the diagnostic-accuracy and
process columns are weighted most heavily here; a correct final answer reached by guessing,
without the diagnostic trail to support it, scores lower than a thorough, correct process.
