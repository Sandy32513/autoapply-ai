const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const parseResume = async (buffer, mimeType) => {
  let text = '';
  
  if (mimeType === 'application/pdf') {
    const result = await pdf(buffer);
    text = result.text;
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    throw new Error('Unsupported file type');
  }

  const parsed = {
    text,
    skills: extractSkills(text),
    experience: extractExperience(text),
    education: extractEducation(text),
  };

  return parsed;
};

const extractSkills = (text) => {
  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
    'git', 'github', 'gitlab', 'ci/cd', 'jenkins',
    'html', 'css', 'tailwind', 'sass', 'less',
    'rest', 'graphql', 'grpc', 'websocket',
    'machine learning', 'data science', 'ai', 'deep learning', 'tensorflow', 'pytorch',
    'linux', 'unix', 'bash', 'shell',
    'agile', 'scrum', 'jira',
  ];

  const found = [];
  const lowerText = text.toLowerCase();
  
  for (const skill of skillKeywords) {
    if (lowerText.includes(skill)) {
      found.push(skill);
    }
  }

  return [...new Set(found)];
};

const extractExperience = (text) => {
  const experience = [];
  const lines = text.split('\n');
  
  const expKeywords = ['experience', 'work', 'employment', 'job', 'position', 'role'];
  let inExperienceSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (expKeywords.some(k => lowerLine.includes(k))) {
      inExperienceSection = true;
      continue;
    }
    
    if (inExperienceSection && line.trim().length > 20) {
      experience.push(line.trim());
      if (experience.length >= 5) break;
    }
  }

  return experience.slice(0, 5);
};

const extractEducation = (text) => {
  const education = [];
  const lines = text.split('\n');
  
  const eduKeywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd'];
  let inEducationSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (eduKeywords.some(k => lowerLine.includes(k))) {
      inEducationSection = true;
      continue;
    }
    
    if (inEducationSection && line.trim().length > 10 && line.trim().length < 100) {
      education.push(line.trim());
      if (education.length >= 3) break;
    }
  }

  return education.slice(0, 3);
};

module.exports = { parseResume };