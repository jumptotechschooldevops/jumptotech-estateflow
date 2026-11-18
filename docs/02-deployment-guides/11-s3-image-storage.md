# 11 · S3 Image Storage

**Prerequisites:** [10 · IAM, OIDC, and IRSA](10-iam-oidc-and-irsa.md)
**Next step:** [12 · GitHub Actions CI/CD](12-github-actions-cicd.md)

## Why

Property photos need to be stored somewhere durable, private, and cheap at scale. S3 fits all
three; Postgres only stores a pointer (the object key) — see
[01-architecture](../01-architecture/README.md) for the full reasoning.

## Prerequisites

- IAM role for the backend created ([10](10-iam-oidc-and-irsa.md))

## Commands

```bash
BUCKET_NAME=estateflow-staging-property-images   # must be globally unique
REGION=us-east-1

aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"                        # 1

aws s3api put-public-access-block \                                                        # 2
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration file://infra/s3/public-access-block.json

aws s3api put-bucket-encryption \                                                          # 3
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'

sed "s/<BUCKET_NAME>/$BUCKET_NAME/g" infra/s3/bucket-policy.json > /tmp/estateflow-bucket-policy.json  # 4
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/estateflow-bucket-policy.json

aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file://infra/s3/cors.json  # 5 (optional)
```

## Explanation of each command

1. Creates a **private-by-default** bucket (no public-read flags passed).
2. Blocks all four forms of public access — belt-and-suspenders on top of "private by default."
3. Enables default server-side encryption (SSE-S3); every object is encrypted at rest even if
   the uploader forgets to request it.
4. Denies any request over plain HTTP (`aws:SecureTransport: false`) — forces encryption in
   transit too.
5. CORS is only needed if the frontend ever loads images via `fetch()`/canvas instead of a
   plain `<img src>` tag (which doesn't need CORS) — included for completeness.

## The upload/read data flow

```
Browser → POST /api/properties/:id/images (multipart, Authorization: Bearer <token>)
  → backend validates mimetype + 5MB limit (multer) → PutObject (unique key:
    properties/<id>/<uuid>.<ext>) → INSERT object_key/content_type/size into property_images
    → generates a GetObject presigned URL (5 min TTL) → returns it to the browser
Browser → <img src="<presigned-url>"> → fetches bytes DIRECTLY from S3, not through the backend
```

Presigned URLs are **never cached** — they expire faster than it would be safe to cache them
alongside the Redis-cached property list. See
[01-architecture](../01-architecture/README.md) for why.

## Expected results

```json
{"BlockPublicAcls": true, "IgnorePublicAcls": true, "BlockPublicPolicy": true, "RestrictPublicBuckets": true}
```
A successful upload via the running app returns `201` with `{"id":...,"url":"https://...","contentType":"image/jpeg",...}`.

## Verify

```bash
aws s3api get-public-access-block --bucket "$BUCKET_NAME"
aws s3api get-bucket-encryption --bucket "$BUCKET_NAME"

curl -X POST "http://<ALB_DNS>/api/properties/1/images" \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
  -F "image=@/path/to/photo.jpg"
```

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `403 Forbidden` in backend logs on upload | IAM role missing `s3:PutObject` for that key, or key doesn't start with `properties/` | [13 · S3 AccessDenied](../04-runbooks/13-s3-accessdenied.md) |
| `400` with "Unsupported image type" | Wrong file mimetype (only JPEG/PNG/WebP allowed) | Expected behavior — not a bug |
| `<img>` broken after ~5 minutes | Presigned URL expired | Expected — reload the property list for a fresh URL |

## Troubleshooting

Backend logs (`kubectl logs deploy/backend -n estateflow-staging`) show the actual AWS SDK
error — always check these before assuming the bug is in the frontend.

## Rollback / cleanup

```bash
aws s3 rm "s3://$BUCKET_NAME" --recursive     # irreversible — empties the bucket
aws s3api delete-bucket --bucket "$BUCKET_NAME" --region "$REGION"
```

## Completion checklist

- [ ] Bucket created with all public access blocked and default encryption on
- [ ] Deny-insecure-transport policy applied
- [ ] A real image upload through the running app returns `201` with a working presigned URL
- [ ] You can explain why the bucket never needs to be public
