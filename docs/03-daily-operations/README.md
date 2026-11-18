# 03 · Daily Operations

**Prerequisites:** [02-deployment-guides](../02-deployment-guides/README.md) (you should be able to deploy before you're asked to operate)
**Next step:** [04-runbooks](../04-runbooks/README.md) — for when a check here finds something wrong

Twelve routine checks a DevOps/SRE engineer runs regularly — a full morning sweep, or
individually whenever something feels off. **Each one is independently executable** — you
don't need to read the others first to run any single one.

| # | Task | Run it... |
|---|---|---|
| 01 | [Morning production health check](01-morning-production-health-check.md) | Start of every shift |
| 02 | [Checking Kubernetes workloads](02-checking-kubernetes-workloads.md) | Daily, or after any deploy |
| 03 | [Reviewing failed deployments](03-reviewing-failed-deployments.md) | After any CI/CD run, or if `02` finds a problem |
| 04 | [Investigating application logs](04-investigating-application-logs.md) | When something looks wrong, or routinely |
| 05 | [Monitoring CPU and memory](05-monitoring-cpu-and-memory.md) | Daily, or when performance is reported slow |
| 06 | [Checking database availability](06-checking-database-availability.md) | Daily, or when `/api/health` reports `db: down` |
| 07 | [Verifying ALB target group health](07-verifying-alb-target-group-health.md) | Daily, or when users report the site is unreachable |
| 08 | [Checking S3 access](08-checking-s3-access.md) | Daily, or when image uploads are reported broken |
| 09 | [Reviewing alerts](09-reviewing-alerts.md) | Start of every shift |
| 10 | [Checking CI/CD pipeline failures](10-checking-cicd-pipeline-failures.md) | Daily |
| 11 | [Reviewing infrastructure changes](11-reviewing-infrastructure-changes.md) | Start of every shift, and before making your own changes |
| 12 | [Shift handover](12-shift-handover.md) | End of every shift |

## Progress checklist

- [ ] 01 Morning production health check
- [ ] 02 Checking Kubernetes workloads
- [ ] 03 Reviewing failed deployments
- [ ] 04 Investigating application logs
- [ ] 05 Monitoring CPU and memory
- [ ] 06 Checking database availability
- [ ] 07 Verifying ALB target group health
- [ ] 08 Checking S3 access
- [ ] 09 Reviewing alerts
- [ ] 10 Checking CI/CD pipeline failures
- [ ] 11 Reviewing infrastructure changes
- [ ] 12 Shift handover

If any check here turns up a specific known failure mode, go to
[`04-runbooks/README.md`](../04-runbooks/README.md) and match the symptom rather than
improvising a fix.
