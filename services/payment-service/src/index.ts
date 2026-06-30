import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { connectProducer } from './kafka/producer';
import paymentRoutes from './routes/payments';
import invoiceRoutes from './routes/invoice';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/payment', paymentRoutes);
app.use('/api/invoice', invoiceRoutes);
app.get('/health', (_req, res) => res.json({ service: 'payment-service', status: 'ok' }));

async function start() {
  await connectProducer();
  require('./kafka/orderConsumer');  // start consuming order-events
  app.listen(process.env.PORT || 4002, () =>
    console.log(`[payment-service] running on http://localhost:${process.env.PORT || 4002}`)
  );
}
start().catch(console.error);
