import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import notificationRoutes from './routes/notifications';

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.options('*', cors());
app.use(express.json());
app.use('/api/notifications', notificationRoutes);
app.get('/health', (_req, res) => res.json({ service: 'notification-service', status: 'ok' }));

async function start() {
  require('./kafka/paymentConsumer');  // start consuming payment-events
  app.listen(process.env.PORT || 4003, () =>
    console.log(`[notification-service] running on http://localhost:${process.env.PORT || 4003}`)
  );
}
start().catch(console.error);
