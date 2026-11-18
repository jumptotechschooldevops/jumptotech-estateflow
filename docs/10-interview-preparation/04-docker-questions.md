# 04 · Docker Questions

**Prerequisites:** [03 · Linux questions](03-linux-questions.md)
**Next step:** [05 · Kubernetes questions](05-kubernetes-questions.md)

**Q: Why does this project's backend Dockerfile use a multi-stage build?**
A: The `deps` stage installs dependencies (needing `npm`, build tools); the final `runtime`
stage copies only `node_modules`, `src`, and `migrations` from it, then removes `npm` itself
from the final image. This keeps the shipped image smaller and reduces attack surface — the
tools used to *build* the image aren't present in the image that actually *runs*.

**Q: What's the difference between `COPY` and `ADD` in a Dockerfile, and which does this
project use?**
A: `ADD` can also fetch remote URLs and auto-extract archives — extra, often-unneeded
behavior that's easy to misuse. `COPY` does exactly one thing (copy local files into the
image), which is why both Dockerfiles here use `COPY` exclusively — more predictable.

**Q: Why does the backend Dockerfile run `apk update && apk upgrade` before copying app
code?**
A: To pick up patched Alpine OS packages (openssl, musl, zlib, etc.) released after the base
image (`node:20-alpine`) was built, without waiting for a new base image tag — this is a real
mitigation against known-CVE base image packages, verified by the Trivy scan step in CI.

**Q: What does `docker/build-push-action`'s `load: true` actually do, and why did this
project need it?**
A: By default, a buildx build with `push: false` and no `load` produces an image that exists
only in the build cache — not in the runner's local Docker daemon. `load: true` imports it
into the local daemon so a subsequent step (here, Trivy) can actually reference and scan it
by tag. This project's CI had a real bug where this flag was missing, so the scan step had no
image to scan.

**Q: Why run Postgres/Redis as "services" in GitHub Actions CI instead of using Docker
Compose directly in the workflow?**
A: GitHub Actions' native `services:` feature manages the container lifecycle (start, health
check wait, teardown) directly tied to the job, with less YAML than replicating a full
Compose setup — appropriate when you only need the dependency containers, not the full
multi-service orchestration Compose provides for local dev.
