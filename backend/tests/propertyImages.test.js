const request = require('supertest');
const { mockClient } = require('aws-sdk-client-mock');
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

// getSignedUrl() signs requests directly from the client's resolved credentials — it never
// calls client.send(), so mocking the S3 client alone (below) doesn't cover it. Without this,
// generating a presigned URL in a test tries to resolve real AWS credentials and fails with
// CredentialsProviderError anywhere those aren't configured (e.g. a clean CI runner).
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://example-bucket.s3.amazonaws.com/mock-presigned-url'),
}));

process.env.ADMIN_API_TOKEN = 'test-admin-token';
process.env.S3_BUCKET_NAME = 'estateflow-test-bucket';

const app = require('../src/server');
const { pool } = require('../src/db');
const { client: redisClient, connect: redisConnect } = require('../src/redisClient');
const { s3Client } = require('../src/awsClients');

const s3Mock = mockClient(s3Client);
const AUTH_HEADER = { Authorization: `Bearer ${process.env.ADMIN_API_TOKEN}` };

let propertyId;

beforeAll(async () => {
  await redisConnect();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(12, 2) NOT NULL,
      address VARCHAR(255),
      bedrooms SMALLINT,
      bathrooms SMALLINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS property_images (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      object_key VARCHAR(512) NOT NULL UNIQUE,
      content_type VARCHAR(100) NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query('TRUNCATE property_images, properties RESTART IDENTITY CASCADE');
  await redisClient.flushAll();

  const { rows } = await pool.query(
    `INSERT INTO properties (title, price) VALUES ('Image Test House', 123000) RETURNING id`
  );
  propertyId = rows[0].id;
});

afterEach(() => {
  s3Mock.reset();
});

afterAll(async () => {
  await pool.end();
  if (redisClient.isOpen) await redisClient.quit();
});

describe('POST /api/properties/:id/images', () => {
  it('rejects uploads without an admin token', async () => {
    const res = await request(app)
      .post(`/api/properties/${propertyId}/images`)
      .attach('image', Buffer.from('fake-image-bytes'), { filename: 'house.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(401);
  });

  it('uploads an image, stores metadata, and returns a presigned URL', async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    s3Mock.on(GetObjectCommand).resolves({});

    const res = await request(app)
      .post(`/api/properties/${propertyId}/images`)
      .set(AUTH_HEADER)
      .attach('image', Buffer.from('fake-image-bytes'), { filename: 'house.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.contentType).toBe('image/jpeg');
    expect(typeof res.body.url).toBe('string');
    expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(1);
  });

  it('rejects a disallowed file type', async () => {
    const res = await request(app)
      .post(`/api/properties/${propertyId}/images`)
      .set(AUTH_HEADER)
      .attach('image', Buffer.from('not-an-image'), { filename: 'note.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a missing property', async () => {
    const res = await request(app)
      .post('/api/properties/999999/images')
      .set(AUTH_HEADER)
      .attach('image', Buffer.from('fake-image-bytes'), { filename: 'house.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/properties/:id/images', () => {
  it('lists images with fresh presigned URLs', async () => {
    s3Mock.on(GetObjectCommand).resolves({});
    const res = await request(app).get(`/api/properties/${propertyId}/images`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(typeof res.body[0].url).toBe('string');
  });
});

describe('DELETE /api/properties/:id/images/:imageId', () => {
  it('requires an admin token', async () => {
    const { rows } = await pool.query('SELECT id FROM property_images LIMIT 1');
    const res = await request(app).delete(`/api/properties/${propertyId}/images/${rows[0].id}`);
    expect(res.status).toBe(401);
  });

  it('deletes the image row and the S3 object', async () => {
    s3Mock.on(DeleteObjectCommand).resolves({});
    const { rows } = await pool.query('SELECT id FROM property_images LIMIT 1');

    const res = await request(app)
      .delete(`/api/properties/${propertyId}/images/${rows[0].id}`)
      .set(AUTH_HEADER);
    expect(res.status).toBe(204);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
  });
});

describe('DELETE /api/properties/:id', () => {
  it('cleans up remaining S3 objects when the property is deleted', async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    s3Mock.on(GetObjectCommand).resolves({});
    await request(app)
      .post(`/api/properties/${propertyId}/images`)
      .set(AUTH_HEADER)
      .attach('image', Buffer.from('fake-image-bytes'), { filename: 'house2.jpg', contentType: 'image/jpeg' });

    s3Mock.on(DeleteObjectCommand).resolves({});
    const res = await request(app).delete(`/api/properties/${propertyId}`).set(AUTH_HEADER);
    expect(res.status).toBe(204);
    expect(s3Mock.commandCalls(DeleteObjectCommand).length).toBeGreaterThanOrEqual(1);
  });
});
