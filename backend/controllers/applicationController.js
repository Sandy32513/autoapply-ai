const { supabase } = require('../config/supabase');
const { addApplicationJob, getQueueStatus } = require('../services/queueService');
const automationService = require('../services/automationService');
const autofillService = require('../services/autofillService');

const getApplications = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status } = req.query;
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ 
      success: true, 
      applications: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum),
      }
    });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch applications', applications: [] });
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
    const userId = req.user?.id;

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
        user_id: userId,
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

    let queueFailed = false;
    try {
      await addApplicationJob(
        application.id,
        job.url,
        resume?.parsed_data || null
      );
    } catch (queueError) {
      console.error('Failed to add to queue:', queueError);
      queueFailed = true;
    }

    if (queueFailed) {
      return res.status(201).json({
        success: true,
        application: {
          id: application.id,
          job_title: application.job_title,
          company: application.company,
          status: application.status,
          created_at: application.created_at,
        },
        message: 'Application submitted, but automated processing is currently unavailable',
        queue_warning: true,
      });
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
    res.status(500).json({ success: false, error: 'Failed to get queue status' });
  }
};

const startApplyFlow = async (req, res, next) => {
  try {
    const { jobUrl, userData } = req.body;
    
    if (!jobUrl) {
      return res.status(400).json({ success: false, error: 'Job URL is required' });
    }
    
    const userProfile = userData || {
      name: req.user?.name || '',
      email: req.user?.email || '',
      phone: req.user?.phone || '',
      linkedin: req.user?.linkedin_url || '',
    };
    
    const result = await automationService.startApplyFlow(jobUrl, userProfile);
    
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        job_url: jobUrl,
        status: 'started',
        source: 'web',
      })
      .select()
      .single();
    
    if (!appError && application) {
      await supabase
        .from('applications')
        .update({ application_id: application.id })
        .eq('id', application.id);
    }
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        jobUrl: result.jobUrl,
        step: result.step,
        formDetected: result.formDetected,
        fieldsFound: result.fieldsFound,
        instruction: result.instruction,
      },
    });
  } catch (err) {
    console.error('Error starting apply flow:', err);
    next(err);
  }
};

const trackApplicationStatus = async (req, res, next) => {
  try {
    const { jobUrl, status, company, jobTitle, source } = req.body;
    
    if (!jobUrl) {
      return res.status(400).json({ success: false, error: 'Job URL is required' });
    }
    
    const existingApp = await supabase
      .from('applications')
      .select('*')
      .eq('job_url', jobUrl)
      .single();
    
    let application;
    if (existingApp.data) {
      const { data: updated, error } = await supabase
        .from('applications')
        .update({
          status: status || existingApp.data.status,
          company: company || existingApp.data.company,
          job_title: jobTitle || existingApp.data.job_title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingApp.data.id)
        .select()
        .single();
      
      application = updated;
    } else {
      const { data: created, error } = await supabase
        .from('applications')
        .insert({
          job_url: jobUrl,
          job_title: jobTitle || 'Unknown',
          company: company || 'Unknown',
          status: status || 'started',
          source: source || 'extension',
        })
        .select()
        .single();
      
      application = created;
    }
    
    res.json({
      success: true,
      application: application,
      message: 'Application tracked successfully',
    });
  } catch (err) {
    console.error('Error tracking application:', err);
    res.json({ success: false, error: err.message });
  }
};

const getApplicationStats = async (req, res, next) => {
  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('status');
    
    if (error) throw error;
    
    const stats = {
      total: applications?.length || 0,
      pending: 0,
      started: 0,
      applied: 0,
      rejected: 0,
      interviewed: 0,
    };
    
    applications?.forEach(app => {
      const status = app.status?.toLowerCase() || 'pending';
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      } else {
        stats.pending++;
      }
    });
    
    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.json({ 
      success: true, 
      stats: { total: 0, pending: 0, started: 0, applied: 0, rejected: 0, interviewed: 0 } 
    });
  }
};

module.exports = { 
  getApplications, 
  getApplicationById,
  applyToJob,
  getQueueInfo,
  startApplyFlow,
  trackApplicationStatus,
  getApplicationStats
};