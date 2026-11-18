# 01 · Docker Lab

**Prerequisites:** [02-deployment-guides/02 · Docker and Docker Compose](../02-deployment-guides/02-docker-and-docker-compose.md)
**Next step:** [02 · Kubernetes lab](02-kubernetes-lab.md)

## Guided lab

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
curl http://localhost:8080/api/health
curl http://localhost:8080/api/properties
docker compose logs backend --tail=20
docker compose down
```
Confirm each command's output matches
[02-deployment-guides/02](../02-deployment-guides/02-docker-and-docker-compose.md)'s "Expected
results" before moving on.

## Independent practice assignment

Without re-reading the guide: start the stack, create a property via `curl` with your admin
token, confirm it appears in `GET /api/properties`, delete it, confirm it's gone, tear down
cleanly. Time yourself — this should take under 5 minutes once you know it.

## Controlled failure scenario

Change `POSTGRES_PASSWORD` in `.env` *after* the stack has already started once (so the
volume already has the old password baked in), then `docker compose up -d` again without
`-v`.

## Troubleshooting exercise

Explain, before looking it up: why does the backend now fail its health check? (Answer: the
Postgres container only applies `POSTGRES_PASSWORD` on first initialization of an empty data
directory — an existing volume keeps its original password regardless of a new `.env` value.)

## Expected outcome

You can explain the volume/password behavior above in your own words, and successfully
recover (either revert `.env` or run `docker compose down -v` to start fresh, understanding
the data-loss tradeoff of the latter).

## Verification checklist

- [ ] Full stack starts healthy from a clean clone
- [ ] Create→read→delete round trip works with your admin token
- [ ] Can explain why changing `.env`'s password didn't retroactively apply
- [ ] Cleaned up (`docker compose down`) when done

## Interview questions

1. **What's the difference between `docker compose down` and `docker compose down -v`?**
2. **Why does this project's healthcheck use `127.0.0.1` instead of `localhost`?**
3. **How does Docker Compose pass environment variables into a container, and where does
   `docker-compose.yml` get its defaults from if `.env` doesn't set a value?**

## Sample answers

1. `down` stops and removes containers/network but keeps named volumes (data survives);
   `down -v` additionally removes volumes — permanent data loss, only use when you want a
   clean slate.
2. On Alpine/musl, `localhost` can resolve to the IPv6 loopback (`::1`) first; if the service
   inside the container only binds its IPv4 socket, a healthcheck using `localhost` fails with
   "connection refused" even though the service works fine — `127.0.0.1` avoids the ambiguity.
3. Compose reads `environment:` entries in the service definition, substituting
   `${VAR:-default}` syntax from the shell environment or a `.env` file in the same directory;
   if neither sets a value and no default is given after `:-`, the variable is empty.
