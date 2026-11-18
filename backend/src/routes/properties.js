const express = require('express');
const { pool } = require('../db');
const { getCache, setCache, deleteCache } = require('../redisClient');
const { requireAdminAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadImage, deleteImage, getPresignedUrl } = require('../s3Service');

const router = express.Router();

const LIST_CACHE_KEY = 'properties:all';
const itemCacheKey = (id) => `properties:${id}`;
const LIST_TTL_SECONDS = 30;
const ITEM_TTL_SECONDS = 60;

function isValidProperty(body) {
  return (
    typeof body.title === 'string' &&
    body.title.trim().length > 0 &&
    typeof body.price === 'number' &&
    body.price >= 0
  );
}

// Presigned URLs expire quickly and must never be cached — this always
// hits Postgres for the image rows and generates fresh URLs on every call.
async function attachImages(property) {
  const { rows } = await pool.query(
    'SELECT id, object_key, content_type, created_at FROM property_images WHERE property_id = $1 ORDER BY id',
    [property.id]
  );
  const images = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      url: await getPresignedUrl(row.object_key),
      contentType: row.content_type,
      createdAt: row.created_at,
    }))
  );
  return { ...property, images };
}

function handleUploadMiddleware(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

// GET /api/properties
router.get('/', async (req, res, next) => {
  try {
    let rows = await getCache(LIST_CACHE_KEY);
    if (rows) {
      res.set('X-Cache', 'HIT');
    } else {
      const result = await pool.query(
        'SELECT id, title, description, price, address, bedrooms, bathrooms, created_at FROM properties ORDER BY id'
      );
      rows = result.rows;
      await setCache(LIST_CACHE_KEY, rows, LIST_TTL_SECONDS);
      res.set('X-Cache', 'MISS');
    }

    const withImages = await Promise.all(rows.map(attachImages));
    res.json(withImages);
  } catch (err) {
    next(err);
  }
});

// GET /api/properties/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let property = await getCache(itemCacheKey(id));
    if (property) {
      res.set('X-Cache', 'HIT');
    } else {
      const { rows } = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }
      property = rows[0];
      await setCache(itemCacheKey(id), property, ITEM_TTL_SECONDS);
      res.set('X-Cache', 'MISS');
    }

    res.json(await attachImages(property));
  } catch (err) {
    next(err);
  }
});

// POST /api/properties
router.post('/', requireAdminAuth, async (req, res, next) => {
  try {
    if (!isValidProperty(req.body)) {
      return res.status(400).json({ error: 'title (string) and price (number) are required' });
    }
    const { title, description = null, price, address = null, bedrooms = null, bathrooms = null } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO properties (title, description, price, address, bedrooms, bathrooms)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, price, address, bedrooms, bathrooms]
    );
    await deleteCache(LIST_CACHE_KEY);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/properties/:id
router.put('/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidProperty(req.body)) {
      return res.status(400).json({ error: 'title (string) and price (number) are required' });
    }
    const { title, description = null, price, address = null, bedrooms = null, bathrooms = null } = req.body;
    const { rows } = await pool.query(
      `UPDATE properties SET title = $1, description = $2, price = $3, address = $4,
         bedrooms = $5, bathrooms = $6 WHERE id = $7 RETURNING *`,
      [title, description, price, address, bedrooms, bathrooms, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    await deleteCache(LIST_CACHE_KEY, itemCacheKey(id));
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/properties/:id
router.delete('/:id', requireAdminAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: imageRows } = await pool.query(
      'SELECT object_key FROM property_images WHERE property_id = $1',
      [id]
    );

    const { rowCount } = await pool.query('DELETE FROM properties WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // property_images rows cascade-delete in Postgres; clean up the
    // matching S3 objects too so the bucket doesn't accumulate orphans.
    await Promise.all(imageRows.map((row) => deleteImage(row.object_key)));

    await deleteCache(LIST_CACHE_KEY, itemCacheKey(id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/properties/:id/images
router.get('/:id/images', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT id FROM properties WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const { images } = await attachImages({ id: Number(id) });
    res.json(images);
  } catch (err) {
    next(err);
  }
});

// POST /api/properties/:id/images
router.post('/:id/images', requireAdminAuth, handleUploadMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'An "image" file field is required' });
    }

    const { rows: propertyRows } = await pool.query('SELECT id FROM properties WHERE id = $1', [id]);
    if (propertyRows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const objectKey = await uploadImage({
      propertyId: id,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    const { rows } = await pool.query(
      `INSERT INTO property_images (property_id, object_key, content_type, size_bytes)
       VALUES ($1, $2, $3, $4) RETURNING id, object_key, content_type, size_bytes, created_at`,
      [id, objectKey, req.file.mimetype, req.file.size]
    );

    const row = rows[0];
    res.status(201).json({
      id: row.id,
      url: await getPresignedUrl(row.object_key),
      contentType: row.content_type,
      createdAt: row.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/properties/:id/images/:imageId
router.delete('/:id/images/:imageId', requireAdminAuth, async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM property_images WHERE id = $1 AND property_id = $2 RETURNING object_key',
      [imageId, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    await deleteImage(rows[0].object_key);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
