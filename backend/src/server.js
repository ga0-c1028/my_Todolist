const app = require('./app');
require('./config/db');
const { getEnv } = require('./config/env');

if (require.main === module) {
  const { port } = getEnv();
  app.listen(port, () => console.log(`server listening on port ${port}`));
}

module.exports = app;
