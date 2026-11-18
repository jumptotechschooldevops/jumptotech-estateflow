const crypto = require('crypto');
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, S3_BUCKET_NAME } = require('./awsClients');

const PRESIGNED_URL_TTL_SECONDS = 300;

const EXTENSION_BY_MIME_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function buildObjectKey(propertyId, mimeType) {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType] || 'bin';
  return `properties/${propertyId}/${crypto.randomUUID()}.${extension}`;
}

async function uploadImage({ propertyId, buffer, mimeType }) {
  const objectKey = buildObjectKey(propertyId, mimeType);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: objectKey,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    })
  );
  return objectKey;
}

async function deleteImage(objectKey) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: objectKey }));
}

async function getPresignedUrl(objectKey) {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: objectKey });
  return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_URL_TTL_SECONDS });
}

module.exports = { uploadImage, deleteImage, getPresignedUrl, EXTENSION_BY_MIME_TYPE };
