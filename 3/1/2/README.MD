Полный перевод микросервиса с асинхронной обработкой через Kafka на Node.js на TypeScript, включая типизацию, структуру проекта и рекомендации по сборке.
____
## Содержание

1. [Структура проекта](#--Структура-проекта)
2. [Установка зависимостей](#-Установка-зависимостей)
3. [tsconfig.json](#-tsconfigjson)
4. [src/types.ts — типы событий](#-srctypests--типы-событий)
5. [src/server.ts — HTTP API (Producer)](#-srcserverts--HTTP-API-producer)
6. [src/consumer.ts — Worker](#-srcconsumerts--Worker)
7. [Обновление package.json — скрипты](#-Обновление-packagejson--скрипты)
8. [Запуск в режиме разработки](#-Запуск-в-режиме-разработки)
8. [Тест](#-Тест)

## [↑](#Содержание) 📁 Структура проекта

```csv
kafka-microservice/
├── src/
│   ├── types.ts
│   ├── producer.ts
│   ├── consumer.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── docker-compose.yml  (остаётся без изменений)
```

## [↑](#Содержание) Установка зависимостей

```bash
npm init -y
npm install kafkajs express
npm install -D typescript ts-node @types/express @types/node
```

## [↑](#Содержание) tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## [↑](#Содержание) src/types.ts — типы событий

```ts
export interface NotificationEvent {
  userId: string;
  message: string;
  timestamp: number;
  eventId: string;
}
```

## [↑](#Содержание) src/server.ts — HTTP API (Producer)

```ts
// src/server.ts
import express, { Request, Response } from 'express';
import { Kafka } from 'kafkajs';
import { NotificationEvent } from './types';

const app = express();
app.use(express.json());

// Kafka setup
const kafka = new Kafka({
  clientId: 'notification-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

// Подключаем продюсера при старте
producer.connect().catch(console.error);

// Эндпоинт для отправки уведомления
app.post('/notify', async (req: Request, res: Response) => {
  const { userId, message }: { userId?: string; message?: string } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  const event: NotificationEvent = {
    userId,
    message,
    timestamp: Date.now(),
    eventId: Math.random().toString(36).substring(2, 15),
  };

  try {
    await producer.send({
      topic: 'user.notifications',
      messages: [{ value: JSON.stringify(event) }],
    });

    console.log('Sent event:', event.eventId);
    return res.status(202).json({ status: 'accepted', eventId: event.eventId });
  } catch (err) {
    console.error('Failed to send to Kafka:', err);
    return res.status(500).json({ error: 'Failed to queue notification' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Producer API running on http://localhost:${PORT}`);
});
```

## [↑](#Содержание) src/consumer.ts — Worker

```ts
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
```

## [↑](#Содержание) Обновление package.json — скрипты

```json
{
  "scripts": {
    "build": "tsc",
    "start:producer": "ts-node src/server.ts",
    "start:consumer": "ts-node src/consumer.ts",
    "prod:producer": "node dist/server.js",
    "prod:consumer": "node dist/consumer.js"
  }
}
```

## [↑](#Содержание) Запуск в режиме разработки

```bash
# Терминал 1
npm run start:producer

# Терминал 2
npm run start:consumer
```

## [↑](#Содержание) Тест:

```bash
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{"userId": "murad", "message": "Привет из TypeScript!"}'
```