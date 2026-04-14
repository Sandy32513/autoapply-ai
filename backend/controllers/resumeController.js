const { supabase } = require('../config/supabase');
const { parseResume } = require('../services/parserService');
const { tailorResume } = require('../services/aiService');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_JOB_DESCRIPTION_LENGTH = 5000;

const getResumes = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase error:', error);
      return res.json({ success: true, resumes: [] });
    }

    res.json({ success: true, resumes: data || [] });
  } catch (err) {
    console.error('Error:', err);
    res.json({ success: true, resumes: [] });
  }
};

const getResumeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    res.json({ success: true, resume: data });
  } catch (err) {
    next(err);
  }
};

const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ success: false, error: 'File size exceeds 5MB limit' });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = `uploads/${fileName}`;

    const storage = supabase.storage.from('resumes');
    
    const { data: uploadData, error: uploadError } = await storage.upload(
      filePath,
      req.file.buffer,
      {
        contentType: req.file.mimetype,
        upsert: false,
      }
    );

    let fileUrl = '';
    if (!uploadError) {
      const { data: urlData } = storage.getPublicUrl(filePath);
      fileUrl = urlData?.publicUrl || '';
    }

    let parsedData = {};
    try {
      parsedData = await parseResume(req.file.buffer, req.file.mimetype);
    } catch (parseError) {
      console.error('Parse error:', parseError);
    }

    const { data: dbData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        file_url: fileUrl,
        file_name: req.file.originalname,
        parsed_data: parsedData,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
    }

    res.status(201).json({
      success: true,
      resume: dbData || { id: 'temp-' + Date.now(), file_name: req.file.originalname },
    });
  } catch (err) {
    next(err);
  }
};

const tailorResumeHandler = async (req, res, next) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId) {
      return res.status(400).json({ success: false, error: 'Resume ID is required' });
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Job description is required' });
    }

    const truncatedJob = jobDescription.substring(0, MAX_JOB_DESCRIPTION_LENGTH);

    let resume = null;
    try {
      const { data } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();
      resume = data;
    } catch (e) {
      console.error('Error fetching resume:', e);
    }

    let tailoredContent = '';
    try {
      tailoredContent = await tailorResume(resume, truncatedJob);
    } catch (aiError) {
      console.error('AI Error:', aiError);
      tailoredContent = 'Failed to generate tailored resume. Please check that Ollama is running on localhost:11434';
    }

    res.json({
      success: true,
      tailored: {
        resume_id: resumeId,
        job_description: truncatedJob,
        tailored_output: tailoredContent,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Tailor error:', err);
    next(err);
  }
};

const getTailoredResumes = async (req, res, next) => {
  try {
    res.json({ success: true, tailored_resumes: [] });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  getResumes, 
  getResumeById,
  uploadResume, 
  tailorResumeHandler,
  getTailoredResumes 
};