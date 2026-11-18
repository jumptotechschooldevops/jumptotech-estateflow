# 01 · Architecture

**Prerequisites:** [00-start-here](../00-start-here/README.md)
**Next step:** [02-deployment-guides](../02-deployment-guides/README.md)

## System diagram

```
                           Internet
                              │
                 ┌────────────────────────┐
                 │   AWS ALB (Ingress)     │   ← created by the AWS Load Balancer Controller
                 └────────────┬────────────┘
                 "/"  │                  │  "/api"
          ┌────────────▼───────┐  ┌───────▼────────────┐
          │  Frontend Pods      │  │  Backend Pods       │
          │  (Nginx + React)    │  │  (Node/Express)      │
          └─────────────────────┘  └──────┬──────┬───────┘
                                           │      │
                                   ┌───────▼┐  ┌──▼────────┐      ┌────────────┐
                                   │Postgres│  │  Redis    │      │  Amazon S3  │
                                   │(EBS PVC)│  │ (cache)   │      │ (images)   │
                                   └────────┘  └───────────┘      └────────────┘
```

Locally (Docker Compose), Nginx itself proxies `/api/*` to the backend container. In AWS, the
ALB does that routing instead — see
[`02-deployment-guides/09-ingress-alb-and-target-groups.md`](../02-deployment-guides/09-ingress-alb-and-target-groups.md).

## Components and why each exists

- **Frontend** — React + TypeScript, built to static files by Vite, served by Nginx (a tiny,
  battle-tested static file server — no need to run Node in production just to serve HTML/JS).
- **Backend** — Node.js + Express REST API: property CRUD under `/api/properties`, image
  upload/list/delete under `/api/properties/:id/images`, health check at `/api/health`.
- **PostgreSQL** — the single source of truth for property data and image *metadata* (object
  key, content type, size) — never the image bytes themselves. See "why images live in S3" below.
- **Redis** — a cache-aside layer in front of property reads, so a burst of browsing traffic
  doesn't hammer Postgres. Every response carries an `X-Cache: HIT` or `MISS` header, so caching
  is something you can *observe*, not just something you have to trust is configured correctly.
- **Amazon S3** — stores the actual image bytes, privately. The backend is the only thing with
  permission to read/write it, via IAM — never a password, never a long-lived key.
- **Kubernetes (EKS)** — runs everything except S3 in containers, with self-healing (crashed
  pods get replaced automatically) and horizontal scaling.
- **AWS Load Balancer Controller + ALB** — the only thing on the public internet; everything
  else is only reachable inside the cluster's private network.

## Why images live in S3, not Postgres

Databases are bad at storing large binary blobs — backups bloat, queries slow down, replication
gets expensive. The standard pattern used by almost every real-world app: store the *bytes* in
object storage (S3), store a *pointer* to them (the object key) in the database next to the row
it belongs to. That's exactly what the `property_images` table does — see
`backend/migrations/002_add_property_images.sql`.

## Why there's a single "admin token" instead of user accounts

The original version of this app had no authentication at all. Once image uploads exist (which
cost real AWS money per request and could be abused by anyone), writes need *some* gate. This
project uses one shared bearer token (`ADMIN_API_TOKEN`, checked by
`backend/src/middleware/auth.js`) deliberately — it keeps the lab focused on infrastructure
rather than building a full login system. A real product would replace this with per-user
accounts and role-based checks (Cognito, Auth0, or a self-issued JWT with a login flow) — see
[`10-interview-preparation/08-iam-and-security-questions.md`](../10-interview-preparation/08-iam-and-security-questions.md)
for how to discuss that trade-off in an interview.

## Why presigned URLs instead of a public bucket

Access to an image is granted per-request, per-object, and time-limited via a **presigned
URL** — proof that the backend (which holds real IAM permission to read the object) authorized
this one URL to work until it expires (5 minutes). The bucket itself has no public access at
all. Full detail: [`02-deployment-guides/11-s3-image-storage.md`](../02-deployment-guides/11-s3-image-storage.md).

## Data flow for one request: "load the property list with photos"

1. Browser → ALB → frontend pod (Nginx) → React app loads → calls `GET /api/properties`.
2. ALB routes `/api` to the backend Service → a backend pod.
3. Backend checks Redis for a cached response. Miss → query Postgres for property rows.
4. Backend queries `property_images` for each property's object keys, generates a fresh
   presigned S3 URL for each (never cached — see
   [`02-deployment-guides/11-s3-image-storage.md`](../02-deployment-guides/11-s3-image-storage.md)
   for why), and returns the combined JSON.
5. Browser renders `<img src="<presigned-url>">` — the browser fetches image bytes **directly
   from S3**, not through the backend.

## Where to find things

| Concern | Path |
|---|---|
| Backend source | `backend/src/` |
| Frontend source | `frontend/src/` |
| Local dev orchestration | `docker-compose.yml` |
| Database migrations | `backend/migrations/` |
| Kubernetes manifests | `infra/k8s/` |
| IAM policy/role docs | `infra/iam/` |
| S3 bucket setup | `infra/s3/` |
| CI (lint/test/build/scan) | `.github/workflows/ci.yml` |
| CD (build→push→deploy) | `.github/workflows/deploy.yml` |
