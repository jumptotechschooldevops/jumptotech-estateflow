# Incident Report — PostgreSQL DNS NXDOMAIN: Headless Service Without Ready Endpoints

**Project:** JumpToTech EstateFlow | **Type:** Training lab / production-style incident documentation | **Status:** Evidence-based reconstruction

## Incident summary

Two EstateFlow students compared `nslookup postgres` from backend Pods in separate EKS environments. In one environment the query resolved to a PostgreSQL Pod IP (`172.31.47.19`). In the other, CoreDNS (`10.100.0.10`) returned `NXDOMAIN`, including for the full name `postgres.real-estate-company.svc.cluster.local`.

The affected environment showed:

```text
postgres    ClusterIP   None   <none>   5432/TCP
postgres    <none>      (no Endpoints)
postgres-0  0/1         Pending
```

This matters: **the headless Service existed, but there was no ready PostgreSQL endpoint to publish.** The same environment also had a known scheduling problem involving an EBS PV in `us-east-1d` and nodes in other AZs.

## What the output actually means

- `Server: 10.100.0.10` is the DNS server used by the Pod (typically the CoreDNS Service IP), **not the PostgreSQL IP**.
- `NXDOMAIN` means the queried DNS name has no record in that response. It does not, by itself, prove CoreDNS is broken.
- `ClusterIP: None` indicates a **headless Service**; DNS answers normally refer to endpoint Pod IPs rather than a virtual Service IP.
- A headless Service without ready endpoints may not return an A record. `publishNotReadyAddresses` changes publication behavior and should not be enabled casually just to hide a readiness failure.
- In the other student's environment, a positive `Name` and `Address` result proved that the full PostgreSQL Service name resolved. Some subsequent NXDOMAIN lines were for alternate search-suffix names and did not invalidate that positive result.

## Troubleshooting in order

```bash
NS=real-estate-company
kubectl get svc postgres -n "$NS" -o wide
kubectl describe svc postgres -n "$NS"
kubectl get pods -n "$NS" -o wide
kubectl get endpointslice -n "$NS" -l kubernetes.io/service-name=postgres -o wide
kubectl get endpoints postgres -n "$NS"
kubectl describe pod postgres-0 -n "$NS"
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl exec -n "$NS" deploy/backend --   nslookup postgres.real-estate-company.svc.cluster.local
```

If an endpoint exists, test TCP from backend:

```bash
kubectl exec -n real-estate-company deploy/backend --   sh -c 'nc -z -w 5 postgres 5432; echo EXIT_CODE:$?'
```

`EXIT_CODE:0` indicates TCP connect succeeded; it does **not** prove valid database credentials, query success, or application health. If `nc` is not installed, use an approved diagnostic Pod. If name resolution works but TCP fails, inspect NetworkPolicy ingress **and egress**, Pod readiness, target port, and PostgreSQL listener/logs. If TCP succeeds but authentication fails, inspect the backend's connection configuration and secrets without printing passwords.

## Root cause and recovery

**Supported lab finding:** the affected PostgreSQL Pod was Pending, its headless Service had no endpoint, and DNS lookup returned NXDOMAIN. The underlying scheduler evidence pointed to EBS AZ node-affinity mismatch and Pod-capacity pressure. This is stronger evidence for missing ready endpoints than for a CoreDNS outage.

**Recovery plan:** restore eligible node capacity in the PV's AZ, verify PostgreSQL becomes Ready, verify EndpointSlice contains a ready PostgreSQL endpoint, then retest DNS, TCP 5432, and a real DB-backed API request. The available screenshots do not prove this end-to-end recovery was completed.

## Interview questions and answers

**Q: A Service exists. Why does DNS return NXDOMAIN?** A: First identify whether it's headless. Check EndpointSlices and Pod readiness; a headless Service without ready addresses may have no A record.

**Q: Does `nslookup` returning an IP prove database access?** A: No. It proves DNS resolution. Next test TCP 5432, authentication and a real query.

**Q: Should you restart CoreDNS first?** A: No. Confirm the Service name, namespace, endpoint readiness and scheduling before modifying shared DNS infrastructure.


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
