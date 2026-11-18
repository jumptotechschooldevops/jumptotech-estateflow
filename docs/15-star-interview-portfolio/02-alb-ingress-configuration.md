# 02 · ALB and Ingress Configuration

**Prerequisites:** [02-deployment-guides/08-09](../02-deployment-guides/09-ingress-alb-and-target-groups.md)
**Next step:** [03 · PostgreSQL and EBS troubleshooting](03-postgresql-ebs-troubleshooting.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Describe a time you had to configure a load balancer or ingress with more than one
backend service."

## Situation
Two services (a frontend and a backend API) needed to share one public ALB, routed by path
(`/` vs `/api`), each with a different health-check requirement.

## Task
Configure Kubernetes Ingress so both services are reachable through one load balancer, each
health-checked correctly, without the AWS Load Balancer Controller merging them into
configuration that doesn't fit either one.

## Action
I initially tried one Ingress with two paths, but discovered the controller's health-check
annotations apply per-Ingress, not per-path — so both target groups would end up with the
same health-check settings, which doesn't work since the backend only answers 200 on
`/api/health` and the frontend only on `/`. I switched to the documented **IngressGroup**
pattern: two separate Ingress objects sharing `alb.ingress.kubernetes.io/group.name`, each
with its own health-check path, and `group.order` values to make sure the more specific
`/api` path is evaluated before the frontend's catch-all `/`.

## Result
One ALB, correctly routing both paths, both target groups reporting healthy independently —
verified via `aws elbv2 describe-target-health` showing `healthy` for both.

## Follow-up technical questions
- "What would have happened if you'd kept the single-Ingress approach?"
- "What does `target-type: ip` do, and why use it?"
- "How did you make sure `/api` isn't accidentally matched by the frontend's catch-all `/`?"

## Strong sample answers
- One target group would have the wrong health-check path for whichever service it didn't
  match, causing that target group to show unhealthy even though the pods were fine.
- It routes ALB traffic directly to pod IPs via the VPC CNI instead of through NodePort —
  more accurate health checks and required for Fargate.
- `group.order` sets listener-rule priority; a lower number is evaluated first, so the
  backend's `/api` rule (order 10) is checked before the frontend's `/` rule (order 20).

## Common mistakes
Not knowing *why* two Ingress objects were needed (just that they were); confusing
target-group health (AWS's view) with pod readiness (Kubernetes' view) as if they're
automatically the same thing.

## 60-second version
"I had two services sharing one ALB, each needing a different health-check path. A single
Ingress with two paths doesn't support per-path health checks — the controller's annotations
apply to the whole Ingress. I used the IngressGroup pattern instead: two Ingress objects
sharing a group name, each with its own health check, with priority ordering so the specific
API path is matched before the frontend's catch-all. Verified both target groups came back
healthy independently."

## 2-3 minute version
Add: the specific symptom that revealed the problem (one target group looking unhealthy
despite healthy pods), how you diagnosed it was a health-check-path mismatch and not an
application bug (curling the pod directly vs. checking AWS target health), and the exact
annotations used.
