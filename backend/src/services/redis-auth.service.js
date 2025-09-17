import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { Queue, Worker } from "bullmq";

const JWT_SECRET = process.env.JWT_SECRET ||`default_jwt_secret`;
const REDIS_URL = process.env.REDIS_URL;

const redis = new Redis(REDIS_URL);
const connection = new Redis(REDIS_URL,{
  maxRetriesPerRequest: null, 
  enableReadyCheck: false      
});

const TOKEN_EXPIRY = 7 * 24 * 60 * 60;

const authQueue = new Queue('auth-operations', { connection });

const authWorker = new Worker('auth-operations', async (job) => {
  const { type, data } = job.data;
  
  try {
    switch (type) {
      case 'store_token':
        await redis.setex(`auth_token:${data.userId}`, TOKEN_EXPIRY, data.token);
        break;
        
      case 'revoke_token':
        await redis.del(`auth_token:${data.userId}`);
        break;

      default:
        throw new Error(`Unknown auth operation: ${type}`);
    }
  } catch (error) {
    console.error(`Auth worker error for ${type}:`, error);
    throw error;
  }
}, { connection });

export const generateAuthCookie = async (userId, phoneNumber) => {
  const payload = {
    userId,
    phoneNumber,
    isAuthenticated: true,
    timestamp: Date.now()
  };
  
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  
  await authQueue.add('store_token', {
    type: 'store_token',
    data: { userId, token }
  });
  
  return token;
};

export const validateAuthToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const redisKey = `auth_token:${decoded.userId}`;
    
    const storedToken = await redis.get(redisKey);
    
    if (!storedToken || storedToken !== token) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

export const revokeAuthToken = async (userId) => {
  await authQueue.add('revoke_token', {
    type: 'revoke_token',
    data: { userId }
  });
};


process.on('SIGINT', async () => {
  await authWorker.close();
  await authQueue.close();
  await connection.quit();
  await redis.quit();
});