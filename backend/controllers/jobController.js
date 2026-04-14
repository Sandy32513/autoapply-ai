const { supabase } = require('../config/supabase');
const { scrapeJobs } = require('../services/scraperService');

const getJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', location = '' } = req.query;
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
      source: 'mock',
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

module.exports = { getJobs, getJobById, scrapeAndSaveJobs };