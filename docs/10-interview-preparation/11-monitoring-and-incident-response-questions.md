# 11 · Monitoring and Incident Response Questions

**Prerequisites:** [10 · Database questions](10-database-questions.md)
**Next step:** [12 · Production troubleshooting scenarios](12-production-troubleshooting-scenarios.md)

**Q: What's the difference between an SLI, an SLO, and an error budget?**
A: An SLI is a number you actually measure (e.g. percentage of successful health checks). An
SLO is the target for that number (e.g. 99.5% over 30 days). The error budget is the
allowance implied by the gap between 100% and the SLO — spending it early signals you should
slow down on risky changes until it resets. See
[08-monitoring-and-observability/03](../08-monitoring-and-observability/03-sli-slo-error-budgets.md)
for a worked example on this project.

**Q: What monitoring actually exists for this project today, versus what's proposed?**
A: Today: `/api/health`, the `X-Cache` header, Kubernetes probes, `kubectl top`/HPA (if
metrics-server is installed), and native AWS target-group health. No Prometheus, Grafana, or
CloudWatch alarms exist yet — see
[08-monitoring-and-observability/README.md](../08-monitoring-and-observability/README.md) for
the full honest breakdown. Being explicit about this distinction, rather than implying more
exists, is itself a point worth making in an interview — it shows you don't overstate what's
built.

**Q: Walk me through how you'd triage an incident from the moment an alert fires.**
A: Acknowledge within the severity's response-time target, do initial triage against the
matching [runbook](../04-runbooks/README.md) using its read-only diagnostic commands first,
classify severity honestly (worst applicable, not average), escalate per the criteria in that
specific runbook or after ~15 minutes with no clear lead, keep the incident channel updated
even when there's no new information ("still investigating" is a valid update), and once
resolved, verify recovery explicitly before declaring it over.

**Q: What makes a postmortem "blameless," and why does it matter?**
A: It focuses on system/process conditions that allowed a failure, never on an individual's
competence — "the deploy process allowed an untested config change through" instead of "X
forgot to test." This matters because blame makes people hide information defensively in
future incidents, while a systems focus produces corrective actions that actually prevent
recurrence.

**Q: How do you decide when to escalate instead of continuing to investigate solo?**
A: When a runbook's own escalation criteria say to, when ~15 minutes have passed on a
SEV1/SEV2 with no clear cause, when the fix requires touching infrastructure shared beyond
your own ownership, or any time you're not fully confident your next action is safe — see
[05-incident-management/02](../05-incident-management/02-communication-and-escalation.md).
