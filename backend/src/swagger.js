const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json');

module.exports = function setupSwagger(app) {
  if (process.env.ENABLE_SWAGGER !== 'true') {
    return;
  }

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
  );

  app.get('/api/openapi.json', (req, res) => {
    res.json(swaggerDocument);
  });
};
