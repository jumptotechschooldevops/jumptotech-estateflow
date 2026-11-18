# 06 · Terraform Questions

**Prerequisites:** [05 · Kubernetes questions](05-kubernetes-questions.md)
**Next step:** [07 · GitHub Actions questions](07-github-actions-questions.md)

> **Honesty note:** this project provisions S3/IAM via AWS CLI commands and plain JSON policy
> documents (`infra/iam/`, `infra/s3/`), not Terraform — there is no `.tf` file anywhere in
> this repo. Be upfront about that in an interview rather than implying otherwise; the
> concepts below are still worth knowing and are commonly asked about regardless.

**Q: Why might a team choose Terraform over AWS CLI scripts, and why might a team (like this
lab) choose CLI/JSON instead?**
A: Terraform tracks state, so it knows what it created and can plan/diff before applying a
change — much safer for ongoing, team-managed infrastructure. For a one-time teaching lab with
a handful of resources and no ongoing drift-management need, plain CLI commands plus
documented JSON policies are simpler to read line-by-line without needing to learn HCL first
— an explicit trade-off of simplicity for teaching over the operational safety Terraform
would add at scale.

**Q: What would the S3 bucket in `infra/s3/` look like as Terraform, roughly?**
A:
```hcl
resource "aws_s3_bucket" "property_images" {
  bucket = "estateflow-staging-property-images"
}

resource "aws_s3_bucket_public_access_block" "property_images" {
  bucket                  = aws_s3_bucket.property_images.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "property_images" {
  bucket = aws_s3_bucket.property_images.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```
This directly mirrors `infra/s3/public-access-block.json` and the encryption command in
`infra/s3/README.md` — same intent, declarative instead of imperative.

**Q: What is Terraform state, and why is losing it a real problem?**
A: State is Terraform's record of what it created and the mapping between your config and
real resource IDs. Lose it, and Terraform no longer knows what exists — it might try to
recreate resources that already exist (causing conflicts) or lose track of things it should
be managing. This is why real teams store state remotely (S3 + DynamoDB locking, or Terraform
Cloud) rather than as a local file.

**Q: What's the difference between `terraform plan` and `terraform apply`?**
A: `plan` computes and shows what *would* change, without changing anything — the equivalent
discipline this project applies by never running a mutating AWS/kubectl command without
reviewing it first. `apply` actually makes the change. Never run `apply` without having
reviewed a `plan` first, especially against shared/production state.

**Q: If you migrated this project's S3/IAM setup to Terraform, what would you want to be
careful about?**
A: Importing the *existing* resources into Terraform state (`terraform import`) rather than
letting Terraform try to create duplicates of things that already exist — and testing the
import/plan against a lab account first, since a wrong import can make Terraform think it
should destroy and recreate a resource that's actually fine as-is.
