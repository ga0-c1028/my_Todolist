const express = require('express');
const cors = require('cors');
const { getEnv } = require('./config/env');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: getEnv().corsOrigin }));
app.use(express.json());
app.use(requestLogger);

if (getEnv().nodeEnv !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = require('../swagger.json');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[app] Swagger UI 활성화: /api-docs (NODE_ENV=' + getEnv().nodeEnv + ')');
}

app.use('/api', require('./routes'));
app.use(errorHandler);

module.exports = app;
