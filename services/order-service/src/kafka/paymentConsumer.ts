/**
 * Subscribes to payment-events.
 * payment.success → mark order confirmed
 * payment.failed  → mark order failed + give inventory slot back to Redis
 */
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();
import pool from '../db/mysql';
import redis from '../db/redis';

const kafka = new Kafka({
  clientId: 'order-payment-handler',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  ssl: !!process.env.KAFKA_USERNAME,
  sasl: process.env.KAFKA_USERNAME ? {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD!,
  } : undefined,
});
const consumer = kafka.consumer({ groupId: 'order-payment-handler' });

async function run() {
  await consumer.connect();
  console.log('[order-service] payment consumer connected');
  await consumer.subscribe({ topic: 'payment-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());
      const { type, orderId, saleId } = event;

      if (type === 'payment.success') {
        await pool.execute(
          `UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = ? AND status = 'pending'`,
          [orderId]
        );
        console.log(`[order-service] order ${orderId} confirmed`);
      }

      if (type === 'payment.failed') {
        await pool.execute(
          `UPDATE orders SET status = 'failed', updated_at = NOW() WHERE id = ? AND status = 'pending'`,
          [orderId]
        );
        // compensating transaction — give the inventory slot back
        if (saleId) await redis.incr(`sale:${saleId}:inventory`);
        console.log(`[order-service] order ${orderId} failed — inventory restored`);
      }
    },
  });
}

run().catch(console.error);
