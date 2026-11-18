# 02 · Worked Example — Execution Record

**Prerequisites:** [01 · Execution record template](01-execution-record-template.md)
**Next step:** [07-change-management](../07-change-management/README.md)

This is a real record from this repository's own development history — the backend test
suite (including the new S3-image endpoints) was actually run against an ephemeral local
Postgres/Redis before being considered complete. Nothing below is invented.

```markdown
## Execution Record — Backend lint + Jest suite after adding S3 image endpoints

- **Date:** 2026-11-17
- **Environment:** Local Docker Compose (`db`/`cache` services only), macOS, Docker Desktop
- **Engineer:** (session engineer)
- **Objective:** Confirm the backend's ESLint config and full Jest suite (including new
  `propertyImages.test.js`, mocked S3 calls) pass after adding image upload/auth routes.
- **Ticket / change ID:** N/A — feature development, pre-review

### Commands executed

\`\`\`bash
docker compose up -d db cache
# waited for both services to report "healthy" via `docker compose ps`

cd backend
npm run lint
PGHOST=localhost PGPORT=5433 PGUSER=estateflow PGPASSWORD=estateflow PGDATABASE=estateflow \
  REDIS_URL=redis://localhost:6379 npx jest --runInBand --testTimeout=30000
\`\`\`

### Expected results
`npm run lint` exits with no output and status 0. Jest reports all test suites passing,
including the new `propertyImages.test.js` (S3 client mocked via `aws-sdk-client-mock`, no
real AWS calls).

### Actual results
\`\`\`
> estateflow-backend@1.0.0 lint
> eslint src tests

PASS tests/propertyImages.test.js
PASS tests/properties.test.js

Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        0.879 s, estimated 1 s
Ran all test suites.
\`\`\`
Matched expectations exactly — no lint errors, 18/18 tests passed.

### Logs / screenshots
Terminal output captured above in full, not truncated or summarized from memory.

### Problems encountered
First attempt connected to the wrong local Postgres port (`5432` instead of the project's
`.env`-configured `5433`), producing `role "estateflow" does not exist` — caused by a stale
`.env` from a previous session using a non-default `POSTGRES_PORT`. Resolved by reading the
actual `.env` file's `POSTGRES_PORT` value before retrying, instead of assuming the default.

### Changes made
No production changes — this was local test execution only. Source changes being validated:
`backend/src/routes/properties.js`, `backend/src/middleware/{auth,upload}.js`,
`backend/src/{awsClients,s3Service}.js`, `backend/tests/propertyImages.test.js`.

### Verification
The second (corrected) command run above is the verification — passing test output with the
exact port.

### Rollback information
N/A — no infrastructure or data was changed; this was local, read-only test execution.

### Final conclusion
Succeeded. Backend lint and full test suite (18/18) passed against an ephemeral local
Postgres/Redis, confirming the new image-upload code paths work correctly without requiring
real AWS credentials.
```

## What makes this a good record

- The "Problems encountered" section is honest about a real mistake (wrong port) instead of
  only showing the clean final run — this is what makes a record actually useful to someone
  hitting the same issue later.
- "Actual results" is pasted output, not a paraphrase ("tests passed" alone would be much
  weaker evidence).
- It's explicit about what was *not* verified (no real AWS account was used) rather than
  implying broader coverage than what actually happened.
