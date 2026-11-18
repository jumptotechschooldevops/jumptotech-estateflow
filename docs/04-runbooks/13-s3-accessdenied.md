# 13 · S3 AccessDenied

**Related guide:** [11 · S3 image storage](../02-deployment-guides/11-s3-image-storage.md)

## Symptoms
Image upload returns `500`; backend logs show an S3 SDK error like `AccessDenied` or
`Forbidden` for `PutObject`/`GetObject`/`DeleteObject`.

## Potential customer impact
Image upload/view fails; property CRUD unaffected.

## Detection and alerts
Backend logs; [08 · Checking S3 access](../03-daily-operations/08-checking-s3-access.md).

## Severity assessment
SEV3 (one feature degraded), unless this is blocking a launch (SEV2).

## Diagnosis (🔍 read-only)
```bash
kubectl logs deploy/backend -n estateflow-staging | grep -i -B2 -A5 accessdenied
aws iam get-policy-version --policy-arn <policy-arn> --version-id v1    # check the actual granted actions/resources
kubectl exec -n estateflow-staging deploy/backend -- env | grep S3_BUCKET_NAME
aws s3api get-bucket-policy --bucket <bucket-name>
```

## How to interpret the output
Confirm first that [12 · IAM AccessDenied](12-iam-accessdenied.md) isn't the real root cause
(i.e. the role assumption itself is fine, but the *policy attached to that role* doesn't cover
this specific action/object). Check the exact object key in the error against
`infra/iam/backend-s3-policy.json`'s `properties/*` prefix condition — a key that doesn't
start with `properties/` would correctly be denied.

## Possible causes
- `S3_BUCKET_NAME` env var pointing at the wrong bucket
- IAM policy's prefix condition doesn't match the actual key format being used
- Bucket policy (`infra/s3/bucket-policy.json`) denying for an unrelated reason (e.g.
  `aws:SecureTransport` — confirm requests are HTTPS, which the AWS SDK always uses by
  default)
- Policy was edited and the new version wasn't actually propagated/attached correctly

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
# Only after confirming the ACTUAL required permission via the error message and the policy
# intent — never broaden a policy blindly to "make the error go away":
aws iam create-policy-version --policy-arn <policy-arn> \
  --policy-document file://infra/iam/backend-s3-policy.json --set-as-default
```

## Escalation criteria
If you're not confident exactly which permission is missing without guessing, escalate rather
than widening the policy beyond what's actually needed — a too-broad fix here is a security
regression, not just a bug fix.

## Recovery verification
Re-run the real upload test from
[08 · Checking S3 access](../03-daily-operations/08-checking-s3-access.md).

## Prevention recommendations
Keep the IAM policy and the backend's actual key-building logic
(`backend/src/s3Service.js`'s `buildObjectKey`) in sync — any change to the key format needs a
matching policy review.
