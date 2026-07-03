/**
 * Subscribes to order-events.
 * order.placed → simulate payment → publish payment.success or payment.failed
 */
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/mysql';
import redis from '../db/redis';
import { publishPaymentResult } from './producer';

const kafka = new Kafka({
  clientId: 'payment-order-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  ssl: !!process.env.KAFKA_USERNAME,
  sasl: process.env.KAFKA_USERNAME ? {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD!,
  } : undefined,
});
const consumer = kafka.consumer({ groupId: 'payment-processor' });

async function run() {
  await consumer.connect();
  console.log('[payment-service] order consumer connected');
  await consumer.subscribe({ topic: 'order-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());
      if (event.type !== 'order.placed') return;

      const { orderId, userId, saleId, productId, productName, amount } = event;

      // Redis idempotency lock — prevents double-charging if Kafka retries
      const lockKey = `payment:lock:${orderId}`;
      const acquired = await redis.set(lockKey, '1', 'EX', 300, 'NX');
      if (!acquired) {
        console.log(`[payment-service] duplicate event for ${orderId}, skipping`);
        return;
      }

      const paymentId = uuidv4();
      await pool.execute(
        `INSERT IGNORE INTO payments (id, order_id, user_id, amount, status, product_name) VALUES (?, ?, ?, ?, 'processing', ?)`,
        [paymentId, orderId, userId, amount, productName]
      );

      // simulate payment processing delay (1–2s)
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

      // 90% success rate
      const success = Math.random() < 0.9;
      const transactionId = success ? `txn_${uuidv4().slice(0, 12)}` : null;
      const status = success ? 'success' : 'failed';
      const failedReason = success ? null : 'Insufficient funds';

      await pool.execute(
        `UPDATE payments SET status = ?, transaction_id = ?, failed_reason = ?, updated_at = NOW() WHERE id = ?`,
        [status, transactionId, failedReason, paymentId]
      );

      await publishPaymentResult({
        type: `payment.${status}` as 'payment.success' | 'payment.failed',
        orderId, userId, saleId, productId, productName, amount,
        transactionId: transactionId || undefined,
        failedReason: failedReason || undefined,
      });

      console.log(`[payment-service] ${orderId} → ${status}`);
    },
  });
}

run().catch(console.error);
