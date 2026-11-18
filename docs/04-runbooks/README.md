# 04 · Runbooks

**Prerequisites:** [03-daily-operations](../03-daily-operations/README.md) (runbooks assume you already know the basic health-check commands)
**Next step:** [05-incident-management](../05-incident-management/README.md) for anything SEV1/SEV2

A runbook is "this specific symptom → do this specific thing." Find your symptom below, open
that file, follow it top to bottom. Every runbook uses the same template: **Symptoms** →
**Customer impact** → **Detection** → **Severity** → **Diagnosis** (🔍 read-only) →
**Interpreting output** → **Possible causes** → **Mitigation** (⚠️ changes infrastructure) →
**Escalation** → **Recovery verification** → **Prevention**.

🔍 marks commands that only *read* state — safe to run anytime, even outside an incident.
⚠️ marks commands that *change* something — read the runbook's context before running these.

| # | Runbook | Symptom |
|---|---|---|
| 01 | [ImagePullBackOff](01-imagepullbackoff.md) | Pod can't pull its container image |
| 02 | [CrashLoopBackOff](02-crashloopbackoff.md) | Pod starts, then repeatedly crashes |
| 03 | [Pod Pending](03-pod-pending.md) | Pod never gets scheduled to a node |
| 04 | [Node NotReady](04-node-notready.md) | A worker node stops reporting healthy |
| 05 | [PVC Pending](05-pvc-pending.md) | Postgres's volume claim never binds |
| 06 | [EBS AZ mismatch](06-ebs-az-mismatch.md) | PVC bound, but the pod still won't schedule |
| 07 | [PostgreSQL connection failures](07-postgresql-connection-failures.md) | Backend can't reach the database |
| 08 | [Redis connection failures](08-redis-connection-failures.md) | Backend can't reach the cache |
| 09 | [ALB 502, 503, and 504](09-alb-502-503-504.md) | Users get a gateway error |
| 10 | [Unhealthy Target Groups](10-unhealthy-target-groups.md) | AWS reports targets unhealthy |
| 11 | [AWS Load Balancer Controller failures](11-aws-load-balancer-controller-failures.md) | Ingress never gets an address |
| 12 | [IAM AccessDenied](12-iam-accessdenied.md) | A pod's AWS API call is denied |
| 13 | [S3 AccessDenied](13-s3-accessdenied.md) | Image upload/read fails with a permissions error |
| 14 | [High CPU and memory](14-high-cpu-and-memory.md) | Pods maxed out, or OOMKilled |
| 15 | [Failed GitHub Actions deployments](15-failed-github-actions-deployments.md) | CI/CD pipeline fails |
| 16 | [DNS failures](16-dns-failures.md) | A pod can't resolve a hostname |
| 17 | [NetworkPolicy blocking traffic](17-networkpolicy-blocking-traffic.md) | Two pods that should talk to each other can't |

## How to use these during a real incident

1. Match the symptom, open the runbook.
2. Run the 🔍 diagnostic commands first, always — understand before you act.
3. If the runbook's mitigation doesn't fully resolve it within its stated escalation
   criteria, escalate — don't keep trying variations alone past that point.
4. After resolving, run the runbook's recovery verification steps, and write an
   [execution record](../06-engineering-records/README.md).
