# 04 · Training Incident Scenarios

**Prerequisites:** [03 · Incident templates](03-incident-templates.md), [04-runbooks](../04-runbooks/README.md)
**Next step:** [14-incident-simulations](../14-incident-simulations/README.md) for 10 more
incidents with instructor-only fault injection and answer keys, then
[06-engineering-records](../06-engineering-records/README.md)

> **These are training exercises for a course lab, not real customer-facing production
> incidents.** EstateFlow has never served real production traffic. Do not describe these as
> real incidents in an interview or resume — see
> [10-interview-preparation/14-star-format-answers.md](../10-interview-preparation/14-star-format-answers.md)
> for how to talk about lab work honestly and still effectively.

Each scenario below is grounded in a failure mode this project's own infrastructure can
actually produce (verified against `infra/k8s/`, not invented). Run it in a lab/sandbox AWS
account, using the matching runbook, then fill out an
[incident report](03-incident-templates.md#incident-report-template).

## Scenario 1 — EBS availability zone mismatch

**Setup (instructor or self-administered in a lab account):** scale the node group so only
nodes in a single AZ remain, after the Postgres PVC was already provisioned in a *different*
AZ (or: cordon/drain all nodes in the PVC's current AZ).

**What the student observes:** `kubectl get pvc` shows `Bound`, but `postgres-0` stays
`Pending` indefinitely. `/api/health` reports `"db":"down"`.

**Matching runbook:** [06 · EBS AZ mismatch](../04-runbooks/06-ebs-az-mismatch.md)

**Practice task:** classify severity, run the runbook's diagnostic commands, explain in your
own words (out loud, or in the incident report) *why* this happens — don't just execute
commands without understanding the AZ constraint.

## Scenario 2 — Image deployment failure (bad tag)

**Setup:** `kubectl set image deployment/backend backend=<registry>/estateflow-backend:does-not-exist -n estateflow-staging`

**What the student observes:** new pods stuck `ImagePullBackOff`; depending on
`maxUnavailable`, some old pods may still be serving — note whether this is a full or partial
outage and classify severity accordingly.

**Matching runbook:** [01 · ImagePullBackOff](../04-runbooks/01-imagepullbackoff.md)

**Practice task:** diagnose using only the runbook's 🔍 commands first; identify the correct
existing tag before running any ⚠️ mitigation command; perform a full
[rollback](../02-deployment-guides/15-rollback-and-recovery.md) using `kubectl rollout undo`
*and* verify with [deployment verification](../02-deployment-guides/13-deployment-verification.md).

## Scenario 3 — Connectivity problem (wrong Service name)

**Setup:** edit a copy of `infra/k8s/01-configmap.yaml` so `PGHOST` points at a nonexistent
Service name (e.g. `postgres-typo`), apply it, restart the backend.

**What the student observes:** backend pods `CrashLoopBackOff` or stay unready;
`/api/health` reports `"db":"down"` with a DNS-resolution-flavored error in the logs.

**Matching runbooks:** [16 · DNS failures](../04-runbooks/16-dns-failures.md) and
[07 · PostgreSQL connection failures](../04-runbooks/07-postgresql-connection-failures.md)

**Practice task:** correctly distinguish "DNS doesn't resolve" from "DNS resolves but the
connection is refused" using the diagnostic commands in both runbooks — they look similar at
first glance but have different root causes and fixes.

## Running these safely

- Always in a disposable lab/sandbox AWS account or namespace, never against anything with
  real users or data.
- Always revert the deliberate change afterward and confirm full recovery via
  [deployment verification](../02-deployment-guides/13-deployment-verification.md) before
  ending the exercise.
- Write up each one using the [incident report template](03-incident-templates.md), labeling
  it clearly as a training exercise in the title (e.g. "[TRAINING] Scenario 1 — EBS AZ
  mismatch").
