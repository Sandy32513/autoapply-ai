const { supabase } = require('../config/supabase');
const { addApplicationJob, getQueueStatus } = require('../services/queueService');

const getApplications = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ success: true, applications: data || [] });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.json({ success: true, applications: [] });
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    res.json({ success: true, application: data });
  } catch (err) {
    next(err);
  }
};

const applyToJob = async (req, res, next) => {
  try {
    const { jobId, resumeId } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'Job ID is required' });
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    let resume = null;
    if (resumeId) {
      const { data: resumeData } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();
      resume = resumeData;
    }

    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        job_title: job.title,
        company: job.company,
        company_url: job.url,
        resume_id: resumeId || null,
        status: 'pending',
      })
      .select()
      .single();

    if (appError) {
      console.error('Failed to create application:', appError);
      return res.status(500).json({ success: false, error: 'Failed to create application' });
    }

    try {
      await addApplicationJob(
        application.id,
        job.url,
        resume?.parsed_data || null
      );
    } catch (queueError) {
      console.error('Failed to add to queue:', queueError);
    }

    res.status(201).json({
      success: true,
      application: {
        id: application.id,
        job_title: application.job_title,
        company: application.company,
        status: application.status,
        created_at: application.created_at,
      },
      message: 'Application submitted successfully',
    });
  } catch (err) {
    console.error('Error applying to job:', err);
    next(err);
  }
};

const getQueueInfo = async (req, res, next) => {
  try {
    const status = await getQueueStatus();
    res.json({ success: true, queue: status });
  } catch (err) {
    res.json({ success: true, queue: { waiting: 0, active: 0, completed: 0, failed: 0 } });
  }
};

module.exports = { 
  getApplications, 
  getApplicationById,
  applyToJob,
  getQueueInfo
};