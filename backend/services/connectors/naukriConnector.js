const { JSDOM } = require('jsdom');

const ANTI_DETECTION_CONFIG = {
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ],
  minDelay: 4000,
  maxDelay: 10000,
  timeout: 30000,
  maxJobsPerRequest: 30,
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
    title: rawJob.title?.trim() || rawJob.jobTitle || rawJob.designation || 'Unknown Title',
    company: rawJob.company?.trim() || rawJob.companyName || rawJob.company || 'Unknown Company',
    location: rawJob.location?.trim() || rawJob.location || rawJob.city || 'India',
    url: rawJob.url || rawJob.jobUrl || rawJob.link || '',
    description: rawJob.description?.trim() || rawJob.jobDescription || rawJob.description || rawJob.summary || '',
    salary: rawJob.salary || rawJob.salaryRange || rawJob.ctc || null,
    jobType: rawJob.jobType || rawJob.employmentType || rawJob.jobType || 'Full-time',
    postedDate: rawJob.postedDate || rawJob.datePosted || rawJob.postedOn || null,
    source: 'naukri',
    sourceUrl: 'https://www.naukri.com/',
  };
};

const fetchJobs = async (keywords = '', location = '', limit = 30) => {
  console.log(`[Naukri] Fetching jobs: keywords="${keywords}", location="${location}"`);
  
  await randomDelay();
  
  const mockNaukriJobs = [
    {
      title: 'Software Developer',
      company: 'TCS',
      location: location || 'Bangalore, Karnataka',
      url: 'https://www.naukri.com/job-listings/software-developer-tcs-bangalore-1-2-years-123456',
      description: 'Looking for software developers with Java, Spring, and React experience. Good communication skills required.',
      salary: '₹5,00,000 - ₹8,00,000 PA',
      jobType: 'Full-time',
      postedDate: new Date().toISOString(),
    },
    {
      title: 'Full Stack Engineer',
      company: 'Infosys',
      location: location || 'Hyderabad, Telangana',
      url: 'https://www.naukri.com/job-listings/fullstack-engineer-infosys-hyderabad-2-4-years-123457',
      description: 'Full stack development with Angular, Node.js, and MongoDB. Experience in REST APIs needed.',
      salary: '₹6,00,000 - ₹10,00,000 PA',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      title: 'Backend Developer',
      company: 'Wipro',
      location: location || 'Pune, Maharashtra',
      url: 'https://www.naukri.com/job-listings/backend-developer-wipro-pune-1-3-years-123458',
      description: 'Python/Django development for enterprise applications. Database knowledge required.',
      salary: '₹4,50,000 - ₹7,00,000 PA',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      title: 'React Developer',
      company: 'Flipkart',
      location: location || 'Bangalore, Karnataka',
      url: 'https://www.naukri.com/job-listings/react-developer-flipkart-bangalore-2-5-years-123459',
      description: 'Build responsive web applications using React. Experience with Redux and TypeScript preferred.',
      salary: '₹8,00,000 - ₹15,00,000 PA',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      title: 'Data Analyst',
      company: 'Accenture',
      location: location || 'Gurgaon, Haryana',
      url: 'https://www.naukri.com/job-listings/data-analyst-accenture-gurgaon-1-3-years-123460',
      description: 'Analyze business data using SQL, Python, and Tableau. Statistical knowledge required.',
      salary: '₹5,00,000 - ₹8,00,000 PA',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      title: 'DevOps Engineer',
      company: 'Cognizant',
      location: location || 'Chennai, Tamil Nadu',
      url: 'https://www.naukri.com/job-listings/devops-engineer-cognizant-chennai-2-4-years-123461',
      description: 'CI/CD pipeline management using Jenkins, Docker, and Kubernetes. Cloud experience needed.',
      salary: '₹6,00,000 - ₹11,00,000 PA',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      title: 'UI/UX Designer',
      company: 'Myntra',
      location: location || 'Bangalore, Karnataka',
      url: 'https://www.naukri.com/job-listings/ui-ux-designer-myntra-bangalore-1-3-years-123462',
      description: 'Design intuitive user interfaces. Figma, Adobe XD, and prototyping experience required.',
      salary: '₹5,00,000 - ₹9,00,000 PA',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 518400000).toISOString(),
    },
    {
      title: 'QA Engineer',
      company: 'Tech Mahindra',
      location: location || 'Pune, Maharashtra',
      url: 'https://www.naukri.com/job-listings/qa-engineer-tech-mahindra-pune-1-2-years-123463',
      description: 'Manual and automation testing. Selenium and API testing experience preferred.',
      salary: '₹3,50,000 - ₹6,00,000 PA',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 604800000).toISOString(),
    },
  ];

  let jobs = mockNaukriJobs.map(job => ({
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
  
  console.log(`[Naukri] Found ${normalizedJobs.length} jobs`);
  return normalizedJobs;
};

const fetchFromUrl = async (url) => {
  if (!url.includes('naukri.com')) {
    console.log('[Naukri] URL does not contain naukri.com, skipping');
    return null;
  }

  console.log(`[Naukri] Fetching from URL: ${url}`);
  
  await randomDelay();

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      timeout: ANTI_DETECTION_CONFIG.timeout,
    });

    if (!response.ok) {
      console.log(`[Naukri] HTTP error: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const title = document.querySelector('title')?.textContent?.trim() || 'Naukri Job';
    
    return normalizeJobData({
      title,
      company: 'Company from Naukri',
      location: 'India',
      url,
      description: 'Job details from Naukri',
      source: 'naukri',
    });
  } catch (error) {
    console.error(`[Naukri] Fetch error: ${error.message}`);
    return null;
  }
};

module.exports = {
  fetchJobs,
  fetchFromUrl,
  normalizeJobData,
  ANTI_DETECTION_CONFIG,
};