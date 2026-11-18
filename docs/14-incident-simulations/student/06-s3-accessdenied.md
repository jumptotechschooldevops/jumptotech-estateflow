# Incident 06 (Student) · S3 AccessDenied

**Related runbooks:** [04-runbooks/12](../../04-runbooks/12-iam-accessdenied.md), [13](../../04-runbooks/13-s3-accessdenied.md)

## Scenario

> *Labeled training exercise, lab environment only.*

Image uploads that worked yesterday are now failing with a server error. Nothing in the
application code changed.

## Detection and alerts

Upload returns `500`; [03-daily-operations/08](../../03-daily-operations/08-checking-s3-access.md).

## Investigation checklist

- [ ] Confirm the backend still has IRSA credentials at all (role assumption working)
- [ ] If role assumption works, determine whether the *policy* attached to that role still
      grants the needed permission
- [ ] Read the exact S3 error from backend logs — which action was denied, on which
      resource?
- [ ] Determine whether this is an IAM-role problem or an S3-bucket-policy problem

## Relevant commands

```bash
kubectl exec -n estateflow-staging deploy/backend -- env | grep AWS_ROLE_ARN
kubectl logs deploy/backend -n estateflow-staging | grep -i -B2 -A5 accessdenied
aws iam get-policy-version --policy-arn <policy-arn> --version-id v1
aws s3api get-bucket-policy --bucket <bucket-name>
```

## What to submit

- The exact denied action/resource from the error
- Your determination: IAM role/policy problem vs. bucket policy problem, with evidence
- Completed [incident report](../../05-incident-management/03-incident-templates.md#incident-report-template)
