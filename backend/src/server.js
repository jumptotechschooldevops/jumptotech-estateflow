const express = require('express');
const cors = require('cors');
const { checkConnection } = require('./db');
const { ping, connect } = require('./redisClient');
const propertiesRouter = require('./routes/properties');
const setupSwagger = require('./swagger');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Swagger API Documentation
setupSwagger(app);

// Application Health Check
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    db: 'down',
    redis: 'down'
  };

  try {
    await checkConnection();
    health.db = 'up';
  } catch (err) {
    health.status = 'degraded';
    health.dbError = err.message;
  }

  try {
    await ping();
    health.redis = 'up';
  } catch (err) {
    health.status = 'degraded';
    health.redisError = err.message;
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// Property API Routes
app.use('/api/properties', propertiesRouter);

// Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Application
if (require.main === module) {
  connect().finally(() => {
    app.listen(PORT, () => {
      console.log(`EstateFlow backend listening on port ${PORT}`);
    });
  });
}

module.exports = app;
