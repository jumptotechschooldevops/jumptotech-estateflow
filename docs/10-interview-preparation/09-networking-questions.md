# 09 · Networking Questions

**Prerequisites:** [08 · IAM and security questions](08-iam-and-security-questions.md)
**Next step:** [10 · Database questions](10-database-questions.md)

**Q: Trace exactly how a browser request for `/api/properties` reaches the backend pod, on
AWS.**
A: Browser resolves the ALB's DNS name → TCP connects to the ALB on port 80 → ALB's listener
rules (by path, via the IngressGroup's priority ordering) match `/api` → routes to the
backend target group → forwards to one of the backend pod IPs directly (since
`target-type: ip`) → the pod's container, listening on port 5000, handles the request.

**Q: Why does `ClusterIP` Service type suffice for Postgres/Redis/backend/frontend, with only
the Ingress exposed externally?**
A: `ClusterIP` is only reachable from inside the cluster's network — exactly the access level
each of these needs, since nothing outside the cluster should talk to Postgres or Redis
directly, and the frontend/backend should only be reached via the ALB's routing, not
directly. Exposing more than necessary (e.g. a `LoadBalancer`-type Service per component)
would unnecessarily widen the attack surface.

**Q: What's the difference between a ClusterIP, NodePort, and LoadBalancer Service type?**
A: `ClusterIP` (used throughout this project): internal-only, stable virtual IP. `NodePort`:
additionally opens a specific port on every node, reachable from outside the cluster without
a load balancer — less common for production HTTP traffic. `LoadBalancer`: provisions a cloud
load balancer per Service — this project instead uses a shared ALB via `Ingress`, which is
more efficient than one load balancer per Service.

**Q: Why does EBS require a volume and its consuming pod to be in the same Availability
Zone?**
A: EBS volumes are zonal resources, physically located in one AZ — attaching across AZs isn't
possible at the storage layer. This is exactly the failure mode covered in
[`04-runbooks/06-ebs-az-mismatch.md`](../04-runbooks/06-ebs-az-mismatch.md): a PVC can show
`Bound` while its pod still can't schedule, if no node in that specific AZ is available.

**Q: How does Kubernetes' internal DNS (CoreDNS) let a pod reach a Service by name like
`postgres` instead of an IP?**
A: CoreDNS runs as a cluster add-on and automatically creates a DNS record for every Service
in the form `<service-name>.<namespace>.svc.cluster.local` (and a short form within the same
namespace, like plain `postgres` — which is what `infra/k8s/01-configmap.yaml`'s `PGHOST`
relies on). The Service's virtual IP stays stable even as the underlying pod IPs change.
