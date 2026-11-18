# 04 · Database and S3 Integration Tests

**Prerequisites:** [02-deployment-guides/06, 11](../02-deployment-guides/06-postgresql-pvc-and-ebs.md), a running deployment
**Next step:** [05 · Kubernetes and AWS troubleshooting assessment](05-kubernetes-and-aws-troubleshooting-assessment.md)

## Objective

Prove the data layer (Postgres + S3) is correctly wired, not just "the app looks like it
works."

## Prerequisites

- A working EstateFlow deployment with a real S3 bucket and IRSA role configured

## Tasks

1. **Schema check.** Connect directly to Postgres and confirm both `properties` and
   `property_images` exist with the expected columns, and that `property_images.property_id`
   has a foreign key with `ON DELETE CASCADE`.
2. **Cascade delete test.** Create a property, upload two images to it, confirm both rows
   exist in `property_images` and both objects exist in S3. Delete the property via the API.
   Confirm: the `property_images` rows are gone (cascade), **and** both S3 objects are
   actually gone too (the backend's explicit cleanup, not just the DB cascade).
3. **Object key uniqueness test.** Upload the same file twice to the same property. Confirm
   two distinct object keys exist in S3 (not a collision/overwrite).
4. **Encryption-at-rest check.** Confirm via `aws s3api get-bucket-encryption` that default
   encryption is enabled, and via `aws s3api head-object` that an actual uploaded object
   shows a `ServerSideEncryption` value.
5. **Public access check.** Confirm via `aws s3api get-public-access-block` that all four
   block-public-access settings are `true`, and attempt (and confirm it fails) an anonymous,
   unauthenticated `GET` directly on the S3 object URL (not the presigned URL).

## Expected outcomes

Every check passes, with real command output as evidence — especially task 5, which must
show a genuine denied access attempt, not just a configuration setting.

## Verification commands

```bash
kubectl exec -it postgres-0 -n estateflow-staging -- psql -U estateflow -d estateflow -c '\d property_images'
aws s3 ls s3://<bucket>/properties/<id>/
aws s3api get-bucket-encryption --bucket <bucket>
aws s3api head-object --bucket <bucket> --key <object-key>
aws s3api get-public-access-block --bucket <bucket>
curl -I "https://<bucket>.s3.amazonaws.com/properties/<id>/<key>"   # expect 403, NOT a direct, unauthenticated 200
```

## Required screenshots

1. `\d property_images` showing the foreign key + `ON DELETE CASCADE`
2. Before/after `aws s3 ls` for the cascade-delete test
3. Two distinct object keys from the uniqueness test
4. `get-bucket-encryption` and `head-object` output
5. The `403` response from the direct, unauthenticated S3 URL attempt

## Completion criteria

- [ ] All 5 tasks completed with real evidence
- [ ] Task 5's denied-access screenshot is a genuine failed request, not a configuration
      screenshot standing in for it
- [ ] Submitted using the [student submission template](07-student-submission-template.md)

Graded against [06 · Grading rubric](06-grading-rubric.md).
