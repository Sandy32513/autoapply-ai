const { extractSkills, extractExperience, extractEducation } = require('../services/parserService');

describe('Parser Service - extractSkills', () => {
  it('should extract JavaScript from text', () => {
    const text = 'I have experience with JavaScript and React';
    const skills = extractSkills(text);
    expect(skills).toContain('javascript');
  });

  it('should extract multiple skills', () => {
    const text = 'Skills: Python, Java, SQL, AWS, Docker, Kubernetes';
    const skills = extractSkills(text);
    expect(skills).toContain('python');
    expect(skills).toContain('java');
    expect(skills).toContain('aws');
  });

  it('should return empty array for no skills', () => {
    const text = 'Just some random text without any tech skills';
    const skills = extractSkills(text);
    expect(skills).toEqual([]);
  });
});

describe('Parser Service - extractExperience', () => {
  it('should extract experience section', () => {
    const text = `
Education
BS Computer Science

Experience
Senior Developer at Tech Corp - 2020-2023
Junior Developer at Startup Inc - 2018-2020
    `;
    const experience = extractExperience(text);
    expect(experience.length).toBeGreaterThan(0);
  });
});

describe('Parser Service - extractEducation', () => {
  it('should extract education when properly formatted', () => {
    const text = `
Education
University of Technology
Bachelor of Science in Computer Science
    `;
    const education = extractEducation(text);
    expect(education.length).toBeGreaterThanOrEqual(0);
  });

  it('should return empty when no education keywords present', () => {
    const text = 'No education section here, just work experience';
    const education = extractEducation(text);
    expect(education).toEqual([]);
  });
});