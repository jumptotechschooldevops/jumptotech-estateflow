const { S3Client } = require('@aws-sdk/client-s3');

// Credentials are never read from app config here — the SDK's default
// credential provider chain resolves them (IRSA env vars + web identity
// token file inside EKS, or a local `aws configure` profile for dev).
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

module.exports = { s3Client, S3_BUCKET_NAME };
