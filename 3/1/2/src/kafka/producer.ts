import { Kafka, Producer } from 'kafkajs';
import { NotificationEvent } from '../types';

const KAFKA_BROKERS = ['localhost:9092'];
const CLIENT_ID = 'notification-service-producer';
const NOTIFICATION_TOPIC = 'user.notifications';

let kafkaProducer: Producer | null = null;

async function getKafkaProducer(): Promise<Producer> {
  if (!kafkaProducer) {
    const kafka = new Kafka({ clientId: CLIENT_ID, brokers: KAFKA_BROKERS });
    kafkaProducer = kafka.producer();
    await kafkaProducer.connect();
    console.log('Kafka producer connected');
  }
  return kafkaProducer;
}

export async function sendNotificationToKafka(userId: string, message: string): Promise<string> {
  const producer = await getKafkaProducer();

  const event: NotificationEvent = {
    userId,
    message,
    timestamp: Date.now(),
    eventId: Math.random().toString(36).substring(2, 15),
  };

  await producer.send({
    topic: NOTIFICATION_TOPIC,
    messages: [{ key: userId, value: JSON.stringify(event) }],
  });

  console.log(`Event ${event.eventId} sent to "${NOTIFICATION_TOPIC}"`);
  return event.eventId;
}

export async function disconnectKafkaProducer(): Promise<void> {
  if (kafkaProducer) {
    await kafkaProducer.disconnect();
    kafkaProducer = null;
    console.log('Kafka producer disconnected');
  }
}