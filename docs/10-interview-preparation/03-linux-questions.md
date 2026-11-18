# 03 · Linux Questions

**Prerequisites:** [02 · AWS questions](02-aws-questions.md)
**Next step:** [04 · Docker questions](04-docker-questions.md)

**Q: Why does this project's Nginx container run as a non-root user listening on port 8080
instead of 80?**
A: Binding a port below 1024 on Linux requires root privilege or the `NET_BIND_SERVICE`
capability. The container drops all Linux capabilities (`capabilities: drop: ["ALL"]` in
`infra/k8s/06-frontend.yaml`) for defense in depth, so it listens on an unprivileged port
instead — the Service/port mapping translates the externally-visible port 80 back to it.

**Q: What does `readOnlyRootFilesystem: true` actually do at the OS level?**
A: It mounts the container's root filesystem read-only, so nothing (including an attacker who
achieves code execution) can write to or modify files on disk at runtime. Any directory the
app genuinely needs to write to (e.g. Nginx's `/var/cache/nginx`, `/var/run`) must be
explicitly mounted as a writable volume (`emptyDir` here) — everything else stays immutable.

**Q: What's the difference between a process being `Running` and being ready to serve
traffic, in terms of Linux process state?**
A: A process can be scheduled and running (consuming CPU, not crashed) while still not being
ready to serve — e.g. still establishing its database connection pool. This is exactly why
Kubernetes separates liveness (is the process alive) from readiness (is it ready to receive
traffic) probes — they test different things.

**Q: What does `pg_isready` check, under the hood?**
A: It attempts a lightweight connection to the Postgres server and checks whether it accepts
connections — distinct from checking whether the *process* exists; a Postgres process can be
running but not yet accepting connections during startup/recovery.

**Q: How would you find out which process is listening on a given port on a Linux host?**
A: `lsof -nP -iTCP:<port> -sTCP:LISTEN` (used in this project's own README troubleshooting
section for local port conflicts) or `ss -ltnp`.
