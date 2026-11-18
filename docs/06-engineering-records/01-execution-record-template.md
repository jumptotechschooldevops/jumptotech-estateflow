# 01 · Execution Record Template

**Prerequisites:** [README · why this exists](README.md)
**Next step:** [02 · Worked example](02-worked-example-execution-record.md)

Copy this block for any task worth recording.

```markdown
## Execution Record — <short title>

- **Date:**
- **Environment:** (local Docker Compose / lab EKS namespace / etc — be specific)
- **Engineer:**
- **Objective:** <what you're trying to accomplish, in one sentence>
- **Ticket / change ID:** (or "N/A — practice exercise")

### Commands executed

```bash
<paste the exact commands, in the exact order run>
```

### Expected results
<write this BEFORE running the commands>

### Actual results
<paste real output, or a faithful summary of it — never invented>

### Logs / screenshots
<links or pasted excerpts>

### Problems encountered
<anything that didn't go as expected, even if eventually resolved>

### Changes made
<anything that changed state — a deploy, a config edit, a scale action>

### Verification
<the specific command(s)/check(s) that confirm success>

### Rollback information
<how to undo this, if applicable — or "N/A, read-only">

### Final conclusion
<succeeded / partially succeeded / failed, and why>
```
