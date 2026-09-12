import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';

const config = env();
const app = createApp(config.clientUrl);

connectDatabase(config.mongoUri)
  .then(() => app.listen(config.port, () => console.log(`API listening on ${config.port}`)))
  .catch((error) => { console.error('Unable to start API:', error); process.exit(1); });
