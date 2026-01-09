import express, { Application } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { config } from './config';
import { authenticateToken } from './middlewares/auth.middleware';

const app: Application = express();

app.use(express.json());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов с этого IP' }
});
app.use(limiter);

// Роуты
app.use('/auth', authRoutes);
app.use('/api', authenticateToken, userRoutes); // все /api — защищены

app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

export default app;