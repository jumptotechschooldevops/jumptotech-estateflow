# 12 · Production Troubleshooting Scenarios

**Prerequisites:** [04-runbooks](../04-runbooks/README.md)
**Next step:** [13 · Discussing the project professionally](13-discussing-the-project-professionally.md)

Practice answering these **out loud**, narrating your diagnostic thought process, not just
naming the final answer — that's what an interviewer is actually evaluating.

**Scenario 1: "Users report the site is down. `kubectl get pods` shows everything
`Running`."**
Think out loud: "Running" isn't the same as "healthy and reachable." I'd check target group
health next (`aws elbv2 describe-target-health`) — a pod can be `Running` but still fail its
*ALB* health check if the path/port is misconfigured, which looks exactly like this. See
[`04-runbooks/10-unhealthy-target-groups.md`](../04-runbooks/10-unhealthy-target-groups.md).

**Scenario 2: "A new PVC is stuck `Pending` and has been for 10 minutes."**
Think out loud: first check if a StorageClass actually exists and matches what the manifest
requests — most common cause. If it exists, check the EBS CSI driver's own health; it's
cluster infrastructure, so if it's broken, that's likely affecting other teams too, not just
this one PVC. See [`04-runbooks/05-pvc-pending.md`](../04-runbooks/05-pvc-pending.md).

**Scenario 3: "A pod's PVC shows `Bound`, but the pod itself is stuck `Pending`."**
Think out loud: this specific combination — bound PVC, pending pod — points at something more
specific than a missing StorageClass: an AZ mismatch between the volume and available nodes.
I'd check `kubectl describe pod` for "volume node affinity conflict" specifically. See
[`04-runbooks/06-ebs-az-mismatch.md`](../04-runbooks/06-ebs-az-mismatch.md).

**Scenario 4: "Image uploads started failing with 500 errors sometime this morning, nothing
else changed."**
Think out loud: "nothing else changed" is a claim to verify, not trust — check recent IAM
policy or OIDC provider changes first (these commonly break silently without anyone touching
the app code), then check the exact error in backend logs to distinguish a role-assumption
failure from a permissions-on-the-role failure. See
[`04-runbooks/12-iam-accessdenied.md`](../04-runbooks/12-iam-accessdenied.md) and
[`13-s3-accessdenied.md`](../04-runbooks/13-s3-accessdenied.md).

**Scenario 5: "CI is green, the deploy workflow shows success, but the running pods still
have the old image."**
Think out loud: a "successful" `kubectl set image` only confirms the command was accepted,
not that the rollout completed — check `kubectl rollout status`/`history` directly against
the cluster rather than trusting the pipeline's own success/failure report alone. See
[`04-runbooks/15-failed-github-actions-deployments.md`](../04-runbooks/15-failed-github-actions-deployments.md).

**Scenario 6 (open-ended, no single runbook): "You deploy a change, and 20 minutes later
response times have slowly climbed 3x. Nothing crashed, no errors in logs."**
Think out loud: no crashes/errors but slow and climbing suggests resource exhaustion rather
than a hard failure — check `kubectl top pods` for memory climbing steadily (leak pattern) vs.
CPU pinned (genuine load/inefficiency), and check the HPA's current state. If it correlates
exactly with the recent deploy, that's strong evidence it's code-related, not coincidental
load — I'd consider a rollback while investigating in parallel rather than only investigating
first. See [`04-runbooks/14-high-cpu-and-memory.md`](../04-runbooks/14-high-cpu-and-memory.md).
