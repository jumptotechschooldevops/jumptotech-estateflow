# Backend IAM role (IRSA) for S3 access

The backend's EKS ServiceAccount (`estateflow-backend` in the `estateflow-staging` namespace,
defined in `infra/k8s/05-backend.yaml`) assumes its own IAM role via **IAM Roles for Service
Accounts (IRSA)** — scoped only to that one ServiceAccount, and only to the property-images
prefix of the S3 bucket. This role is **separate from, and unrelated to**, the IAM role used by
the AWS Load Balancer Controller: that role manages ALBs/target groups cluster-wide, this one
only reads/writes one S3 prefix. No long-lived AWS access keys are used anywhere.

## Option A — IRSA (recommended, matches `05-backend.yaml`)

1. Confirm the cluster already has an IAM OIDC provider (EKS clusters usually do once any
   IRSA-based workload — e.g. the LB Controller — has been set up):
   ```bash
   aws eks describe-cluster --name eks-node --region us-east-1 \
     --query "cluster.identity.oidc.issuer" --output text
   aws iam list-open-id-connect-providers
   ```
   If the OIDC provider for that issuer isn't listed, create it:
   ```bash
   eksctl utils associate-iam-oidc-provider --cluster eks-node --region us-east-1 --approve
   ```

2. Create the policy and role (`eksctl` does the trust-policy templating for you — this is the
   fastest path; the equivalent raw `aws iam` commands using the JSON files in this directory
   are below if you'd rather not depend on `eksctl`):
   ```bash
   aws iam create-policy \
     --policy-name EstateFlowBackendS3Access \
     --policy-document file://infra/iam/backend-s3-policy.json   # fill in <BUCKET_NAME> first

   eksctl create iamserviceaccount \
     --cluster eks-node --region us-east-1 \
     --namespace estateflow-staging \
     --name estateflow-backend \
     --attach-policy-arn arn:aws:iam::<AWS_ACCOUNT_ID>:policy/EstateFlowBackendS3Access \
     --approve \
     --override-existing-serviceaccounts
   ```
   This creates the role, attaches the trust policy, and annotates (or creates) the
   `estateflow-backend` ServiceAccount with `eks.amazonaws.com/role-arn` for you — update
   `infra/k8s/05-backend.yaml`'s placeholder ARN to match what it prints, or skip editing the
   file and just re-apply after `eksctl` has annotated the ServiceAccount.

   **Raw `aws iam` equivalent** (if not using `eksctl`): fill in `<AWS_ACCOUNT_ID>` and
   `<OIDC_PROVIDER_URL>` (e.g. `oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D4633E53DE1B716D3041E`,
   from step 1) in `backend-trust-policy.json`, then:
   ```bash
   aws iam create-role \
     --role-name estateflow-backend-s3 \
     --assume-role-policy-document file://infra/iam/backend-trust-policy.json

   aws iam attach-role-policy \
     --role-name estateflow-backend-s3 \
     --policy-arn arn:aws:iam::<AWS_ACCOUNT_ID>:policy/EstateFlowBackendS3Access
   ```
   Then annotate the ServiceAccount manually (or just set it in `05-backend.yaml` before
   applying):
   ```bash
   kubectl annotate serviceaccount estateflow-backend -n estateflow-staging \
     eks.amazonaws.com/role-arn=arn:aws:iam::<AWS_ACCOUNT_ID>:role/estateflow-backend-s3 --overwrite
   ```

3. Verify from inside a running backend pod (after deploying):
   ```bash
   kubectl exec -n estateflow-staging deploy/backend -- env | grep AWS_ROLE_ARN
   ```
   The pod's AWS SDK calls now authenticate as this role automatically — no code change needed
   beyond using the default credential provider chain (already how `backend/src/awsClients.js`
   is written).

## Option B — EKS Pod Identity (newer alternative, if your cluster/add-ons support it)

EKS Pod Identity removes the OIDC-trust-policy step entirely and is simpler to manage at scale,
but requires the `EKS Pod Identity Agent` add-on:

```bash
aws eks create-addon --cluster-name eks-node --region us-east-1 --addon-name eks-pod-identity-agent

aws iam create-role \
  --role-name estateflow-backend-s3 \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "pods.eks.amazonaws.com"},
      "Action": ["sts:AssumeRole", "sts:TagSession"]
    }]
  }'

aws iam attach-role-policy \
  --role-name estateflow-backend-s3 \
  --policy-arn arn:aws:iam::<AWS_ACCOUNT_ID>:policy/EstateFlowBackendS3Access

aws eks create-pod-identity-association \
  --cluster-name eks-node --region us-east-1 \
  --namespace estateflow-staging \
  --service-account estateflow-backend \
  --role-arn arn:aws:iam::<AWS_ACCOUNT_ID>:role/estateflow-backend-s3
```
With Pod Identity, drop the `eks.amazonaws.com/role-arn` annotation from the ServiceAccount in
`05-backend.yaml` — it isn't used by this mechanism.

## Least privilege

`backend-s3-policy.json` grants only `GetObject`/`PutObject`/`DeleteObject` under the
`properties/` prefix of one named bucket, plus a prefix-scoped `ListBucket` — nothing else in
the account, and no access to any other S3 bucket.
