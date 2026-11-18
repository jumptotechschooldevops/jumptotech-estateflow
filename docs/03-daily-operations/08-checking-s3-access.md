# 08 · Checking S3 Access

**Prerequisites:** S3 bucket + IRSA role already set up ([02-deployment-guides/10](../02-deployment-guides/10-iam-oidc-and-irsa.md), [11](../02-deployment-guides/11-s3-image-storage.md))
**Next step:** [09 · Reviewing alerts](09-reviewing-alerts.md)

## Objective

Confirm the backend can still actually reach and use S3 — IAM role trust policies and bucket
policies are exactly the kind of thing that can be silently broken by an unrelated change
elsewhere (e.g. someone edits the OIDC provider, or the bucket policy).

## Commands

```bash
kubectl exec -n estateflow-staging deploy/backend -- env | grep -E 'AWS_ROLE_ARN|S3_BUCKET_NAME'

ALB_DNS=$(kubectl get ingress estateflow-frontend -n estateflow-staging -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl -s "http://$ALB_DNS/api/properties/1/images"

# A real end-to-end check (uses a 1x1 pixel test file so it's cheap and harmless):
curl -X POST "http://$ALB_DNS/api/properties/1/images" \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
  -F "image=@/path/to/small-test.jpg"
```

## Expected results

`AWS_ROLE_ARN` and `S3_BUCKET_NAME` both set to real (non-placeholder) values. The GET returns
`200` with a JSON array (possibly empty). The test upload returns `201` with a working
`url` field — open that URL in a browser to confirm the image actually loads.

## If something looks wrong

| Symptom | Go to |
|---|---|
| `AWS_ROLE_ARN` missing from the pod's env | [12 · IAM AccessDenied](../04-runbooks/12-iam-accessdenied.md) |
| Upload returns `500`, logs show `AccessDenied`/`Forbidden` | [13 · S3 AccessDenied](../04-runbooks/13-s3-accessdenied.md) |
| Presigned URL returns `403` when opened | Check the URL hasn't simply expired (5 min TTL) — re-fetch the property's images first |

## Checklist

- [ ] Backend pod has the expected IRSA env vars
- [ ] A real test upload succeeds and the returned URL actually displays the image
- [ ] Remember to delete the test image/property afterward if this wasn't already a disposable one
