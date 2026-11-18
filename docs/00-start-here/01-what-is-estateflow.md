# What is EstateFlow?

**Prerequisites:** none.
**Next step:** [First day as a DevOps engineer](02-first-day-as-a-devops-engineer.md)

## The business problem

A real estate brokerage needs a simple way to list properties for sale, with photos, that both
staff and customers can browse. EstateFlow is that listing application: create/edit/delete
property listings, attach photos to a listing, browse the catalog. It is a **teaching
reference implementation** built for the JumpToTech DevOps course — the product itself is
intentionally simple so the course can focus on the infrastructure and operations around it,
which is realistic in depth.

## The technology stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + TypeScript, built by Vite, served by Nginx | Common, in-demand stack; Nginx also proxies `/api` locally |
| Backend | Node.js + Express | Small, readable REST API; easy to reason about for teaching |
| Database | PostgreSQL | Durable storage for listings and image metadata |
| Cache | Redis | Cache-aside layer in front of read-heavy endpoints |
| Object storage | Amazon S3 | Stores the actual image bytes, privately |
| Container orchestration | Kubernetes on Amazon EKS | Runs the frontend/backend/Postgres/Redis in production |
| Load balancing | AWS Application Load Balancer, via the AWS Load Balancer Controller | Routes public internet traffic into the cluster |
| CI/CD | GitHub Actions | Lint, test, build, scan, deploy |
| IAM | IRSA (IAM Roles for Service Accounts) | Lets pods call AWS APIs without long-lived keys |

Full request-flow diagram and the reasoning behind each choice: see
[`01-architecture/README.md`](../01-architecture/README.md).

## Repository structure — a tour

```
.
├── backend/              Node/Express API
│   ├── src/
│   │   ├── routes/properties.js       property + image HTTP routes
│   │   ├── middleware/                auth.js (admin token), upload.js (multer)
│   │   ├── db.js, redisClient.js      Postgres/Redis connections
│   │   ├── awsClients.js, s3Service.js  S3 client + presigned URL logic
│   │   └── server.js                  Express app entry point
│   ├── migrations/                    numbered, additive SQL migrations
│   └── tests/                         Jest + Supertest
├── frontend/             React/TypeScript UI
│   ├── src/
│   │   ├── api.ts                     typed fetch wrapper for the backend
│   │   ├── App.tsx                    top-level component
│   │   └── components/                PropertyList, PropertyForm, PropertyImages, AdminTokenInput
│   └── nginx.conf                     local reverse proxy config
├── infra/
│   ├── k8s/              Kubernetes manifests for the `estateflow-staging` namespace
│   ├── iam/              IAM policy/trust-policy JSON + setup commands (IRSA)
│   └── s3/               S3 bucket policy JSON + setup commands
├── .github/workflows/
│   ├── ci.yml             lint, test, build, Trivy scan — every push/PR
│   └── deploy.yml         build→push→deploy to EKS — main branch / manual
├── docker-compose.yml     local development orchestration
└── docs/                  you are here
```

## What EstateFlow is *not*

It has no real user accounts (one shared admin token gates writes — see
[`02-deployment-guides/01-git-and-github.md`](../02-deployment-guides/01-git-and-github.md) is
unrelated; auth specifics are in
[`02-deployment-guides/11-s3-image-storage.md`](../02-deployment-guides/11-s3-image-storage.md)
and [`01-architecture/README.md`](../01-architecture/README.md)). It has never served real
customer traffic. Any "incident" referenced anywhere in this documentation is a **labeled
training exercise** run against a lab environment, not a real production outage — see
[`05-incident-management/04-training-incident-scenarios.md`](../05-incident-management/04-training-incident-scenarios.md).
