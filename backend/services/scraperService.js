const { JSDOM } = require('jsdom');

const SCRAPER_CONFIG = {
  timeout: 30000,
  maxJobs: 20,
};

const mockJobs = [
  {
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'Remote',
    url: 'https://example.com/job/1',
    description: 'We are looking for a software engineer to join our team. Experience with React, Node.js, and TypeScript required.',
  },
  {
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    location: 'San Francisco, CA',
    url: 'https://example.com/job/2',
    description: 'Fast-growing startup seeks a full stack developer. Work with React, Python, and AWS.',
  },
  {
    title: 'Frontend Developer',
    company: 'DesignStudio',
    location: 'New York, NY',
    url: 'https://example.com/job/3',
    description: 'Creative agency looking for a frontend developer. Strong CSS and animation skills needed.',
  },
  {
    title: 'Backend Engineer',
    company: 'DataSystems',
    location: 'Austin, TX',
    url: 'https://example.com/job/4',
    description: 'Build scalable APIs with Go and Kubernetes. Experience with databases required.',
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudFirst',
    location: 'Seattle, WA',
    url: 'https://example.com/job/5',
    description: 'Manage cloud infrastructure on AWS and GCP. CI/CD pipeline experience needed.',
  },
  {
    title: 'Product Manager',
    company: 'Innovation Labs',
    location: 'Boston, MA',
    url: 'https://example.com/job/6',
    description: 'Lead product development for new AI-powered features. Technical background preferred.',
  },
  {
    title: 'Data Scientist',
    company: 'AI Solutions',
    location: 'Remote',
    url: 'https://example.com/job/7',
    description: 'Build machine learning models. Python, TensorFlow, and SQL experience required.',
  },
  {
    title: 'UX Designer',
    company: 'UserFirst',
    location: 'Los Angeles, CA',
    url: 'https://example.com/job/8',
    description: 'Design intuitive user interfaces. Figma and design systems experience needed.',
  },
  {
    title: 'QA Engineer',
    company: 'QualityTech',
    location: 'Chicago, IL',
    url: 'https://example.com/job/9',
    description: 'Test web applications. Selenium and automation testing experience required.',
  },
  {
    title: 'Mobile Developer',
    company: 'AppWorks',
    location: 'Miami, FL',
    url: 'https://example.com/job/10',
    description: 'Build iOS and Android apps. React Native or Swift experience needed.',
  },
];

const scrapeJobs = async (keywords = '', location = '') => {
  console.log(`Scraping jobs for: keywords="${keywords}", location="${location}"`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let jobs = [...mockJobs];
  
  if (keywords) {
    const keywordLower = keywords.toLowerCase();
    jobs = jobs.filter(job => 
      job.title.toLowerCase().includes(keywordLower) ||
      job.description.toLowerCase().includes(keywordLower) ||
      job.company.toLowerCase().includes(keywordLower)
    );
  }
  
  if (location) {
    const locationLower = location.toLowerCase();
    jobs = jobs.filter(job => 
      job.location.toLowerCase().includes(locationLower)
    );
  }
  
  jobs = jobs.slice(0, SCRAPER_CONFIG.maxJobs);
  
  const timestamp = Date.now();
  jobs = jobs.map((job, index) => ({
    ...job,
    url: `${job.url}?q=${keywords}&l=${location}&t=${timestamp}&i=${index}`,
  }));
  
  console.log(`Found ${jobs.length} jobs`);
  return jobs;
};

const scrapeFromUrl = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: SCRAPER_CONFIG.timeout,
    });
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    return {
      title: document.querySelector('title')?.textContent || 'Job',
      company: 'Scraped Company',
      location: 'Remote',
      url: url,
      description: 'Job description from scraped page',
    };
  } catch (error) {
    console.error('Failed to scrape URL:', error.message);
    return null;
  }
};

module.exports = { scrapeJobs, scrapeFromUrl };