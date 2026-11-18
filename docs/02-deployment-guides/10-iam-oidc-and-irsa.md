# 10 · IAM, OIDC, and IRSA

**Prerequisites:** [04 · EKS and Kubernetes basics](04-eks-and-kubernetes-basics.md)
**Next step:** [11 · S3 image storage](11-s3-image-storage.md)

## Why

The backend needs AWS permissions (to call S3). The old, bad way was: create an IAM user,
generate a long-lived access key/secret key pair, paste it into an env var. **IAM Roles for
Service Accounts (IRSA)** avoids that entirely — a specific Kubernetes ServiceAccount assumes a
specific IAM role, with temporary, auto-rotating credentials, and zero secrets checked into
anything.

## Prerequisites

- Cluster access confirmed ([04](04-eks-and-kubernetes-basics.md))
- `eksctl` installed (recommended path) or willingness to run raw `aws iam` commands

## How it works, step by step

1. EKS clusters expose an **OIDC identity provider** that can issue signed tokens proving "this
   request comes from ServiceAccount X in namespace Y on this cluster."
2. You register that OIDC provider as a trusted identity provider in IAM.
3. You create an IAM role whose **trust policy** only allows
   `sts:AssumeRoleWithWebIdentity` when the token's subject matches
   `system:serviceaccount:estateflow-staging:estateflow-backend` exactly.
4. The Kubernetes ServiceAccount is annotated with `eks.amazonaws.com/role-arn: <role ARN>`
   (already done in `infra/k8s/05-backend.yaml`).
5. EKS's Pod Identity Webhook injects a projected token + env vars into any pod using that
   ServiceAccount.
6. The AWS SDK's **default credential provider chain** — used unmodified in
   `backend/src/awsClients.js`, no access keys anywhere in the code — picks those up and
   exchanges them for short-lived (1-hour, auto-renewed) credentials automatically.

## Commands

```bash
aws eks describe-cluster --name eks-node --region us-east-1 \                           # 1
  --query "cluster.identity.oidc.issuer" --output text
aws iam list-open-id-connect-providers                                                   # 2
eksctl utils associate-iam-oidc-provider --cluster eks-node --region us-east-1 --approve  # 3 (only if missing from step 2)

aws iam create-policy \                                                                  # 4
  --policy-name EstateFlowBackendS3Access \
  --policy-document file://infra/iam/backend-s3-policy.json      # fill in <BUCKET_NAME> first

eksctl create iamserviceaccount \                                                        # 5
  --cluster eks-node --region us-east-1 \
  --namespace estateflow-staging \
  --name estateflow-backend \
  --attach-policy-arn arn:aws:iam::<AWS_ACCOUNT_ID>:policy/EstateFlowBackendS3Access \
  --approve --override-existing-serviceaccounts

kubectl exec -n estateflow-staging deploy/backend -- env | grep AWS_ROLE_ARN              # 6
```

## Explanation of each command

1. / 2. / 3. Find (or create) the OIDC provider the trust policy will reference.
4. Creates the least-privilege S3 policy from `infra/iam/backend-s3-policy.json` (see
   [11 · S3 image storage](11-s3-image-storage.md) for exactly what it grants).
5. `eksctl` creates the IAM role, attaches the trust policy, and annotates/creates the
   `estateflow-backend` ServiceAccount — all in one step.
6. Confirms the running pod actually received the IRSA environment variables.

**Raw `aws iam` equivalent**, if not using `eksctl`: fill in `<AWS_ACCOUNT_ID>` and
`<OIDC_PROVIDER_URL>` in `infra/iam/backend-trust-policy.json`, then
`aws iam create-role --role-name estateflow-backend-s3 --assume-role-policy-document
file://infra/iam/backend-trust-policy.json`, then `aws iam attach-role-policy`, then
`kubectl annotate serviceaccount estateflow-backend -n estateflow-staging
eks.amazonaws.com/role-arn=<arn> --overwrite`.

## Expected results

```
https://oidc.eks.us-east-1.amazonaws.com/id/EXAMPLE...
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/estateflow-backend-s3
```

## Verify

```bash
aws sts get-caller-identity   # from your OWN shell — different identity, by design; confirms
                               # you're not accidentally testing with the pod's role
```
A successful image upload through the running app (see
[11 · S3 image storage](11-s3-image-storage.md)) is the real end-to-end proof.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `AccessDenied: Not authorized to perform sts:AssumeRoleWithWebIdentity` | Trust policy `sub` condition doesn't exactly match | [12 · IAM AccessDenied](../04-runbooks/12-iam-accessdenied.md) |
| AWS SDK calls silently fail with "no credentials found" | ServiceAccount annotation missing, or pod created before annotation existed | Fix annotation, then `kubectl rollout restart deployment/backend -n estateflow-staging` (webhook only injects at pod creation) |
| `AccessDenied` on the actual S3 call | Policy too narrow for the object key being accessed, or wrong bucket name | [13 · S3 AccessDenied](../04-runbooks/13-s3-accessdenied.md) |

## Troubleshooting

`kubectl describe pod <backend-pod> -n estateflow-staging` → check for the
`eks.amazonaws.com` projected volume mount. If it's missing entirely, the ServiceAccount
annotation wasn't present when the pod was scheduled.

## Rollback

```bash
aws iam detach-role-policy --role-name estateflow-backend-s3 --policy-arn <policy-arn>
aws iam delete-role --role-name estateflow-backend-s3
```
Only after confirming nothing still depends on the role — check
`kubectl get serviceaccount estateflow-backend -n estateflow-staging -o yaml` first.

## Alternative: EKS Pod Identity

A newer mechanism that skips the OIDC trust-policy dance (requires the
`eks-pod-identity-agent` add-on) — see `infra/iam/README.md` "Option B" for the exact commands
if your cluster supports it. With Pod Identity, drop the `eks.amazonaws.com/role-arn`
annotation; it isn't used by that mechanism.

## Completion checklist

- [ ] OIDC provider confirmed registered for `eks-node`
- [ ] `EstateFlowBackendS3Access` policy created, scoped to one bucket/prefix
- [ ] Backend ServiceAccount annotated with the correct role ARN
- [ ] `kubectl exec ... env | grep AWS_ROLE_ARN` shows the expected role inside a running pod
