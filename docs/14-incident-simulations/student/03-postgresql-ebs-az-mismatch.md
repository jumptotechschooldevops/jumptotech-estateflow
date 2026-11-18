# Incident 03 (Student) · PostgreSQL EBS Availability Zone Mismatch

**Related runbook:** [04-runbooks/06](../../04-runbooks/06-ebs-az-mismatch.md)

## Scenario

> *Labeled training exercise, lab environment only.*

The database appears to be completely down. The Postgres pod never comes up after an
otherwise unrelated node group change.

## Detection and alerts

`/api/health` reports `db: down`; [03-daily-operations/06](../../03-daily-operations/06-checking-database-availability.md).

## Investigation checklist

- [ ] Confirm the PVC's status — is it `Bound` or `Pending`? (This distinguishes this
      scenario from a plain [PVC Pending](../../04-runbooks/05-pvc-pending.md) case.)
- [ ] If `Bound` but the pod is still `Pending`, read the pod's Events carefully for the
      exact wording of the scheduling failure
- [ ] Check which Availability Zone the bound volume is in, and which AZs have schedulable
      nodes right now
- [ ] Classify severity

## Relevant commands

```bash
kubectl get pvc -n estateflow-staging
kubectl describe pod postgres-0 -n estateflow-staging | grep -A10 Events
kubectl get pv -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.spec.nodeAffinity}{"\n"}{end}'
kubectl get nodes -o custom-columns=NAME:.metadata.name,ZONE:.metadata.labels."topology\.kubernetes\.io/zone"
```

## What to submit

- Investigation checklist with findings, specifically distinguishing this from a plain PVC
  Pending case
- Severity classification with justification (this blocks the database entirely — what does
  that make it?)
- Completed [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
  — note explicitly in your root-cause section whether you'd need a second person's sign-off
  before taking any corrective action, and why
