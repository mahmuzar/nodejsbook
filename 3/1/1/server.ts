import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`🔐 Auth microservice запущен на порту ${config.port}`);
});