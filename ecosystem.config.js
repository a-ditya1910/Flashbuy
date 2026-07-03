module.exports = {
  apps: [
    {
      name: 'order-service',
      cwd: './services/order-service',
      script: 'node',
      args: '--require ts-node/register src/index.ts',
      watch: false,
      env: {
        PORT: '4001',
        KAFKAJS_NO_PARTITIONER_WARNING: '1',
        DB_HOST: 'localhost',
        DB_PORT: '3308',
        DB_USER: 'root',
        DB_PASSWORD: 'root',
        DB_NAME: 'flashbuy',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6380',
        KAFKA_BROKER: 'localhost:9092',
        JWT_SECRET: 'flashbuy-super-secret-key-2026',
        ADMIN_SECRET: 'flashbuy-admin-2026'
      }
    },
    {
      name: 'payment-service',
      cwd: './services/payment-service',
      script: 'node',
      args: '--require ts-node/register src/index.ts',
      watch: false,
      env: {
        PORT: '4002',
        KAFKAJS_NO_PARTITIONER_WARNING: '1',
        DB_HOST: 'localhost',
        DB_PORT: '3308',
        DB_USER: 'root',
        DB_PASSWORD: 'root',
        DB_NAME: 'flashbuy',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6380',
        KAFKA_BROKER: 'localhost:9092',
        JWT_SECRET: 'flashbuy-super-secret-key-2026'
      }
    },
    {
      name: 'notification-service',
      cwd: './services/notification-service',
      script: 'node',
      args: '--require ts-node/register src/index.ts',
      watch: false,
      env: {
        PORT: '4003',
        KAFKAJS_NO_PARTITIONER_WARNING: '1',
        DB_HOST: 'localhost',
        DB_PORT: '3308',
        DB_USER: 'root',
        DB_PASSWORD: 'root',
        DB_NAME: 'flashbuy',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6380',
        KAFKA_BROKER: 'localhost:9092',
        JWT_SECRET: 'flashbuy-super-secret-key-2026'
      }
    }
  ]
}
