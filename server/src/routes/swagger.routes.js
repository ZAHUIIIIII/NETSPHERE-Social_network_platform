// server/src/routes/swagger.routes.js
import express from 'express';
import { swaggerUi, swaggerSpec } from '../swagger.js';

const router = express.Router();

// Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NETSPHERE API Documentation',
}));

// Swagger JSON endpoint
router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;
