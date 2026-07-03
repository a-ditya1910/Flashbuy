import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  ssl: !!process.env.KAFKA_USERNAME,
  sasl: process.env.KAFKA_USERNAME ? {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD!,
  } : undefined,
});
const producer = kafka.producer();
let connected = false;

export async function connectProducer() {
  if (!connected) { await producer.connect(); connected = true; console.log('[order-service] Kafka producer connected'); }
}

export async function publishOrderPlaced(payload: {
  orderId: string; userId: number; saleId: number;
  productId: number; productName: string; amount: number;
}) {
  await producer.send({
    topic: 'order-events',
    messages: [{ key: payload.orderId, value: JSON.stringify({ type: 'order.placed', ...payload }) }],
  });
}
