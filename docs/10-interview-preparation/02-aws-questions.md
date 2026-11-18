# 02 · AWS Questions

**Prerequisites:** [01 · Project and architecture](01-project-and-architecture.md)
**Next step:** [03 · Linux questions](03-linux-questions.md)

**Q: What's the difference between EKS and ECS?**
A: Both run containers on AWS. EKS is managed Kubernetes — you get the full Kubernetes API and
ecosystem (Helm, standard manifests, portable to other clouds), with more operational
complexity. ECS is AWS's own simpler, proprietary orchestrator — less portable, often less
day-to-day operational overhead for teams that don't need Kubernetes specifically.

**Q: What is an Application Load Balancer, and how does it differ from a Network Load
Balancer?**
A: An ALB operates at Layer 7 (HTTP/HTTPS) — it can route by path/host, inspect headers, do
TLS termination. An NLB operates at Layer 4 (TCP/UDP) — faster, handles millions of
connections, but can't make routing decisions based on HTTP content. This project uses an ALB
because it needs path-based routing (`/` vs `/api`).

**Q: What's the difference between an EBS volume and S3?**
A: EBS is block storage — attaches to exactly one EC2/pod at a time, like a virtual hard
drive; used here for Postgres's data, which needs low-latency random read/write. S3 is object
storage — accessed over HTTP, scales to unlimited objects, multiple readers at once; used
here for images, which are written once and read many times via HTTP anyway.

**Q: What does "target-type: ip" mean on an ALB Ingress, and why use it over "instance"?**
A: It tells the ALB to route directly to pod IPs (via the VPC CNI) instead of to EC2 instance
ports via NodePort. It's required for Fargate and generally preferred on EKS because it
avoids an extra network hop through `kube-proxy`/NodePort and gives more accurate health
checks against the actual pod, not just the node.

**Q: What's the AWS Shared Responsibility Model, and where does this project's responsibility
start?**
A: AWS secures the infrastructure "of" the cloud (physical hosts, hypervisor, managed service
internals like the EKS control plane); the customer secures what they put "in" the cloud —
here, that's the container images, the Kubernetes RBAC/NetworkPolicy configuration, IAM
policies, and the application code itself.

**Q: How would you estimate the monthly cost of this setup?**
A: Roughly: EKS control plane (flat hourly fee) + worker node EC2 instances + one ALB (hourly
+ per-LCU) + one EBS gp3 volume (per-GB) + S3 storage/requests (usually negligible at lab
scale) + data transfer. The single highest line items are typically the worker nodes and the
ALB, not S3 or EBS at this scale.
