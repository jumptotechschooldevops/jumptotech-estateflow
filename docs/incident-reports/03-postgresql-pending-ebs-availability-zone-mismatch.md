# Incident Report — PostgreSQL Pending: EBS Volume Availability Zone Mismatch

**Project:** JumpToTech EstateFlow | **Type:** Training lab / production-style incident documentation | **Status:** Evidence-based reconstruction

## Incident summary

**Service:** EstateFlow PostgreSQL StatefulSet, namespace `real-estate-company`, AWS EKS `restaurant-company` in `us-east-1` (Darya's environment). **Observed:** `postgres-0` was `0/1 Pending`; backend and frontend Pods were Running. PostgreSQL's headless Service had no usable endpoint. This was a scheduling/storage issue, not evidence that the PostgreSQL process had crashed.

### Evidence observed in class

- `kubectl describe pod postgres-0` showed `PodScheduled: False` and `FailedScheduling`.
- Scheduler event: `0/3 nodes are available: 1 Too many pods, 2 node(s) didn't match PersistentVolume's node affinity`.
- `kubectl get pvc -n real-estate-company` showed `postgres-data-postgres-0` **Bound**, capacity **10Gi**, StorageClass `real-estate-gp3`.
- `kubectl describe pv` showed `topology.kubernetes.io/zone in [us-east-1d]` and an AWS EBS CSI volume.
- Existing nodes were in `us-east-1b` and `us-east-1f` at the time of inspection. A new node later appeared, but the screenshot did not establish that PostgreSQL had reached Running.

### Technical root cause

AWS EBS volumes are Availability Zone scoped. A Pod using an existing EBS PV must run on a compatible node in the **same AZ** as the volume. A PVC can be **Bound** while the Pod is **Pending**: binding means a volume was assigned, not that an eligible node exists. One node also had Pod capacity pressure.

## Investigation: commands in order

```bash
NS=real-estate-company
kubectl get pods -n "$NS" -o wide
kubectl describe pod postgres-0 -n "$NS"
kubectl get nodes -L topology.kubernetes.io/zone,node.kubernetes.io/instance-type
kubectl get pvc -n "$NS"
kubectl describe pvc postgres-data-postgres-0 -n "$NS"
PV=$(kubectl get pvc postgres-data-postgres-0 -n "$NS" -o jsonpath='{.spec.volumeName}')
kubectl describe pv "$PV"
kubectl get events -n "$NS" --sort-by=.lastTimestamp | tail -30
```

Explain the evidence: `FailedScheduling` identifies the layer; `PV Node Affinity` identifies the required AZ; `kubectl get nodes -L ...` shows where nodes actually run.

## Mitigation and validation

**Preferred for this existing data volume:** add suitable worker-node capacity in `us-east-1d`, using a subnet in the EKS VPC, a valid node IAM role in the same AWS account, and an approved instance type. Verify subnet/AZ, role and cluster first; do not blindly copy account-specific IDs. We investigated an AZ-specific node group during class; do not claim database recovery without a later Running/Ready result.

```bash
aws eks list-nodegroups --cluster-name restaurant-company --region us-east-1
aws eks describe-nodegroup --cluster-name restaurant-company   --nodegroup-name restaurant-company-node --region us-east-1   --query 'nodegroup.{status:status,nodeRole:nodeRole,subnets:subnets}'
kubectl get nodes -L topology.kubernetes.io/zone
kubectl get pod postgres-0 -n real-estate-company -o wide
kubectl get endpointslice -n real-estate-company -l kubernetes.io/service-name=postgres
```

For future **new** volumes, consider `WaitForFirstConsumer` and zone-aware placement; this does not move an existing EBS volume. Do **not** delete the PVC/PV or recreate the database to bypass scheduling: data may be lost. Moving existing data across AZs requires a deliberate snapshot/restore or migration plan.

### Recovery acceptance criteria

- Node in `us-east-1d` is `Ready` and has available Pod capacity.
- `postgres-0` is `Running`, `1/1 Ready`, mounted to the intended existing PVC.
- Headless Service has a ready endpoint; backend can resolve and connect to PostgreSQL on TCP 5432.
- Application DB-backed API and data integrity checks succeed.

## Interview questions and answers

**Q: PVC is Bound. Why is the Pod Pending?** A: Volume binding and Pod scheduling are separate. The EBS PV's node affinity requires an AZ that no eligible worker node currently offers.

**Q: Why not change the PV node affinity to another AZ?** A: Editing metadata does not physically move an AZ-scoped EBS volume; the attachment would still fail.

**Q: Why isn't this CrashLoopBackOff?** A: The Pod has not been scheduled or started, so there is no crashing PostgreSQL container.


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
