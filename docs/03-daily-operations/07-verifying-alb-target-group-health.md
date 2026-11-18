# 07 · Verifying ALB Target Group Health

**Prerequisites:** AWS CLI access, Ingress already deployed ([02-deployment-guides/09](../02-deployment-guides/09-ingress-alb-and-target-groups.md))
**Next step:** [08 · Checking S3 access](08-checking-s3-access.md)

## Objective

The ALB is the public front door — confirm AWS considers every target healthy, since a pod can
look fine to `kubectl` while still failing the ALB's own health check (wrong path/port).

## Commands

```bash
aws elbv2 describe-target-groups --region us-east-1 \
  --query "TargetGroups[?contains(TargetGroupName,'estateflow')].[TargetGroupName,TargetGroupArn]" --output table

aws elbv2 describe-target-health --region us-east-1 --target-group-arn <arn-from-above>
```

## Expected results

Every entry under `TargetHealthDescriptions` shows `"State": "healthy"`. Two target groups
exist (one per Ingress — see
[09 · Ingress, ALB, and target groups](../02-deployment-guides/09-ingress-alb-and-target-groups.md)
for why there are two).

## If something looks wrong

| Symptom | Go to |
|---|---|
| `"State": "unhealthy"` | [10 · Unhealthy Target Groups](../04-runbooks/10-unhealthy-target-groups.md) |
| No target groups found at all | [11 · AWS Load Balancer Controller failures](../04-runbooks/11-aws-load-balancer-controller-failures.md) |
| Targets healthy but users report `502`/`503`/`504` | [09 · ALB 502, 503, and 504](../04-runbooks/09-alb-502-503-504.md) |

## Checklist

- [ ] Both target groups located
- [ ] All targets report `healthy`
- [ ] If any target is unhealthy, matched to the correct runbook rather than guessed at
