// src/consumer.ts
import { Kafka, EachMessagePayload } from 'kafkajs';
import { NotificationEvent } from './types';

const kafka = new Kafka({
  clientId: 'notification-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

async function simulateNotification(event: NotificationEvent): Promise<void> {
  // Имитация отправки уведомления
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`Sending "${event.message}" to user ${event.userId}`);
}

async function run(): Promise<void> {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user.notifications', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      if (!message.value) {
        console.warn('Received empty message');
        return;
      }

      const event: NotificationEvent = JSON.parse(message.value.toString());
      console.log(`Processing event ${event.eventId} from partition ${partition}`);

      try {
        await simulateNotification(event);
        console.log(`Processed event ${event.eventId}`);
      } catch (err) {
        console.error(`Failed to process event ${event.eventId}:`, (err as Error).message);
        // Бросаем ошибку → offset не коммитится → Kafka повторит сообщение
        throw err;
      }
    },
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down consumer...');
  await consumer.disconnect();
  process.exit(0);
});

run().catch(console.error);