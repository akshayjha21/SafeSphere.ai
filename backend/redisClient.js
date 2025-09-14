import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis client connecting...'));
redisClient.on('ready', () => console.log('Redis client connected and ready to use'));

// Connect once immediately
(async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (error) {
      console.error('Could not connect to Redis:', error);
    }
  }
})();

export default redisClient;
