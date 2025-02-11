import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
dotenv.config();

let redisClient: RedisClientType = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined, // Your custom port
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    connectTimeout: 10000,
  },
});

redisClient.on("error", (err) => {
  console.error("Redis client error", err);
});

redisClient.connect();

export default redisClient;
