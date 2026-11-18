# 03 · Architecture Verification Checklist

**Prerequisites:** [01-architecture](../01-architecture/README.md), a running deployment
**Next step:** [04 · Database and S3 integration tests](04-database-and-s3-integration-tests.md)

## Objective

Prove you understand *why* the system is built the way it is, verified against the actual
running system — not just that you can recite the architecture doc.

## Prerequisites

- A working EstateFlow deployment (local or EKS)

## Tasks — for each, perform the check AND explain the result in your own words

1. **Trace one real request.** Run `curl -v http://<host>/api/properties`, and annotate the
   actual output showing: which component answered, whether `X-Cache` was `HIT` or `MISS`
   and why, and where image URLs (if any) point.
2. **Verify the cache layer is real, not just configured.** Make a write, then immediately
   `GET` the list twice — show the `X-Cache` sequence and explain why it's in that order.
3. **Verify image URLs are never stored long-lived.** Fetch a property's images twice, 10+
   seconds apart, and show the returned URLs differ (presigned signature changes each time)
   — explain why this is deliberate.
4. **Verify the database is the source of truth, not the cache.** Stop Redis
   (`kubectl scale deployment/redis --replicas=0 -n estateflow-staging` or
   `docker compose stop cache`), then show property reads still work.
5. **Verify least privilege on the backend's AWS access.** Run
   `aws iam get-policy-version` (or equivalent) on the backend's attached policy and explain,
   in your own words, exactly what it does and does not permit.

## Expected outcomes

Each task produces both a command's real output and a correct, specific explanation — a
correct command with a wrong or generic explanation does not satisfy this assessment.

## Verification commands

See each task above — this assessment's "verification" *is* the task list.

## Required screenshots

1. The annotated `curl -v` output from task 1
2. The `X-Cache` sequence from task 2
3. The two different presigned URLs from task 3, side by side
4. Redis stopped + a successful property read, from task 4

## Completion criteria

- [ ] All 5 tasks completed with both evidence and a correct written explanation
- [ ] No explanation is a copy of the architecture doc's wording verbatim — must be in your
      own words, specific to what you actually observed
- [ ] Submitted using the [student submission template](07-student-submission-template.md)

Graded against [06 · Grading rubric](06-grading-rubric.md) — this assessment is weighted
toward the "understanding" column of the rubric, not the "execution" column.
