# 05 · Incident Management

**Prerequisites:** [04-runbooks](../04-runbooks/README.md)
**Next step:** [06-engineering-records](../06-engineering-records/README.md), or
[14-incident-simulations](../14-incident-simulations/README.md) for 10 full gradable practice
incidents built on top of this framework

> **This is a training system for a course lab, not this project's real production incident
> process** (EstateFlow has never served real customer traffic). It's modeled on how a real
> company runs incidents so the practice transfers directly. See
> [04 · Training incident scenarios](04-training-incident-scenarios.md) for labeled practice
> exercises — never describe those as real production incidents.

## Severity definitions

| Severity | Definition | Example in this project | Response expectation |
|---|---|---|---|
| **SEV1** | Full outage, or a security/data-loss event. All or nearly all users affected. | ALB has zero healthy targets; Postgres data loss | Immediate, all-hands, continuous updates |
| **SEV2** | Major feature broken or significant degradation, workaround may exist. | Image uploads totally broken; one of two backend replicas down | Urgent, dedicated responder, regular updates |
| **SEV3** | Minor feature impact, limited user impact, or a cost/efficiency risk. | Cache (Redis) down — app still works, just slower | Same-day investigation, no all-hands needed |
| **SEV4** | No current user impact; a risk, a near-miss, or pipeline-only failure. | A failed CI run on a branch that never deployed | Normal work-queue priority |

Use the **worst applicable** severity, not the average — e.g. a problem that's "mostly minor
but has a small chance of data loss" is SEV1 or SEV2, not SEV3.

## Roles and responsibilities

See [01 · Roles and responsibilities](01-roles-and-responsibilities.md) for full detail on:
Incident Commander, Primary On-Call Engineer, Backend Engineer, DBA, Cloud Platform Engineer,
Security Engineer.

## In this folder

| File | Covers |
|---|---|
| [01 · Roles and responsibilities](01-roles-and-responsibilities.md) | Who does what during an incident |
| [02 · Communication and escalation](02-communication-and-escalation.md) | Escalation matrix, stakeholder updates |
| [03 · Incident templates](03-incident-templates.md) | Timeline, incident report, blameless postmortem, corrective action tracking |
| [04 · Training incident scenarios](04-training-incident-scenarios.md) | Labeled practice exercises grounded in this lab's actual failure modes |

## Progress checklist

- [ ] Can state all four severity levels and classify an example correctly
- [ ] Read all incident-management role descriptions
- [ ] Practiced filling out the incident report template on a training scenario
- [ ] Practiced a shift handover for an open incident ([11-handover](../11-handover/README.md))
