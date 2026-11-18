# Incident 01 (Student) · ImagePullBackOff

**Related runbook:** [04-runbooks/01](../../04-runbooks/01-imagepullbackoff.md)

## Scenario

> *This is a labeled training exercise in a lab environment, not a real production incident.*

It's the start of your shift. Something changed in `estateflow-staging` overnight — possibly
nothing, possibly not. Start your normal
[morning health check](../../03-daily-operations/01-morning-production-health-check.md).

## Detection and alerts

You'd normally learn about this via the proposed alerting design in
[08-monitoring-and-observability/02](../../08-monitoring-and-observability/02-alerting.md).
For this exercise, you're finding it the way the manual-substitute daily check does: by
looking.

## Investigation checklist

- [ ] Check pod status across the namespace — what's different from "all Running"?
- [ ] For any pod not `Running`, read its full `describe` output, especially Events
- [ ] Determine: is this affecting all replicas of a Deployment, or just new ones from a
      rollout (old ones still serving)?
- [ ] Classify severity per [05-incident-management](../../05-incident-management/README.md)
- [ ] Identify specifically *why* the image can't be pulled — there's more than one possible
      cause

## Relevant commands

```bash
kubectl get pods -n estateflow-staging
kubectl describe pod <pod-name> -n estateflow-staging
kubectl get deployment backend -n estateflow-staging -o jsonpath='{.spec.template.spec.containers[0].image}'
aws ecr describe-images --repository-name estateflow-backend --region us-east-1 --query "imageDetails[].imageTags"
```

## What to submit

- Your completed investigation checklist with actual findings at each step
- A severity classification with justification
- An [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
  — root cause section filled in with your best-supported conclusion
- If time allows, the fix you'd apply and why (you may also actually apply it, if this is
  being run as a hands-on exercise rather than a diagnosis-only one — check with your
  instructor which mode this is)
