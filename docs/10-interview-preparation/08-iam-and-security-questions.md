# 08 · IAM and Security Questions

**Prerequisites:** [07 · GitHub Actions questions](07-github-actions-questions.md)
**Next step:** [09 · Networking questions](09-networking-questions.md)

**Q: What's the difference between IAM roles for EC2 instances and IRSA for EKS pods?**
A: An EC2 instance profile grants every process on that instance the same role — any pod
scheduled on that node could potentially assume it, a real multi-tenant security hole. IRSA
scopes the role to one specific Kubernetes ServiceAccount via OIDC federation plus a
trust-policy condition on the token's `sub` claim, so only pods using that exact
ServiceAccount — not every pod on the node — can assume it.

**Q: What does least privilege mean concretely for this backend's IAM role?**
A: The role can only `GetObject`/`PutObject`/`DeleteObject` under one S3 prefix
(`properties/*`) in one named bucket, plus a prefix-scoped `ListBucket` — it cannot list other
buckets, touch other prefixes in the same bucket, or call any other AWS service. If the
backend were compromised, the blast radius is "can mess with property images in this one
bucket," not "has broad account access."

**Q: Why does the backend run `readOnlyRootFilesystem: true` with all Linux capabilities
dropped?**
A: Defense in depth — if an attacker achieved code execution inside the container, they
couldn't write a payload to disk, modify application code at rest, or use any elevated
capability. The backend never needs to write to disk at runtime anyway (uploads are buffered
in memory), so this adds real security at zero functional cost.

**Q: How is the admin API token stored and compared, and why does that matter?**
A: It's compared using `crypto.timingSafeEqual` (`backend/src/middleware/auth.js`) rather than
a plain `===` string comparison. A naive comparison can leak information about how many
leading characters matched via response-timing differences (a timing side-channel); a
constant-time comparison closes that specific leak.

**Q: Why is image upload validated by content-type (and size) at the application layer
*and* enforced by a Kubernetes resource limit, rather than just one or the other?**
A: Different layers catch different failure modes. The `multer` fileFilter/size limit stops a
bad request from ever reaching S3. Kubernetes `resources.limits` is a backstop against a
different problem entirely — runaway memory/CPU from any cause, not just this one endpoint —
and protects the node/other pods even if an application-layer check were ever bypassed or
buggy. Relying on only one layer leaves a gap the other layer exists specifically to close.

**Q: Why does the S3 bucket policy explicitly deny non-HTTPS requests, if the AWS SDK
already uses HTTPS by default?**
A: Defense in depth again — the SDK defaulting to HTTPS protects this specific application's
calls, but the bucket policy's `aws:SecureTransport` deny protects against *any* caller,
including a misconfigured future client or a tool that doesn't default to HTTPS, closing the
gap at the resource level instead of trusting every client's configuration.
