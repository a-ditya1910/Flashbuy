/**
 * Subscribes to payment-events.
 * Inserts a notification row + increments Redis unread counter per user.
 */
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();
import pool from '../db/mysql';
import redis from '../db/redis';

const kafka = new Kafka({ clientId: 'notification-payment-handler', brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'notification-processor' });

async function run() {
  await consumer.connect();
  console.log('[notification-service] payment consumer connected');
  await consumer.subscribe({ topic: 'payment-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const { type, orderId, userId, productName, amount, failedReason } = JSON.parse(message.value.toString());

      let msg = '';
      if (type === 'payment.success') {
        msg = `Payment of ₹${Number(amount).toLocaleString('en-IN')} confirmed! Your ${productName} order is being processed.`;
      } else if (type === 'payment.failed') {
        msg = `Payment failed for ${productName}. Reason: ${failedReason || 'Unknown'}. No charge was made.`;
      } else return;

      await pool.execute(
        `INSERT INTO notifications (user_id, order_id, type, message) VALUES (?, ?, ?, ?)`,
        [userId, orderId, type, msg]
      );

      // increment Redis unread counter — frontend reads this for bell badge
      await redis.incr(`notif:unread:${userId}`);
      console.log(`[notification-service] notified user ${userId}: ${type}`);
    },
  });
}

run().catch(console.error);
