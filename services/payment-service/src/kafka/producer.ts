import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({ clientId: 'payment-service', brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] });
const producer = kafka.producer();
let connected = false;

export async function connectProducer() {
  if (!connected) { await producer.connect(); connected = true; console.log('[payment-service] Kafka producer connected'); }
}

export async function publishPaymentResult(payload: {
  type: 'payment.success' | 'payment.failed';
  orderId: string; userId: number; saleId: number;
  productId: number; productName: string; amount: number;
  transactionId?: string; failedReason?: string;
}) {
  await producer.send({
    topic: 'payment-events',
    messages: [{ key: payload.orderId, value: JSON.stringify(payload) }],
  });
}
