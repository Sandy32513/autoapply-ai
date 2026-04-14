const { supabase } = require('../config/supabase');
const { parseResume } = require('../services/parserService');
const { tailorResume } = require('../services/aiService');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_JOB_DESCRIPTION_LENGTH = 5000;

const getResumes = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    let query = supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch resumes', resumes: [] });
    }

    res.json({ success: true, resumes: data || [] });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error', resumes: [] });
  }
};

const getResumeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    let query = supabase
      .from('resumes')
      .select('*')
      .eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

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

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Only PDF and DOCX files are allowed' });
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

    const userId = req.user?.id || null;

    const { data: dbData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        file_url: fileUrl,
        file_name: req.file.originalname,
        parsed_data: parsedData,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return res.status(500).json({ success: false, error: 'Failed to save resume' });
    }

    res.status(201).json({
      success: true,
      resume: dbData,
    });
  } catch (err) {
    next(err);
  }
};

const tailorResumeHandler = async (req, res, next) => {
  try {
    const { resumeId, jobDescription } = req.body;
    const userId = req.user?.id;

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

    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    let tailoredContent = '';
    try {
      tailoredContent = await tailorResume(resume, truncatedJob);
    } catch (aiError) {
      console.error('AI Error:', aiError);
      return res.status(503).json({ success: false, error: 'AI service unavailable. Please check Ollama or OpenAI configuration.' });
    }

    let tailoredRecord = null;
    if (userId) {
      const { data: tailoredData, error: tailoredError } = await supabase
        .from('tailored_resumes')
        .insert({
          user_id: userId,
          resume_id: resumeId,
          job_description: truncatedJob,
          tailored_output: tailoredContent,
        })
        .select()
        .single();

      if (!tailoredError) {
        tailoredRecord = tailoredData;
      }
    }

    res.json({
      success: true,
      tailored: tailoredRecord || {
        id: 'temp-' + Date.now(),
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
    const userId = req.user?.id;
    
    let query = supabase
      .from('tailored_resumes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tailored resumes:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch tailored resumes' });
    }

    res.json({ success: true, tailored_resumes: data || [] });
  } catch (err) {
    next(err);
  }
};

const deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: existing, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    if (userId && existing.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this resume' });
    }

    await supabase
      .from('tailored_resumes')
      .delete()
      .eq('resume_id', id);

    const { error: deleteError } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({ success: false, error: 'Failed to delete resume' });
    }

    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  getResumes, 
  getResumeById,
  uploadResume, 
  tailorResumeHandler,
  getTailoredResumes,
  deleteResume
};