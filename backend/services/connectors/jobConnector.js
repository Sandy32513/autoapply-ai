const linkedInConnector = require('./linkedInConnector');
const naukriConnector = require('./naukriConnector');

const CONNECTOR_MAP = {
  linkedin: linkedInConnector,
  naukri: naukriConnector,
};

const fetchJobsFromSource = async (source, keywords = '', location = '', limit = 20) => {
  const connector = CONNECTOR_MAP[source?.toLowerCase()];
  
  if (!connector) {
    throw new Error(`Unknown job source: ${source}. Available sources: ${Object.keys(CONNECTOR_MAP).join(', ')}`);
  }

  return await connector.fetchJobs(keywords, location, limit);
};

const fetchJobFromUrl = async (url) => {
  if (!url) {
    throw new Error('URL is required');
  }

  if (url.includes('linkedin.com')) {
    return await linkedInConnector.fetchFromUrl(url);
  }
  
  if (url.includes('naukri.com')) {
    return await naukriConnector.fetchFromUrl(url);
  }

  console.log(`[JobConnector] Unknown job site for URL: ${url}`);
  return null;
};

const fetchAllSources = async (keywords = '', location = '', limitPerSource = 10) => {
  const results = {
    linkedin: [],
    naukri: [],
    errors: [],
  };

  for (const [source, connector] of Object.entries(CONNECTOR_MAP)) {
    try {
      const jobs = await connector.fetchJobs(keywords, location, limitPerSource);
      results[source] = jobs;
    } catch (error) {
      console.error(`[JobConnector] Error fetching from ${source}: ${error.message}`);
      errors.push({ source, error: error.message });
    }
  }

  return results;
};

const getAvailableSources = () => {
  return Object.keys(CONNECTOR_MAP);
};

module.exports = {
  fetchJobsFromSource,
  fetchJobFromUrl,
  fetchAllSources,
  getAvailableSources,
  linkedInConnector,
  naukriConnector,
};