# 12 · IAM AccessDenied

**Related guide:** [10 · IAM, OIDC, and IRSA](../02-deployment-guides/10-iam-oidc-and-irsa.md)

## Symptoms
Backend logs show `AccessDenied: Not authorized to perform sts:AssumeRoleWithWebIdentity`, or
`kubectl exec ... env | grep AWS_ROLE_ARN` shows nothing at all inside the backend pod.

## Potential customer impact
Image upload/read features fail; everything else (property CRUD) keeps working since it
doesn't depend on AWS credentials.

## Detection and alerts
Backend logs; [08 · Checking S3 access](../03-daily-operations/08-checking-s3-access.md).

## Severity assessment
SEV3 (one feature degraded) unless the same IRSA mechanism is also used by something more
critical in the future.

## Diagnosis (🔍 read-only)
```bash
kubectl describe pod <backend-pod> -n estateflow-staging | grep -A5 "eks.amazonaws.com"
kubectl get serviceaccount estateflow-backend -n estateflow-staging -o yaml
aws iam get-role --role-name estateflow-backend-s3 --query "Role.AssumeRolePolicyDocument"
aws iam list-open-id-connect-providers
```

## How to interpret the output
No `eks.amazonaws.com/role-arn` annotation on the ServiceAccount → the pod never got IRSA
credentials injected at all (fix: annotate, then restart the Deployment — the webhook only
acts at pod creation). Annotation present, but `AssumeRoleWithWebIdentity` still denied → the
trust policy's `sub` condition doesn't exactly match
`system:serviceaccount:estateflow-staging:estateflow-backend` (check for a typo, a namespace
mismatch, or a leftover test value).

## Possible causes
- ServiceAccount annotation missing or incorrect
- Trust policy `sub`/`aud` condition doesn't match exactly
- OIDC provider was deleted/recreated (changes its ARN, invalidating old trust policies)

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
kubectl annotate serviceaccount estateflow-backend -n estateflow-staging \
  eks.amazonaws.com/role-arn=arn:aws:iam::<account>:role/estateflow-backend-s3 --overwrite
kubectl rollout restart deployment/backend -n estateflow-staging
```

## Escalation criteria
If the OIDC provider itself was deleted/recreated, escalate — this likely affects every IRSA
role on the cluster, not just the backend's.

## Recovery verification
```bash
kubectl exec -n estateflow-staging deploy/backend -- env | grep AWS_ROLE_ARN
```
Then re-run [08 · Checking S3 access](../03-daily-operations/08-checking-s3-access.md).

## Prevention recommendations
Never delete/recreate the cluster's OIDC provider without checking every role's trust policy
first — it changes the provider's ARN, breaking every existing trust relationship.
