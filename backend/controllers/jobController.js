const { supabase } = require('../config/supabase');
const { scrapeJobs } = require('../services/scraperService');
const jobConnector = require('../services/connectors/jobConnector');

const getJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', location = '', source = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return res.json({
        success: true,
        jobs: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    }

    res.json({
      success: true,
      jobs: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: true,
      jobs: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });
  }
};

const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, job: data });
  } catch (err) {
    next(err);
  }
};

const getSources = async (req, res, next) => {
  const sources = jobConnector.getAvailableSources();
  
  res.json({
    success: true,
    sources: sources.map(source => ({
      id: source,
      name: source.charAt(0).toUpperCase() + source.slice(1),
      url: source === 'linkedin' 
        ? 'https://www.linkedin.com/jobs/'
        : 'https://www.naukri.com/',
    })),
  });
};

const scrapeAndSaveJobs = async (req, res, next) => {
  try {
    const { keywords = '', location = '' } = req.body;

    const jobs = await scrapeJobs(keywords, location);

    if (jobs.length === 0) {
      return res.json({
        success: true,
        message: 'No jobs found',
        jobs: [],
      });
    }

    const jobsToInsert = jobs.map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      description: job.description,
      source: job.source,
      salary: job.salary || null,
      job_type: job.jobType || null,
    }));

    try {
      const { data: upsertedJobs, error: upsertError } = await supabase
        .from('jobs')
        .upsert(jobsToInsert, { onConflict: 'url', ignoreDuplicates: true })
        .select();

      if (upsertError) {
        console.error('Upsert error:', upsertError);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    res.json({
      success: true,
      message: `Found ${jobs.length} jobs`,
      jobs: jobsToInsert,
    });
  } catch (err) {
    next(err);
  }
};

const scrapeFromSource = async (req, res, next) => {
  try {
    const { source } = req.params;
    const { keywords = '', location = '', limit = 20 } = req.body;
    
    const availableSources = jobConnector.getAvailableSources();
    
    if (!availableSources.includes(source.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid source. Available: ${availableSources.join(', ')}`,
      });
    }
    
    const jobs = await jobConnector.fetchJobsFromSource(source, keywords, location, limit);
    
    const jobsToInsert = jobs.map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      description: job.description,
      source: job.source,
      salary: job.salary || null,
      job_type: job.jobType || null,
    }));
    
    if (jobsToInsert.length > 0) {
      try {
        await supabase
          .from('jobs')
          .upsert(jobsToInsert, { onConflict: 'url', ignoreDuplicates: true });
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }
    
    res.json({
      success: true,
      message: `Found ${jobs.length} jobs from ${source}`,
      source,
      jobs: jobsToInsert,
    });
  } catch (err) {
    console.error('Error scraping from source:', err);
    next(err);
  }
};

module.exports = { getJobs, getJobById, scrapeAndSaveJobs, scrapeFromSource, getSources };