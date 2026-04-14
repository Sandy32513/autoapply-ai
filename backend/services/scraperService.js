const { JSDOM } = require('jsdom');
const jobConnector = require('./connectors/jobConnector');

const SCRAPER_CONFIG = {
  timeout: 30000,
  maxJobs: 20,
  minDelay: 3000,
  maxDelay: 8000,
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ],
};

const randomDelay = () => {
  const delay = Math.floor(Math.random() * (SCRAPER_CONFIG.maxDelay - SCRAPER_CONFIG.minDelay + 1)) + SCRAPER_CONFIG.minDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
};

const getRandomUserAgent = () => {
  return SCRAPER_CONFIG.userAgents[Math.floor(Math.random() * SCRAPER_CONFIG.userAgents.length)];
};

const simulateHumanBehavior = async () => {
  await randomDelay();
};

const isPublicJobPage = (url) => {
  const publicDomains = [
    'linkedin.com/jobs',
    'naukri.com',
    'indeed.com',
    'glassdoor.com',
    'monster.com',
    'timesjobs.com',
    'shine.com',
    'careerjet.com',
  ];
  
  try {
    const urlObj = new URL(url);
    return publicDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

const scrapeJobs = async (keywords = '', location = '') => {
  console.log(`Scraping jobs for: keywords="${keywords}", location="${location}"`);
  
  await simulateHumanBehavior();
  
  const result = await jobConnector.fetchAllSources(keywords, location, SCRAPER_CONFIG.maxJobs);
  
  const allJobs = [...result.linkedin, ...result.naukri];
  
  console.log(`Found ${allJobs.length} jobs from all sources`);
  return allJobs;
};

const scrapeFromUrl = async (url) => {
  if (!isPublicJobPage(url)) {
    console.log(`Skipping non-public job page: ${url}`);
    return null;
  }

  try {
    await simulateHumanBehavior();
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
      },
      timeout: SCRAPER_CONFIG.timeout,
    });
    
    if (!response.ok) {
      console.log(`HTTP error: ${response.status}`);
      return null;
    }
    
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

const scrapeFromSource = async (source, keywords = '', location = '') => {
  const availableSources = jobConnector.getAvailableSources();
  
  if (!availableSources.includes(source.toLowerCase())) {
    throw new Error(`Invalid source. Available: ${availableSources.join(', ')}`);
  }

  await simulateHumanBehavior();
  
  return await jobConnector.fetchJobsFromSource(source, keywords, location, SCRAPER_CONFIG.maxJobs);
};

module.exports = {
  scrapeJobs,
  scrapeFromUrl,
  scrapeFromSource,
  isPublicJobPage,
  getAvailableSources: jobConnector.getAvailableSources,
};