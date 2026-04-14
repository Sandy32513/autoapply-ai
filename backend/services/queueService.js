const Queue = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const USE_REDIS = process.env.USE_REDIS === 'true';

let applicationQueue;
let isRedisAvailable = false;
let isInitialized = false;

const initQueue = async () => {
  if (isInitialized) return;
  
  if (USE_REDIS || (!USE_REDIS && process.env.NODE_ENV === 'production')) {
    try {
      applicationQueue = new Queue('apply-queue', REDIS_URL, {
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      applicationQueue.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed:`, err.message);
      });

      applicationQueue.on('completed', (job, result) => {
        console.log(`Job ${job.id} completed successfully`);
      });

      applicationQueue.on('error', (err) => {
        console.error('Queue connection error:', err.message);
        isRedisAvailable = false;
      });

      isRedisAvailable = true;
      console.log('Queue connected to Redis');
      isInitialized = true;
      return;
    } catch (error) {
      console.warn('Failed to connect to Redis:', error.message);
    }
  }
  
  console.log('Using in-memory queue (development mode)');
  isRedisAvailable = false;
  isInitialized = true;
};

const MemoryQueue = class {
  constructor() {
    this.jobs = new Map();
    this.nextId = 1;
    this.processing = new Map();
  }

  async add(data, options) {
    const id = String(this.nextId++);
    const job = {
      id,
      data,
      opts: options,
      status: 'waiting',
      createdAt: Date.now(),
    };
    
    this.jobs.set(id, job);
    
    setTimeout(() => {
      job.status = 'completed';
      job.finishedAt = Date.now();
      this.emit('completed', job, { success: true });
    }, 100);
    
    return job;
  }

  async getJobCounts() {
    let waiting = 0, active = 0, completed = 0, failed = 0;
    
    for (const [id, job] of this.jobs) {
      if (job.status === 'waiting') waiting++;
      else if (job.status === 'active') active++;
      else if (job.status === 'completed') completed++;
      else if (job.status === 'failed') failed++;
    }
    
    return { waiting, active, completed, failed };
  }

  async getJob(id) {
    return this.jobs.get(id);
  }

  async remove(id) {
    this.jobs.delete(id);
  }
};

const { EventEmitter } = require('events');

let memoryQueueInstance;

try {
  initQueue().catch(console.error);
} catch (error) {
  console.warn('Queue initialization error:', error.message);
  memoryQueueInstance = new MemoryQueue();
}

const addApplicationJob = async (applicationId, jobUrl, resumeData) => {
  if (!isInitialized) {
    await initQueue();
  }
  
  const queue = isRedisAvailable ? applicationQueue : (memoryQueueInstance || new MemoryQueue());
  
  if (!queue) {
    throw new Error('Queue not initialized');
  }
  
  try {
    const job = await queue.add({
      applicationId,
      jobUrl,
      resumeData,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`Job added to queue: ${job.id} (Redis: ${isRedisAvailable})`);
    return job;
  } catch (error) {
    console.error('Failed to add job to queue:', error);
    throw error;
  }
};

const getQueueStatus = async () => {
  try {
    if (!isInitialized) {
      await initQueue();
    }
    
    if (!isRedisAvailable && !memoryQueueInstance) {
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
    
    const queue = isRedisAvailable ? applicationQueue : memoryQueueInstance;
    const counts = await queue.getJobCounts();
    
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      mode: isRedisAvailable ? 'redis' : 'memory',
    };
  } catch (error) {
    console.error('Queue status error:', error.message);
    return { waiting: 0, active: 0, completed: 0, failed: 0, mode: 'error' };
  }
};

module.exports = { 
  applicationQueue, 
  addApplicationJob,
  getQueueStatus 
};