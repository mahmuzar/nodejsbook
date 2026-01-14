import { createApp } from './app';
import { disconnectKafkaProducer } from './kafka/producer';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function bootstrap() {
  const app = createApp();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await disconnectKafkaProducer();
    process.exit(0);
  });

  app.listen(PORT, () => {
    console.log(`Notification API running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});