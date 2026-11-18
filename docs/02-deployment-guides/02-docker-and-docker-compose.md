# 02 · Docker and Docker Compose

**Prerequisites:** [01 · Git and GitHub](01-git-and-github.md)
**Next step:** [03 · AWS CLI and ECR](03-aws-cli-and-ecr.md)
**Related runbook:** none needed at this stage — this is local-only.

## Why

Before deploying anything to AWS, you need to prove the application itself works. Docker
Compose runs all four services (frontend, backend, Postgres, Redis) together on your laptop,
wired up exactly like production — same Dockerfiles, same environment variable names — so bugs
get caught here, fast and free, instead of after a slow cloud deploy.

## Prerequisites

- Docker Desktop (or another Compose v2-compatible engine): `docker compose version`
- This repo cloned (see [01 · Git and GitHub](01-git-and-github.md))

## Commands

```bash
cp .env.example .env
# open .env and set ADMIN_API_TOKEN to any string — this gates property/image writes

docker compose config --quiet        # 1
docker compose up --build -d         # 2
docker compose ps                    # 3
curl http://localhost:8080/api/health   # 4
```

## Explanation of each command

1. `docker compose config --quiet` parses `docker-compose.yml` + `.env` and fails loudly if
   there's a syntax error — cheaper to catch now than after a 2-minute build.
2. `up --build` builds fresh images from the Dockerfiles (not just reusing whatever's cached)
   and starts all four containers in the background (`-d`).
3. `ps` shows each container's current health status.
4. Hits the backend's health endpoint through the frontend's Nginx reverse proxy — the same
   path a real browser takes.

## Expected results

```
NAME                               STATUS
jumptotech-estateflow-backend-1    Up ... (healthy)
jumptotech-estateflow-cache-1      Up ... (healthy)
jumptotech-estateflow-db-1         Up ... (healthy)
jumptotech-estateflow-frontend-1   Up ... (healthy)
```
```json
{"status":"ok","db":"up","redis":"up"}
```

## Verify

```bash
curl http://localhost:8080/api/properties | python3 -m json.tool
# returns seeded properties, each with an "images": [] field

curl -s -D - -o /dev/null http://localhost:8080/api/properties | grep -i x-cache   # MISS
curl -s -D - -o /dev/null http://localhost:8080/api/properties | grep -i x-cache   # HIT (2nd call)

curl -X POST http://localhost:8080/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(grep ADMIN_API_TOKEN .env | cut -d= -f2)" \
  -d '{"title":"Test Listing","price":100000}'
# 201 Created
```

Open `http://localhost:8080` in a browser — you should see the property list, a creation form,
an "Admin token" field, and an "Add image" control per listing.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `address already in use` | Something else on your machine already uses port 5432/5000/6379/8080 | Change the relevant `*_PORT` in `.env` (see comments in `.env.example`); on macOS, port 5000 often collides with AirPlay Receiver |
| A container stuck `unhealthy` but seems to respond fine | Healthcheck targeting `localhost` instead of `127.0.0.1` inside an Alpine container can resolve to `::1` first | Already fixed in this repo's `docker-compose.yml` — if you see this on a modified compose file, switch the healthcheck URL to `127.0.0.1` |
| `role "<user>" does not exist` connecting from the host | You connected to a *different* local Postgres (e.g. a native install) also listening on 5432 | Check `lsof -nP -iTCP:5432 -sTCP:LISTEN`; change `POSTGRES_PORT` in `.env` |
| `401` on every POST/PUT/DELETE | Missing or wrong `Authorization: Bearer <token>` header | Confirm the token matches `ADMIN_API_TOKEN` in `.env` exactly |
| Image upload fails | No real `S3_BUCKET_NAME`/AWS credentials configured locally | Expected — see [11 · S3 image storage](11-s3-image-storage.md); everything else works without AWS |

## Troubleshooting

Check logs for the failing service first: `docker compose logs -f backend` (swap the service
name). Most local failures are either a port collision or a stale `.env` value left over from
a previous session — compare against `.env.example`.

## Rollback

```bash
docker compose down          # stop + remove containers, KEEP the Postgres volume (data survives)
docker compose down -v       # ALSO wipe the Postgres volume — irreversible, only do this intentionally
```

## Completion checklist

- [ ] `docker compose ps` shows all four services `healthy`
- [ ] `/api/health` returns `db: up, redis: up`
- [ ] You've seen an `X-Cache` header flip from `MISS` to `HIT`
- [ ] You can create a property with your admin token and see it appear in the list
- [ ] You know the difference between `docker compose down` and `docker compose down -v`
