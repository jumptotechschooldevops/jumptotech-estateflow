# 05 · S3 + IAM Lab

**Prerequisites:** [02-deployment-guides/10](../02-deployment-guides/10-iam-oidc-and-irsa.md), [11](../02-deployment-guides/11-s3-image-storage.md)
**Next step:** [06 · CI/CD lab](06-cicd-lab.md)

## Guided lab

Provision the bucket and IRSA role per guides 10/11, upload a real test image through the
running app, confirm the returned presigned URL actually displays the image in a browser.

## Independent practice assignment

Without re-reading the guide: delete that image via the API, confirm it's gone from both the
database (`property_images` row) and S3 (`aws s3 ls s3://<bucket>/properties/<id>/`).

## Controlled failure scenario

Temporarily detach the IAM policy from the backend's role:
```bash
aws iam detach-role-policy --role-name estateflow-backend-s3 --policy-arn <policy-arn>
```

## Troubleshooting exercise

Using only [`04-runbooks/12-iam-accessdenied.md`](../04-runbooks/12-iam-accessdenied.md) and
[`13-s3-accessdenied.md`](../04-runbooks/13-s3-accessdenied.md)'s diagnostic commands,
determine which of the two it actually is (role assumption vs. policy permissions) before
reading the answer. (It's #13 — the role is still assumable, it just has no permissions
attached anymore.) Then re-attach the policy and verify recovery.

## Expected outcome

Upload fails with `AccessDenied` while detached, succeeds again immediately after
re-attaching — no pod restart needed, since IAM permission checks happen per-API-call, not
at credential-issuance time.

## Verification checklist

- [ ] Full upload→display→delete round trip verified, including the S3 object actually gone
- [ ] Correctly diagnosed the detached-policy scenario as a permissions issue, not a trust-policy issue
- [ ] Confirmed recovery without needing to restart the backend pod

## Interview questions

1. **Why doesn't fixing the IAM policy require restarting the backend pod, while fixing a
   missing ServiceAccount annotation does?**
2. **What's the blast radius if the backend's IAM role were compromised, and why is it small
   by design?**
3. **Why is the object key built with `crypto.randomUUID()` instead of the original filename?**

## Sample answers

1. The ServiceAccount annotation controls whether the pod *receives IRSA credentials at all*
   — that's only evaluated at pod creation by the Pod Identity Webhook. The IAM policy
   attached to the role it assumes is checked by AWS on *every individual API call*, so a
   policy change takes effect immediately for all existing, already-running sessions.
2. It's scoped to `GetObject`/`PutObject`/`DeleteObject` under one prefix in one named bucket
   only — an attacker with this role could not list other buckets, read unrelated S3 data, or
   touch any other AWS service. This is least privilege in practice, not just a principle.
3. Using the original filename risks collisions (two uploads named `photo.jpg`), path
   traversal if not carefully sanitized, and leaks information about the uploader's local
   filesystem. A random UUID guarantees uniqueness and reveals nothing.
