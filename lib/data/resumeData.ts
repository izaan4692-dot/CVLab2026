export const resumeData = {
  id: '#RSM-2024-001',
  user: 'Sarah Johnson',
  originalFilename: 'Abdullah_Alshehri.pdf',
  created: 'March 15, 2024, at 2:30 PM',
  fileSize: '2.4 MB',
  analyzed: true,
  userInfo: {
    email: 'abdullah.alshehri@email.com',
    requestNumber: '1244',
    status: 'Active',
  },
  aiOptimization: {
    status: 'Optimized',
    dataPreview: `{
  "optimization_score": 94,
  "improvements": {
    "Enhanced skills section formatting",
    "Improved ATS compatibility",
    "Standardized date format",
    "Enhanced bullet points"
  },
  "readability_score": "A+",
  "ats_score": 98
}`,
  },
  extractedText: `ABDULLAH ALSHEHRI

Senior Software Engineer | Full-Stack Developer
Email: abdullah.alshehri@gmail.com | Phone: +966 50 123 4567
LinkedIn: linkedin.com/in/abdullah-alshehri | Location: Riyadh, Saudi Arabia

PROFESSIONAL SUMMARY

Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable solutions and leading cross-functional teams in fast-paced environments.

TECHNICAL SKILLS

Programming Languages: JavaScript, Python, Java, TypeScript, C#
Frontend: React, Vue.js, Angular, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, Django, Spring Boot, .NET Core
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud & DevOps: AWS, Azure, Docker, Kubernetes, CI/CD

WORK EXPERIENCE

Senior Software Engineer - Tech Solutions Inc. (2020 - Present)
• Led development of microservices architecture serving 100K+ users
• Implemented CI/CD pipelines reducing deployment time by 60%
• Mentored 5 junior developers and conducted code reviews`,
};

export const resumesList = [
  {
    id: '1',
    filename: 'Abdullah_Alshehri.pdf',
    user: 'Sarah Johnson',
    status: 'Analyzed',
    date: 'March 15, 2024',
  },
] as const;


