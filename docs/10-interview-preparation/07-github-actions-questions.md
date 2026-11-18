# 07 · GitHub Actions Questions

**Prerequisites:** [06 · Terraform questions](06-terraform-questions.md)
**Next step:** [08 · IAM and security questions](08-iam-and-security-questions.md)

**Q: Why use GitHub OIDC instead of storing an AWS access key as a repository secret?**
A: An OIDC-federated role issues short-lived credentials, scoped by the trust policy's
conditions (here, to this exact repo and branch) — nothing persistent to leak, nothing to
manually rotate. A static access key stored as a secret is valid indefinitely from anywhere
until someone remembers to rotate it, and if it leaks, it works for anyone who has it, not
just GitHub Actions runs matching specific conditions.

**Q: What was the real bug in this project's original `ci.yml` around Trivy scanning, and why
did it matter?**
A: The workflow built images tagged `estateflow-backend:latest`/`estateflow-frontend:latest`
but ran Trivy against `jumptotech-estateflow-backend:latest` — a name that was never actually
built — and the build steps were also missing `load: true`, so the image never even reached
the runner's local Docker daemon. Either problem alone meant the vulnerability scan never
scanned the real image, silently defeating a security control that looked like it was working.

**Q: Why does `deploy.yml` use `environment: staging` on its jobs?**
A: GitHub Environments support required-reviewer protection rules — a human approval gate
before a job runs. Tying the deploy jobs to an environment means a deploy to this
environment can be configured to require sign-off, rather than every merge to `main`
auto-deploying with no checkpoint.

**Q: How does a Kubernetes RBAC mapping relate to an IAM role used by GitHub Actions?**
A: IAM authentication (who you are to AWS) and Kubernetes RBAC authorization (what you're
allowed to do inside the cluster) are separate systems. Successfully assuming the deploy
role via OIDC only proves identity to AWS — `kubectl` commands against the cluster still fail
with `Unauthorized` unless that same IAM identity is also mapped to Kubernetes permissions
(via the `aws-auth` ConfigMap or EKS access entries).

**Q: Why tag images with both the commit SHA and `latest` instead of just `latest`?**
A: `latest` is a moving target, useless as a rollback reference since it keeps changing. The
commit-SHA tag is immutable — it's what you actually reference for predictable deploys and
reliable rollbacks (`kubectl rollout undo` relies on the Deployment's recorded spec history,
but a manual rollback to a *specific* known-good version needs an immutable tag to target).
