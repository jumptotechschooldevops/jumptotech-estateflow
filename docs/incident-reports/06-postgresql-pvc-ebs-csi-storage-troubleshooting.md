# Incident Report — PostgreSQL Storage Troubleshooting: PVC, PV, StorageClass and EBS CSI

**Project:** JumpToTech EstateFlow | **Type:** Training lab / production-style incident documentation | **Status:** Evidence-based reconstruction

## Incident summary

EstateFlow used a PostgreSQL StatefulSet with a persistent AWS EBS volume. The classroom investigation inspected PVC, PV, StorageClass, and EBS CSI components while troubleshooting a Pending PostgreSQL Pod.

**Important distinction:** in the captured evidence, the PVC and PV were **Bound**, and EBS CSI controller/node Pods were Running. We do **not** have evidence that this environment suffered a separate CSI driver outage or a PVC Pending provisioning failure. This report is a production-ready troubleshooting runbook based on the storage investigation, not a claim that every hypothetical failure occurred.

### Captured storage evidence

- Claim: `real-estate-company/postgres-data-postgres-0`.
- Capacity: `10Gi`, access mode `ReadWriteOnce`.
- StorageClass: `real-estate-gp3`.
- PV provisioner: `ebs.csi.aws.com`.
- PV reclaim policy: `Retain`.
- PV node affinity required `us-east-1d`.
- `postgres-0` was Pending with scheduling warnings; the observed binding was successful.

## Storage architecture

```text
StatefulSet postgres
   -> PVC postgres-data-postgres-0
      -> PV (10Gi, RWO, Retain)
         -> AWS EBS volume (AZ-scoped)
            -> EBS CSI driver + eligible EC2 worker node
```

The CSI driver provisions and attaches EBS storage; the Kubernetes scheduler still must place the Pod on a node compatible with PV topology and capacity. A **Bound PVC does not mean the Pod is scheduled or the EBS volume is mounted**.

## Read-only diagnosis

```bash
NS=real-estate-company
kubectl get statefulset,pod,pvc -n "$NS" -o wide
kubectl describe pod postgres-0 -n "$NS"
kubectl get pvc -n "$NS"
kubectl describe pvc postgres-data-postgres-0 -n "$NS"
PV=$(kubectl get pvc postgres-data-postgres-0 -n "$NS" -o jsonpath='{.spec.volumeName}')
kubectl describe pv "$PV"
kubectl get storageclass real-estate-gp3 -o yaml
kubectl get csidrivers
kubectl get pods -n kube-system | grep ebs-csi
kubectl get nodes -L topology.kubernetes.io/zone
kubectl get events -n "$NS" --sort-by=.lastTimestamp | tail -30
```

### Decision tree

| Symptom | Likely layer | Next evidence |
|---|---|---|
| PVC Pending, no PV | Provisioning / StorageClass / IAM / quota | PVC events, CSI controller logs, StorageClass binding mode |
| PVC Bound, Pod Pending | Scheduler / AZ affinity / node capacity | `describe pod`, PV node affinity, node AZs |
| Pod scheduled, volume attach fails | EC2 EBS attachment / IAM / CSI | `FailedAttachVolume` events, CSI logs, AWS volume state |
| Pod running, DB not ready | PostgreSQL process / config / data | readiness probe, PostgreSQL logs, filesystem state |
| DB ready, backend cannot connect | DNS / NetworkPolicy / credentials | EndpointSlice, `nslookup`, TCP 5432, application logs |

## Safe mitigation practices

- For **AZ mismatch**, add an eligible node in the EBS volume's AZ or use a planned snapshot/migration workflow.
- For **provisioning failure**, inspect StorageClass provisioner, binding mode, EBS CSI controller, permissions, quotas and AWS events; correct the specific failing dependency.
- For **attachment failure**, inspect EBS CSI node/controller logs, EC2 attachment state, and node permissions; avoid force-detaching volumes in active use.
- For **PostgreSQL data problems**, involve a DBA and validate backup/recovery procedures before changing volumes.
- Never delete a production PVC/PV as a quick fix. `Retain` helps protect the backing volume after claim deletion but does not eliminate data-loss or recovery risks.

## Prevention and operational readiness

- Use zone-aware node groups and StorageClasses; review `WaitForFirstConsumer` for new dynamically provisioned volumes.
- Monitor Pending Pods, PVC provisioning errors, volume attach/mount failures, node capacity and database readiness.
- Maintain encrypted backups, tested restores, retention policies and an inventory of PV-to-EBS volume mappings.
- Document EBS topology and expected stateful workload placement in Terraform and deployment runbooks.

## Interview questions and answers

**Q: What is the difference between PVC, PV and StorageClass?** A: PVC requests storage, PV represents allocated storage, and StorageClass defines how dynamic provisioning should work.

**Q: PVC Bound but Pod Pending: what's first?** A: `kubectl describe pod` and PV node affinity; don't assume CSI provisioning failed.

**Q: Can an EBS volume be mounted by Pods in different AZs?** A: No. A normal EBS volume is AZ-scoped and must attach to an eligible instance in its AZ.


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
