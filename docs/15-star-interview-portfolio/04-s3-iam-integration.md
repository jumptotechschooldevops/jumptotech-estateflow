# 04 · S3 Integration and IAM Permissions

**Prerequisites:** [02-deployment-guides/10-11](../02-deployment-guides/11-s3-image-storage.md)
**Next step:** [05 · CI/CD automation](05-cicd-automation.md)

> Labeled training/lab work — see [README](README.md)'s honesty rule.

## Interview question
"Walk me through how you'd give an application secure access to an S3 bucket."

## Situation
A backend application needed to upload, read, and delete objects in one specific S3 bucket,
with no long-lived AWS credentials allowed anywhere in the application.

## Task
Grant exactly the permissions needed, scoped as narrowly as possible, using a mechanism that
doesn't involve static access keys.

## Action
I used IAM Roles for Service Accounts (IRSA): created a Kubernetes ServiceAccount dedicated
to this one application, an IAM role trusted only by that specific ServiceAccount via an
OIDC federation condition, and a policy granting only `GetObject`/`PutObject`/
`DeleteObject` under one key prefix in one named bucket — not the whole bucket, and no other
AWS service. I deliberately kept this role completely separate from another role already on
the same cluster (the AWS Load Balancer Controller's role), since merging them would have
given the application unrelated, unnecessary permissions.

## Result
The application could read/write exactly its own data, verified by testing both a successful
upload and — deliberately, to prove the boundary — a denied request when I temporarily
detached the policy to confirm the role had no implicit broader access.

## Follow-up technical questions
- "Why IRSA instead of an EC2 instance profile?"
- "How did you verify the permission boundary was actually enforced, not just configured?"
- "What's the blast radius if this role were somehow compromised?"

## Strong sample answers
- An instance profile grants every process on that EC2 instance/node the same permissions —
  any pod scheduled there could potentially use it. IRSA scopes the role to one specific
  ServiceAccount via an OIDC trust condition, so only pods using that exact identity can
  assume it.
- I detached the policy and confirmed the exact same request now failed with `AccessDenied`
  — proving the permission was actually doing something, not just present in a config file
  nobody checked.
- Limited to reading/writing/deleting objects under one prefix in one bucket — it couldn't
  list other buckets, read other prefixes, or call any other AWS service.

## Common mistakes
Describing IRSA conceptually correctly but being unable to explain the actual trust-policy
mechanism (the OIDC `sub` claim condition) when asked to go one level deeper; not having
actually tested the negative case (a denied request) and only having verified the positive
case.

## 60-second version
"I set up IRSA so a backend pod could access S3 without any static credentials — a
Kubernetes ServiceAccount tied to an IAM role via OIDC trust, scoped to exactly
Get/Put/Delete on one bucket prefix. I verified it both ways: a real upload succeeded, and
when I temporarily removed the policy, the same request correctly failed with AccessDenied —
proving the least-privilege boundary was actually enforced, not just configured."

## 2-3 minute version
Add: the specific trust-policy condition syntax (`sub` matching
`system:serviceaccount:<namespace>:<name>`), why you kept this role separate from another
role on the same cluster, and how you'd explain the overall blast-radius reasoning to a
security-focused interviewer.
