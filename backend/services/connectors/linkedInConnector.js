const { JSDOM } = require('jsdom');

const ANTI_DETECTION_CONFIG = {
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  ],
  minDelay: 3000,
  maxDelay: 8000,
  timeout: 30000,
  maxJobsPerRequest: 25,
};

const randomDelay = async () => {
  const delay = Math.floor(Math.random() * (ANTI_DETECTION_CONFIG.maxDelay - ANTI_DETECTION_CONFIG.minDelay + 1)) + ANTI_DETECTION_CONFIG.minDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
};

const getRandomUserAgent = () => {
  return ANTI_DETECTION_CONFIG.userAgents[Math.floor(Math.random() * ANTI_DETECTION_CONFIG.userAgents.length)];
};

const normalizeJobData = (rawJob) => {
  return {
    title: rawJob.title?.trim() || rawJob.jobTitle || 'Unknown Title',
    company: rawJob.company?.trim() || rawJob.companyName || 'Unknown Company',
    location: rawJob.location?.trim() || rawJob.location || 'Remote',
    url: rawJob.url || rawJob.jobUrl || '',
    description: rawJob.description?.trim() || rawJob.jobDescription || rawJob.summary || '',
    salary: rawJob.salary || rawJob.salaryRange || null,
    jobType: rawJob.jobType || rawJob.employmentType || 'Full-time',
    postedDate: rawJob.postedDate || rawJob.datePosted || null,
    source: 'linkedin',
    sourceUrl: 'https://www.linkedin.com/jobs/',
  };
};

const fetchJobs = async (keywords = '', location = '', limit = 20) => {
  console.log(`[LinkedIn] Fetching jobs: keywords="${keywords}", location="${location}"`);
  
  await randomDelay();
  
  const mockLinkedInJobs = [
    {
      title: 'Senior Software Engineer',
      company: 'Google',
      location: location || 'Mountain View, CA',
      url: 'https://www.linkedin.com/jobs/view/1234567890',
      description: 'Join our team to build scalable systems. Experience with distributed systems, cloud computing, and modern web frameworks required.',
      salary: '$150,000 - $200,000',
      jobType: 'Full-time',
      postedDate: new Date().toISOString(),
    },
    {
      title: 'Full Stack Developer',
      company: 'Meta',
      location: location || 'Menlo Park, CA',
      url: 'https://www.linkedin.com/jobs/view/1234567891',
      description: 'Build products that connect people globally. React, Node.js, and TypeScript experience needed.',
      salary: '$140,000 - $180,000',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      title: 'Backend Engineer',
      company: 'Amazon',
      location: location || 'Seattle, WA',
      url: 'https://www.linkedin.com/jobs/view/1234567892',
      description: 'Work on AWS services. Java, Python, and distributed systems experience required.',
      salary: '$130,000 - $170,000',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      title: 'Frontend Developer',
      company: 'Netflix',
      location: location || 'Los Angeles, CA',
      url: 'https://www.linkedin.com/jobs/view/1234567893',
      description: 'Create beautiful streaming experiences. React, CSS, and performance optimization skills needed.',
      salary: '$120,000 - $160,000',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      title: 'DevOps Engineer',
      company: 'Microsoft',
      location: location || 'Redmond, WA',
      url: 'https://www.linkedin.com/jobs/view/1234567894',
      description: 'Manage Azure infrastructure. Kubernetes, Terraform, and CI/CD experience required.',
      salary: '$130,000 - $175,000',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 345600000).toISOString(),
    },
  ];

  let jobs = mockLinkedInJobs.map(job => ({
    ...job,
    location: location || job.location,
  }));

  if (keywords) {
    const keywordLower = keywords.toLowerCase();
    jobs = jobs.filter(job => 
      job.title.toLowerCase().includes(keywordLower) ||
      job.description.toLowerCase().includes(keywordLower) ||
      job.company.toLowerCase().includes(keywordLower)
    );
  }

  const normalizedJobs = jobs.slice(0, limit).map(normalizeJobData);
  
  console.log(`[LinkedIn] Found ${normalizedJobs.length} jobs`);
  return normalizedJobs;
};

const fetchFromUrl = async (url) => {
  if (!url.includes('linkedin.com')) {
    console.log('[LinkedIn] URL does not contain linkedin.com, skipping');
    return null;
  }

  console.log(`[LinkedIn] Fetching from URL: ${url}`);
  
  await randomDelay();

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: ANTI_DETECTION_CONFIG.timeout,
    });

    if (!response.ok) {
      console.log(`[LinkedIn] HTTP error: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const title = document.querySelector('title')?.textContent?.trim() || 'LinkedIn Job';
    
    return normalizeJobData({
      title,
      company: 'Company from LinkedIn',
      location: 'Remote',
      url,
      description: 'Job details from LinkedIn',
      source: 'linkedin',
    });
  } catch (error) {
    console.error(`[LinkedIn] Fetch error: ${error.message}`);
    return null;
  }
};

module.exports = {
  fetchJobs,
  fetchFromUrl,
  normalizeJobData,
  ANTI_DETECTION_CONFIG,
};