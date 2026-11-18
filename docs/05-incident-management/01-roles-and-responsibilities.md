# 01 · Roles and Responsibilities

**Prerequisites:** [05-incident-management/README.md](README.md) (severity definitions)
**Next step:** [02 · Communication and escalation](02-communication-and-escalation.md)

A real incident needs clear roles so people aren't duplicating work or waiting on each other
silently. Not every role is staffed on every incident — a SEV4 might just be one engineer; a
SEV1 needs most of these filled.

## Incident Commander (IC)

- Owns the incident's overall coordination — **not** necessarily the person fixing it
- Declares severity (and re-declares if it changes) and the incident's start/end
- Decides who's needed and pulls them in
- Owns communication cadence — ensures [stakeholder updates](02-communication-and-escalation.md)
  actually go out on schedule, even if someone else drafts them
- Keeps the [incident timeline](03-incident-templates.md) accurate (or assigns someone to)
- Calls the "all clear" once recovery is verified, and that a postmortem is scheduled for SEV1/SEV2

## Primary On-Call Engineer

- First responder — acknowledges the alert, does initial triage using
  [04-runbooks](../04-runbooks/README.md)
- Declares severity if no IC has yet, then requests one for SEV1/SEV2
- Executes diagnostic (🔍) and, once confident, mitigation (⚠️) steps from the matching runbook
- Hands off cleanly if the incident outlives their shift ([11-handover](../11-handover/README.md))

## Backend Engineer

- Investigates application-level causes (a specific endpoint failing, a bad deploy, a code bug)
- Owns any code-level fix/rollback decision for the backend or frontend

## DBA (Database role — may be the same person as the Backend Engineer on a small team)

- Investigates Postgres-specific issues ([07 · PostgreSQL connection failures](../04-runbooks/07-postgresql-connection-failures.md), [05 · PVC Pending](../04-runbooks/05-pvc-pending.md), [06 · EBS AZ mismatch](../04-runbooks/06-ebs-az-mismatch.md))
- The **only** role that should authorize a destructive database action (e.g. recreating a PVC)
  — always with a second person's sign-off

## Cloud Platform Engineer

- Investigates cluster/AWS-infrastructure-level issues (nodes, the Load Balancer Controller,
  IAM/IRSA, EBS)
- Owns decisions that affect shared cluster infrastructure, not just EstateFlow

## Security Engineer

- Engaged whenever there's any possibility of unauthorized access, a credential leak, or data
  exposure — even if it later turns out to be a false alarm
- Owns the decision to rotate credentials/tokens and to assess actual exposure

## A note on small teams

If your team doesn't have 6 distinct people, roles collapse — one engineer might be IC,
Backend Engineer, and DBA at once for a SEV3. What matters is that **every responsibility
above is explicitly owned by someone**, even if that's the same person wearing multiple hats —
not that six people are always present.
