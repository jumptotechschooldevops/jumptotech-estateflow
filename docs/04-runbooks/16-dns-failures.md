# 16 · DNS Failures

**Related guide:** [05 · Kubernetes Deployments and Services](../02-deployment-guides/05-kubernetes-deployments-and-services.md)

## Symptoms
Backend logs show `ENOTFOUND`/`getaddrinfo` errors resolving `postgres`, `redis`, or an AWS
service endpoint; a pod can't resolve a Service name it should be able to reach.

## Potential customer impact
Depends what fails to resolve — could be a full outage (can't reach Postgres) or narrower
(can't reach an AWS API endpoint for S3).

## Detection and alerts
Backend logs; failed connectivity to otherwise-healthy-looking Services.

## Severity assessment
SEV1/SEV2 if it's the Postgres/Redis Service name failing to resolve (core dependency).

## Diagnosis (🔍 read-only)
```bash
kubectl run dns-debug --rm -it --restart=Never -n estateflow-staging \
  --image=busybox:1.36 -- nslookup postgres
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl get svc postgres -n estateflow-staging
```

## How to interpret the output
`nslookup` failing entirely (not just "not found") suggests CoreDNS itself is unhealthy —
check the `kube-dns` pods. `nslookup` succeeding for the Service but the app still can't
connect points at a networking (NetworkPolicy/security group) issue instead — see
[17 · NetworkPolicy blocking traffic](17-networkpolicy-blocking-traffic.md).

## Possible causes
- CoreDNS pods in `kube-system` unhealthy (cluster-wide issue, not EstateFlow-specific)
- The Service itself doesn't exist / was deleted (typo'd name in a ConfigMap pointing at a
  nonexistent Service)
- A `NetworkPolicy` or security group blocking the actual connection despite successful DNS

## Safe mitigation steps (⚠️ changes infrastructure)
```bash
# If CoreDNS pods are unhealthy, this is cluster infrastructure — escalate rather than
# restarting them solo unless you own this responsibility for the cluster.
# If the Service name in a ConfigMap is simply wrong:
kubectl apply -f infra/k8s/01-configmap.yaml   # after fixing the typo in a reviewed PR
kubectl rollout restart deployment/backend -n estateflow-staging
```

## Escalation criteria
Any CoreDNS-level problem (affects every workload in the cluster, not just EstateFlow) —
always escalate to the cluster/platform owner.

## Recovery verification
```bash
kubectl exec -n estateflow-staging deploy/backend -- getent hosts postgres
curl -s "http://<ALB_DNS>/api/health"
```

## Prevention recommendations
Reference Services by their exact Kubernetes name (matching `metadata.name` in the Service
manifest) — never hardcode a pod IP or guess a hostname.
