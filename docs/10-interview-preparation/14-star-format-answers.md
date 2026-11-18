# 14 · STAR-Format Answers

**Prerequisites:** [13 · Discussing the project professionally](13-discussing-the-project-professionally.md)
**Next step:** [15-star-interview-portfolio](../15-star-interview-portfolio/README.md) for 12
full examples (interview question, follow-ups, common mistakes, 60-second and 2-3 minute
versions) — this file is the short introduction to the method, that folder is the full
portfolio.

## The STAR method

**Situation** — brief context. **Task** — what you specifically needed to accomplish.
**Action** — what you actually did, in enough technical detail to show real understanding.
**Result** — the outcome, verified, not assumed.

Every example below is honestly framed as lab/training work — see
[13 · Discussing the project professionally](13-discussing-the-project-professionally.md)
before using any of these in a real interview.

## Example 1 — Finding and fixing a real bug in a CI pipeline

**Situation:** While reviewing this project's existing GitHub Actions workflow as part of
extending it with S3/EKS support, I found the Docker image vulnerability scan step referenced
a different image name (`jumptotech-estateflow-backend:latest`) than the one actually built
(`estateflow-backend:latest`), and the build step was missing the flag needed to load the
image into the runner's local Docker daemon in the first place.
**Task:** Make the Trivy security scan actually scan the real image, since as written it
either failed outright or silently scanned nothing.
**Action:** I traced the exact tag mismatch by reading both the build and scan steps side by
side, added `load: true` to both build steps, and corrected the scanned image references to
match the actual built tags.
**Result:** The scan now runs against the real built image on every push/PR, verified by
confirming the step references match exactly and running the corrected workflow.

## Example 2 — Designing least-privilege IAM for a new feature

**Situation:** Adding property-image uploads to this lab project required giving the backend
AWS S3 permissions for the first time — previously it had none.
**Task:** Grant exactly the access needed, nothing more, without using long-lived AWS access
keys anywhere in the application.
**Action:** I used IAM Roles for Service Accounts (IRSA) instead of static credentials, wrote
a policy scoped to `GetObject`/`PutObject`/`DeleteObject` under one S3 key prefix in one
named bucket only (not the whole bucket, not other AWS services), and kept this role entirely
separate from the AWS Load Balancer Controller's existing, much broader role on the same
cluster.
**Result:** The backend can upload/read/delete only its own property images; verified by
confirming a scoped-down policy test (temporarily detaching the policy) produces the expected
`AccessDenied`, and re-attaching restores access immediately with no pod restart needed.

## Example 3 — Running a training incident-response exercise

**Situation:** As part of practicing operational readiness for this lab project, I ran a
deliberate failure scenario: deploying a nonexistent image tag to the backend Deployment.
**Task:** Diagnose and recover using the project's own runbook, under a self-imposed time
limit, and produce a complete incident report.
**Action:** I used only the runbook's read-only diagnostic commands first (`kubectl describe
pod`'s Events section) to confirm the exact cause before acting, then used `kubectl rollout
undo` to recover rather than guessing at a specific previous tag from memory, and verified
full recovery against the project's deployment-verification checklist afterward.
**Result:** Recovered within the exercise's time limit; wrote a complete incident report
distinguishing the confirmed root cause from initial assumptions, which is itself the
practice this exercise was designed to build.

## Building your own

Pick three real things you actually did while working through this project's
[student labs](../09-student-labs/README.md) — a lab you completed, a controlled failure you
diagnosed, a decision you made and can justify — and write them up in this format *before*
an interview, not during one. For a fuller, more structured version covering 12 technical
areas with follow-up questions and both a 60-second and 2-3 minute delivery, see
[15-star-interview-portfolio](../15-star-interview-portfolio/README.md) and its
[editable template](../15-star-interview-portfolio/13-editable-template.md).
