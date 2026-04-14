const { applicationQueue } = require('./services/queueService');
const { applyToJob } = require('./services/automationService');
const { supabase } = require('./config/supabase');

const processApplication = async (job) => {
  const { applicationId, jobUrl, resumeData } = job.data;
  
  console.log(`Processing application ${applicationId}`);
  console.log(`Job URL: ${jobUrl}`);

  try {
    await supabase
      .from('applications')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    const result = await applyToJob(jobUrl, resumeData);

    if (result.success) {
      await supabase
        .from('applications')
        .update({ 
          status: 'success',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      console.log(`Application ${applicationId} completed successfully`);
      return { success: true, message: result.message };
    } else {
      const shouldRetry = job.attempts < 3;
      
      await supabase
        .from('applications')
        .update({ 
          status: shouldRetry ? 'pending' : 'failed',
          error_message: result.message,
          attempts: job.attempts,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      console.log(`Application ${applicationId} failed: ${result.message}`);
      
      if (!shouldRetry) {
        throw new Error(result.message);
      }
      
      return { success: false, retry: true };
    }

  } catch (error) {
    console.error(`Error processing application ${applicationId}:`, error.message);
    
    const shouldRetry = job.attempts < 3;
    
    await supabase
      .from('applications')
      .update({ 
        status: shouldRetry ? 'pending' : 'failed',
        error_message: error.message,
        attempts: job.attempts + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (!shouldRetry) {
      throw error;
    }
    
    return { success: false, retry: true };
  }
};

const startWorker = () => {
  console.log('Starting application worker...');
  
  if (typeof applicationQueue.process === 'function') {
    applicationQueue.process(async (job) => {
      return await processApplication(job);
    });
    
    console.log('Worker is running and listening for jobs');
  } else {
    console.log('Running in memory mode - jobs will be processed synchronously');
  }
};

if (require.main === module) {
  startWorker();
  
  applicationQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed`);
  });
  
  applicationQueue.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed after ${job.attempts} attempts`);
  });
}

module.exports = { startWorker, processApplication };