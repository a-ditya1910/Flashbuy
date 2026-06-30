import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { connectProducer } from './kafka/producer';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import saleRoutes from './routes/sales';
import orderRoutes from './routes/orders';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/orders', orderRoutes);
app.get('/health', (_req, res) => res.json({ service: 'order-service', status: 'ok' }));

async function start() {
  await connectProducer();

  // start payment event consumer in same process
  require('./kafka/paymentConsumer');

  app.listen(process.env.PORT || 4001, () =>
    console.log(`[order-service] running on http://localhost:${process.env.PORT || 4001}`)
  );
}
start().catch(console.error);
