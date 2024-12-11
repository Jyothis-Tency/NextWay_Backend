import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379, // Your custom port
  },
});

redisClient.on("error", (err) => {
  console.error("Redis client error", err);
});

redisClient.connect();

export default redisClient;
