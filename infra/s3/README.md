# S3 bucket for property images

Creates one private bucket for property image uploads, used by the backend via IRSA (see
`infra/iam/README.md`). Nothing here has been run against your AWS account — these are the
exact commands to run yourself.

```bash
BUCKET_NAME=estateflow-staging-property-images   # must be globally unique; adjust as needed
REGION=us-east-1

# 1. Create the bucket (private by default — no ACL flags that would make it public)
aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"

# 2. Block all forms of public access — belt-and-suspenders on top of "private by default"
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration file://infra/s3/public-access-block.json

# 3. Default encryption (SSE-S3). Swap AES256 for aws:kms + a KMS key ARN if your org
#    requires customer-managed keys.
aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'

# 4. Deny any non-HTTPS request (edit infra/s3/bucket-policy.json to substitute
#    <BUCKET_NAME> first, or pipe it through `sed`)
sed "s/<BUCKET_NAME>/$BUCKET_NAME/g" infra/s3/bucket-policy.json > /tmp/estateflow-bucket-policy.json
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/estateflow-bucket-policy.json

# 5. (Optional) CORS — only needed if the frontend ever loads images via fetch()/canvas
#    instead of a plain <img src>. Fill in your ALB DNS name / domain in cors.json first.
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file://infra/s3/cors.json

# 6. Verify
aws s3api get-public-access-block --bucket "$BUCKET_NAME"
aws s3api get-bucket-encryption --bucket "$BUCKET_NAME"
aws s3api get-bucket-policy --bucket "$BUCKET_NAME"
```

Then set `S3_BUCKET_NAME` to the same value in `infra/k8s/01-configmap.yaml` and
`<BUCKET_NAME>` in `infra/iam/backend-s3-policy.json`.

## Cleanup

```bash
# Empties and deletes the bucket — irreversible, only do this when you're done with the lab.
aws s3 rm "s3://$BUCKET_NAME" --recursive
aws s3api delete-bucket --bucket "$BUCKET_NAME" --region "$REGION"
```
