const Queue = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let applicationQueue;

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

  console.log('Queue connected to Redis');
} catch (error) {
  console.warn('Redis not available, using memory queue fallback');
  
  const { EventEmitter } = require('events');
  class MemoryQueue extends EventEmitter {
    constructor() {
      super();
      this.jobs = [];
    }
    async add(data, options) {
      const job = { id: Date.now().toString(), data, opts: options };
      this.jobs.push(job);
      setTimeout(() => this.emit('completed', job, { success: true }), 100);
      return job;
    }
    async process() {}
  }
  
  applicationQueue = new MemoryQueue();
}

const addApplicationJob = async (applicationId, jobUrl, resumeData) => {
  try {
    const job = await applicationQueue.add({
      applicationId,
      jobUrl,
      resumeData,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`Job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Failed to add job to queue:', error);
    throw error;
  }
};

const getQueueStatus = async () => {
  try {
    const counts = await applicationQueue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
    };
  } catch (error) {
    return { waiting: 0, active: 0, completed: 0, failed: 0 };
  }
};

module.exports = { 
  applicationQueue, 
  addApplicationJob,
  getQueueStatus 
};