# Incident Report — EKS Node Group Creation: Cross-account PassRole Failure

**Project:** JumpToTech EstateFlow | **Type:** Training lab / production-style incident documentation | **Status:** Evidence-based reconstruction

## Incident summary

**Service:** EstateFlow AWS EKS node-group provisioning in `us-east-1`. While trying to add capacity for the EBS AZ mismatch, an `aws eks create-nodegroup` attempt failed:

```text
An error occurred (AccessDeniedException) when calling the CreateNodegroup operation: Cross-account pass role is not allowed.
```

The failed command used a placeholder `NODE_IAM_ROLE_ARN` rather than a verified role ARN. The team inspected the existing managed node group and obtained an actual node role ARN. **The screenshots prove the diagnosis and role lookup, not that the failed command was retried successfully with the corrected role.**

## Why this happens

EKS managed node groups need an IAM node role that EKS can use to launch worker nodes. The caller must be authorized to pass that role (`iam:PassRole`), and the role must be in the appropriate AWS account and trust EC2. A role from another account cannot simply be passed into an EKS node group. A placeholder, wrong account ID, wrong role ARN, or missing permissions can lead to failure; the exact reason requires checking the ARN and caller identity.

## Read-only investigation

```bash
aws sts get-caller-identity
aws eks describe-cluster --name restaurant-company --region us-east-1   --query 'cluster.{arn:arn,status:status}'
aws eks list-nodegroups --cluster-name restaurant-company --region us-east-1
aws eks describe-nodegroup   --cluster-name restaurant-company   --nodegroup-name restaurant-company-node   --region us-east-1   --query 'nodegroup.{status:status,nodeRole:nodeRole,subnets:subnets,instanceTypes:instanceTypes}'
```

In the classroom output, the existing node group's role was:

```text
arn:aws:iam::992734380025:role/AmazonEKSNodeRole
```

Treat this as **environment-specific evidence**, not a universal role ARN. Verify the caller account, cluster account, and role account match before reuse.

Additional checks for an authorized AWS administrator:

```bash
aws iam get-role --role-name AmazonEKSNodeRole   --query 'Role.{Arn:Arn,Trust:AssumeRolePolicyDocument}'
aws iam list-attached-role-policies --role-name AmazonEKSNodeRole
```

## Safe recovery plan

1. Confirm the AWS account, cluster, region, subnet AZ, and node IAM role ARN.
2. Check the role trust policy for EC2 and the required EKS worker-node permissions.
3. Confirm the caller has `eks:CreateNodegroup` and scoped `iam:PassRole` authorization. Escalate to IAM/security rather than granting broad wildcard permissions.
4. Use a reviewed infrastructure-as-code change or approved AWS CLI request with the verified role ARN and the subnet in the EBS volume's AZ.
5. Wait for the node group to become `ACTIVE`; verify a Ready node joined in the target AZ and PostgreSQL can schedule.

**Do not paste or execute a `create-nodegroup` command with placeholder IDs.** Creating node groups incurs AWS charges; use approved scaling and tagging policies.

## Production prevention

- Provision managed node groups with Terraform and peer-reviewed role/subnet inputs.
- Validate account IDs, IAM role trust, `iam:PassRole` scope, AZ and subnet before deployment.
- Monitor node-group creation failures and audit IAM denials through CloudTrail.
- Maintain a documented capacity strategy for stateful workloads.

## Interview questions and answers

**Q: What does `Cross-account pass role is not allowed` mean?** A: The node-group request attempted to pass an IAM role that EKS could not accept as an in-account node role. First compare caller identity, cluster account, and node-role ARN.

**Q: Would AdministratorAccess on the EC2 instance fix this?** A: Not necessarily. The node role and caller authorization must be correct; excessive permissions are not a substitute for the correct account and trust relationship.

**Q: How do you validate the fix?** A: EKS node group `ACTIVE`, new worker node `Ready` in the correct AZ, then the PostgreSQL StatefulSet successfully schedules and becomes Ready.


## Production incident-response workflow

1. **Detect and assess:** acknowledge the alert; record UTC timestamps, impacted endpoints, customer impact, and severity. Check dashboards and recent deployments or infrastructure changes.
2. **Stabilize:** assign an Incident Commander for a major incident, establish a shared incident channel, and announce a mitigation owner. Avoid deleting persistent storage or changing several variables simultaneously.
3. **Collect evidence:** capture command output, relevant Kubernetes events, AWS resource identifiers, logs, and configuration diffs. Use least-privilege, read-only commands first.
4. **Mitigate and validate:** apply a reviewed, reversible change; verify Pod readiness, application health, and customer-facing endpoints. Watch for recurrence.
5. **Close and learn:** document timeline, confirmed root cause, contributing factors, impact, recovery time, and action items with owners.

## Roles and communication

- **SRE / on-call DevOps:** triage, Kubernetes/AWS evidence, mitigation execution, monitoring and incident timeline.
- **Incident Commander:** priority, communications, decisions, escalation, and coordination (for significant incidents).
- **Platform / AWS engineer:** EKS node groups, VPC, IAM, EBS CSI, EC2 and infrastructure-as-code.
- **Backend engineer / DBA:** PostgreSQL configuration, schema, connection errors, data integrity and application verification.
- **Security engineer:** IAM or network-policy review where relevant.
- **Customer support / product:** customer-facing updates when user impact is confirmed.

## Interview storytelling template

> In our EstateFlow AWS EKS lab, we observed **[symptom]**. I first checked **[read-only checks]** to separate application, network, scheduling, and cloud infrastructure causes. The evidence showed **[specific finding]**. We **[verified mitigation, if documented]**, then validated **[health checks]**. In production, I would also coordinate incident communication, protect data, and add preventive alerts and infrastructure checks.

**Interview integrity:** only describe a mitigation as completed when command output, a change record, or a screenshot verifies it. Do not invent outage duration, financial impact, pager alerts, or customer counts for this training lab.
