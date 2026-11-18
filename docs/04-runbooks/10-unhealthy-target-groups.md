# 10 · Unhealthy Target Groups

**Related guide:** [09 · Ingress, ALB, and target groups](../02-deployment-guides/09-ingress-alb-and-target-groups.md)

## Symptoms
`aws elbv2 describe-target-health` shows one or more targets as `unhealthy`, even though
`kubectl get pods` shows them `Running`.

## Potential customer impact
Reduced capacity (fewer targets serving) up to full outage (all targets unhealthy →
[09 · ALB 502/503/504](09-alb-502-503-504.md)).

## Detection and alerts
`aws elbv2 describe-target-health`; AWS console target group view.

## Severity assessment
All targets in a target group unhealthy: SEV1/SEV2. Some targets: SEV3.

## Diagnosis (🔍 read-only)
```bash
aws elbv2 describe-target-health --region us-east-1 --target-group-arn <arn>
kubectl get pods -n estateflow-staging -o wide
kubectl exec -it <pod-name> -n estateflow-staging -- wget -qO- http://localhost:5000/api/health
# (swap port/path for whichever target group — 80 / "/" for frontend, 5000 / "/api/health" for backend)
```

## How to interpret the output
The `describe-target-health` response includes a `Reason` and `Description` field —
`Target.FailedHealthChecks` with a description naming a timeout or non-200 response tells you
exactly what the ALB saw. If the pod answers fine when curled directly (as above) but the ALB
still marks it unhealthy, the mismatch is almost always the **health-check path/port
configured on the Ingress annotation**, not the application.

## Possible causes
- Health-check path/port annotation on the Ingress doesn't match what the app actually serves
  (see [09 · Ingress, ALB, and target groups](../02-deployment-guides/09-ingress-alb-and-target-groups.md)
  for why there are two separate Ingress objects with different health-check paths)
- `target-type: ip` requires the security group to allow the ALB to reach pod IPs directly on
  the health-check port — a security group change elsewhere can silently break this
- The pod is genuinely unhealthy (see [02 · CrashLoopBackOff](02-crashloopbackoff.md))

## Safe mitigation steps (⚠️ changes infrastructure)
If it's a health-check configuration mismatch, fix it via a reviewed change to
`infra/k8s/07-ingress.yaml`'s annotations, then:
```bash
kubectl apply -f infra/k8s/07-ingress.yaml
```

## Escalation criteria
If curling the pod directly also fails, this isn't a target-group problem — go to
[02 · CrashLoopBackOff](02-crashloopbackoff.md) or
[09 · ALB 502, 503, and 504](09-alb-502-503-504.md) instead.

## Recovery verification
```bash
aws elbv2 describe-target-health --region us-east-1 --target-group-arn <arn>
# all targets "healthy"
```

## Prevention recommendations
Whenever you change a Service's port or the app's health endpoint, update the matching
Ingress health-check annotation in the same PR — never let them drift apart.
