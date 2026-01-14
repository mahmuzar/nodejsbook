import { Kafka, EachMessagePayload, Message } from 'kafkajs';
import { NotificationEvent, DlqMessage } from '../types';

const KAFKA_BROKERS = ['localhost:9092'];
const CLIENT_ID = 'notification-consumer';
const GROUP_ID = 'notification-group';
const MAIN_TOPIC = 'user.notifications';
const DLQ_TOPIC = `${MAIN_TOPIC}.dlq`;
const MAX_RETRIES = 3;

const kafka = new Kafka({ clientId: CLIENT_ID, brokers: KAFKA_BROKERS });
const consumer = kafka.consumer({ groupId: GROUP_ID });
const dlqProducer = kafka.producer();

async function simulateNotification(event: NotificationEvent): Promise<void> {
  if (event.message.includes('fail')) {
    throw new Error('Simulated processing failure');
  }
  await new Promise(resolve => setTimeout(resolve, 800));
  console.log(`Sent to ${event.userId}: "${event.message}"`);
}

async function sendToDlq(
  originalTopic: string,
  partition: number,
  message: Message,
  error: Error,
  retryCount: number
): Promise<void> {
  const dlqMessage: DlqMessage = {
    originalTopic,
    partition,
    offset: message.offset,
    error: {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    },
    payload: message.value ? JSON.parse(message.value.toString()) : null,
    retryCount,
  };

  await dlqProducer.send({
    topic: DLQ_TOPIC,
    messages: [{ value: JSON.stringify(dlqMessage) }],
  });

  console.warn(`Sent to DLQ: ${error.message}`);
}

async function runConsumer(): Promise<void> {
  await dlqProducer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: MAIN_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      if (!message.value) return;

      let event: NotificationEvent;
      try {
        event = JSON.parse(message.value.toString());
      } catch (parseError) {
        await sendToDlq(topic, partition, message, parseError as Error, 0);
        return;
      }

      const retryCount = message.headers?.['x-retry-count']
        ? parseInt(message.headers['x-retry-count'].toString(), 10)
        : 0;

      try {
        await simulateNotification(event);
        console.log(`Processed ${event.eventId}`);
      } catch (err) {
        const error = err as Error;
        console.error(`Failed (attempt ${retryCount + 1}): ${error.message}`);

        if (retryCount >= MAX_RETRIES) {
          await sendToDlq(topic, partition, message, error, retryCount);
        } else {
          // Повторная отправка в основной топик
          await dlqProducer.send({
            topic: MAIN_TOPIC,
            messages: [{
              value: message.value,
              headers: { ...message.headers, 'x-retry-count': (retryCount + 1).toString() },
            }],
          });
          console.log(`Retrying (attempt ${retryCount + 1})`);
        }
      }
    },
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nStopping consumer...');
  await consumer.disconnect();
  await dlqProducer.disconnect();
  process.exit(0);
});

runConsumer().catch(console.error);