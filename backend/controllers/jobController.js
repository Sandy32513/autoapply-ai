const { supabase } = require('../config/supabase');
const { scrapeJobs } = require('../services/scraperService');
const jobConnector = require('../services/connectors/jobConnector');

const MAX_KEYWORDS_LENGTH = 200;
const MAX_LOCATION_LENGTH = 200;

const getJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', location = '', source = '' } = req.query;
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search) {
      const sanitizedSearch = search.substring(0, 100);
      query = query.or(`title.ilike.%${sanitizedSearch}%,company.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }

    if (location) {
      const sanitizedLocation = location.substring(0, 100);
      query = query.ilike('location', `%${sanitizedLocation}%`);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch jobs',
        jobs: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });
    }

    res.json({
      success: true,
      jobs: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
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
    let { keywords = '', location = '' } = req.body;

    if (keywords && keywords.length > MAX_KEYWORDS_LENGTH) {
      keywords = keywords.substring(0, MAX_KEYWORDS_LENGTH);
    }
    if (location && location.length > MAX_LOCATION_LENGTH) {
      location = location.substring(0, MAX_LOCATION_LENGTH);
    }

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
    let { keywords = '', location = '', limit = 20 } = req.body;

    if (keywords && keywords.length > MAX_KEYWORDS_LENGTH) {
      keywords = keywords.substring(0, MAX_KEYWORDS_LENGTH);
    }
    if (location && location.length > MAX_LOCATION_LENGTH) {
      location = location.substring(0, MAX_LOCATION_LENGTH);
    }
    limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    
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