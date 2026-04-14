const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const USE_OPENAI = process.env.USE_OPENAI === 'true';

const SYSTEM_PROMPT = `You are a professional resume writer and career coach. Your task is to tailor a resume for a specific job position.

IMPORTANT RULES:
1. Only use information from the provided resume - NEVER hallucinate skills, experience, or education
2. Keep the same format and structure as the original resume
3. Optimize bullet points to match job requirements
4. Add relevant keywords from the job description
5. Prioritize relevant experience and skills
6. Keep it ATS-friendly (no tables, graphics, headers/footers)
7. Output ONLY the tailored resume content, no explanations`;

const USER_PROMPT = (resumeData, jobDescription) => `
ORIGINAL RESUME:
${resumeData.parsed_data?.text || resumeData.text || 'No resume text available'}

JOB DESCRIPTION:
${jobDescription}

Please tailor the resume to match this job. Keep all real information from the original resume, but reword and prioritize to match the job requirements.`;

const tailorResume = async (resumeData, jobDescription) => {
  if (!resumeData || !jobDescription) {
    throw new Error('Resume data and job description are required');
  }

  const truncatedJob = jobDescription.substring(0, 4000);
  const resumeText = (resumeData.parsed_data?.text || resumeData.text || '').substring(0, 8000);

  try {
    if (USE_OPENAI && OPENAI_API_KEY) {
      return await tailorWithOpenAI(resumeText, truncatedJob);
    } else {
      return await tailorWithOllama(resumeText, truncatedJob);
    }
  } catch (error) {
    console.error('AI tailoring failed:', error.message);
    throw new Error(`AI tailoring failed: ${error.message}`);
  }
};

const tailorWithOpenAI = async (resumeText, jobDescription) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_PROMPT({ text: resumeText }, jobDescription) }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const tailorWithOllama = async (resumeText, jobDescription) => {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || 'llama3.1',
      prompt: `${SYSTEM_PROMPT}\n\n${USER_PROMPT({ text: resumeText }, jobDescription)}`,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 2000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error: ${errorText}`);
  }

  const data = await response.json();
  return data.response;
};

module.exports = { tailorResume };