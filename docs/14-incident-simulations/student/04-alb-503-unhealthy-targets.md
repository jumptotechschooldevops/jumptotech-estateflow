# Incident 04 (Student) · ALB 503 and Unhealthy Target Groups

**Related runbooks:** [04-runbooks/09](../../04-runbooks/09-alb-502-503-504.md), [10](../../04-runbooks/10-unhealthy-target-groups.md)

## Scenario

> *Labeled training exercise, lab environment only.*

Users report the site returns an error page instead of loading. `kubectl get pods` shows
everything `Running`.

## Detection and alerts

`curl -I http://<ALB_DNS>/` returns a non-200 status;
[03-daily-operations/07](../../03-daily-operations/07-verifying-alb-target-group-health.md).

## Investigation checklist

- [ ] Confirm the exact HTTP status code returned (502 vs 503 vs 504 point at different
      causes)
- [ ] Check target group health directly via AWS, not just pod status — they are not the
      same signal
- [ ] If targets are unhealthy, curl the pod directly (bypassing the ALB) to determine
      whether the *application* or the *health-check configuration* is the problem
- [ ] Classify severity

## Relevant commands

```bash
curl -I "http://<ALB_DNS>/"
aws elbv2 describe-target-health --region us-east-1 --target-group-arn <arn>
kubectl exec -it <pod-name> -n estateflow-staging -- wget -qO- http://localhost:5000/api/health
```

## What to submit

- The exact status code observed and target-health output
- Your determination: application problem vs. health-check configuration mismatch, with the
  specific evidence that led you there
- Completed [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
