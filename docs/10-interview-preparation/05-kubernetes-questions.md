# 05 · Kubernetes Questions

**Prerequisites:** [04 · Docker questions](04-docker-questions.md)
**Next step:** [06 · Terraform questions](06-terraform-questions.md)

**Q: Why does this project use two Ingress objects instead of one with two paths?**
A: Each backend service needs a *different* ALB health-check path (`/api/health` for the
backend, `/` for the frontend), but the AWS Load Balancer Controller's health-check
annotations apply per-Ingress, not per-path within one Ingress. The fix is the documented
**IngressGroup** pattern: two Ingress objects sharing
`alb.ingress.kubernetes.io/group.name`, each with its own health-check settings, merged by the
controller into a single ALB. `group.order` sets listener-rule priority so the more specific
`/api` path is evaluated before the frontend's catch-all `/`.

**Q: What's the difference between a readiness probe and a liveness probe?**
A: A failing readiness probe removes the pod from a Service's endpoints (stops routing
traffic to it) without restarting it — used for "temporarily not ready." A failing liveness
probe causes Kubernetes to kill and restart the container — used for "this process is stuck
and a restart is the fix." Using the wrong one for the wrong situation causes either
unnecessary restarts or stuck pods still receiving traffic.

**Q: Why does the backend's Deployment request a ServiceAccount instead of just using the
`default` one?**
A: IRSA (IAM Roles for Service Accounts) annotates a *specific* ServiceAccount with a role
ARN; using the shared `default` ServiceAccount for every pod in a namespace would mean every
pod in that namespace gets the same AWS permissions, violating least privilege. A dedicated
ServiceAccount scopes the permission to exactly the pods that need it.

**Q: What happens if you delete a StatefulSet but not its PersistentVolumeClaim?**
A: The pod is removed, but the PVC (and its underlying EBS volume) remains — by design, to
prevent accidental data loss. Re-creating the StatefulSet re-attaches to the same PVC and the
data is intact. Deleting the PVC itself is the separate, irreversible step.

**Q: What's a HorizontalPodAutoscaler actually watching, and what does it need to function?**
A: It watches a metric (CPU utilization by default, as used here) against a target, polling
roughly every 15-30 seconds, and adjusts replica count within `minReplicas`/`maxReplicas`
bounds. It requires the `metrics-server` add-on — without it, `kubectl get hpa` shows
`<unknown>` for current metrics and the HPA can't make scaling decisions.
