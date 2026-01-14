import express, { Request, Response } from 'express';
import { sendNotificationToKafka } from './kafka/producer';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.post('/notify', async (req: Request, res: Response) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    try {
      const eventId = await sendNotificationToKafka(userId, message);
      return res.status(202).json({ status: 'accepted', eventId });
    } catch (err) {
      console.error('Failed to send notification:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
}