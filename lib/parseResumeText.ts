/**
 * Parse optimized resume text (markdown format) into structured sections
 */

export interface ContactInfo {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  details?: string[];
}

export interface ParsedResume {
  contact: ContactInfo;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Record<string, string[]>;
  certifications: string[];
  languages?: string[];
  projects?: { name: string; description: string }[];
  rawText: string;
}

/**
 * Extract email from text
 */
function extractEmail(text: string): string | undefined {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return emailMatch ? emailMatch[0] : undefined;
}

/**
 * Extract phone from text
 */
function extractPhone(text: string): string | undefined {
  // Match various phone formats including (+92)-302-6441231
  const phoneMatch = text.match(/\(?\+?[0-9]{1,3}\)?[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/);
  return phoneMatch ? phoneMatch[0] : undefined;
}

/**
 * Extract LinkedIn URL or handle
 */
function extractLinkedIn(text: string): string | undefined {
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  return linkedinMatch ? linkedinMatch[0] : undefined;
}

/**
 * Clean markdown formatting from text
 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')     // Remove italic
    .replace(/_([^_]+)_/g, '$1')       // Remove underscore italic
    .replace(/`([^`]+)`/g, '$1')       // Remove code
    .trim();
}

/**
 * Parse markdown text into structured resume
 */
export function parseResumeText(text: string): ParsedResume {
  const lines = text.split('\n');

  // Initialize result
  const result: ParsedResume = {
    contact: { name: '' },
    experience: [],
    education: [],
    skills: {},
    certifications: [],
    rawText: text,
  };

  // Section keywords mapping
  const sectionKeywords: Record<string, string[]> = {
    summary: ['summary', 'professional summary', 'profile', 'objective', 'about me', 'career objective'],
    experience: ['experience', 'work experience', 'employment', 'work history', 'professional experience', 'career history'],
    education: ['education', 'academic', 'qualifications', 'academic background'],
    skills: ['skills', 'technical skills', 'competencies', 'expertise', 'core competencies', 'technical expertise'],
    certifications: ['certifications', 'certificates', 'credentials', 'licenses', 'professional certifications'],
    languages: ['languages', 'language skills', 'language proficiency'],
    projects: ['projects', 'key projects', 'portfolio', 'notable projects'],
  };

  // Identify which section a header belongs to
  const identifySection = (headerText: string): string => {
    const cleanHeader = headerText.toLowerCase().trim();
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(kw => cleanHeader.includes(kw))) {
        return section;
      }
    }
    return 'other';
  };

  // Parse sections
  const sections: Record<string, string[]> = {};
  let currentSection = 'header';
  let foundFirstHeader = false;
  let foundName = false;
  let nameExtractionAttempts = 0;
  const maxNameExtractionAttempts = 10; // Try first 10 lines for name

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for markdown headers (# or ##)
    const headerMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);

    if (headerMatch) {
      const headerLevel = headerMatch[1].length;
      const headerText = headerMatch[2];

      if (!foundFirstHeader && headerLevel === 1) {
        // First # header is the name
        result.contact.name = cleanMarkdown(headerText);
        foundFirstHeader = true;
        foundName = true;
        currentSection = 'contactInfo';
      } else {
        // Subsequent headers are sections
        const sectionType = identifySection(headerText);
        currentSection = sectionType;
      }

      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
    } else if (trimmedLine) {
      // Check for plain text section headers (ALL CAPS, no special chars, matches section keywords)
      const isPlainTextSection = trimmedLine === trimmedLine.toUpperCase() && 
                                 trimmedLine.length > 3 && 
                                 trimmedLine.length < 50 &&
                                 !trimmedLine.match(/^[-•*]/) &&
                                 !trimmedLine.match(/[\w.-]+@[\w.-]+\.\w+/) && // not email
                                 !trimmedLine.match(/\(?\+?[0-9]{1,3}\)?[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/); // not phone
      
      if (isPlainTextSection) {
        const sectionType = identifySection(trimmedLine.toLowerCase());
        if (sectionType !== 'other') {
          currentSection = sectionType;
          if (!sections[currentSection]) {
            sections[currentSection] = [];
          }
          // Don't add the section header itself to the content
          continue;
        }
      }
      
      // If we haven't found the name yet and this looks like a name (first few non-empty lines)
      // Expanded to check more lines and be more lenient
      if (!foundName && nameExtractionAttempts < maxNameExtractionAttempts && 
          !trimmedLine.match(/^[#*\-•]/) && trimmedLine.length > 2 && trimmedLine.length < 100) {
        nameExtractionAttempts++;
        
        // Check if it's likely a name (not a section header, not all caps section title, not email/phone)
        const hasEmail = extractEmail(trimmedLine);
        const hasPhone = extractPhone(trimmedLine);
        const isSectionHeader = identifySection(trimmedLine.toLowerCase()) !== 'other';
        const isKnownSection = trimmedLine.match(/^(PROFESSIONAL|WORK|EDUCATION|SKILLS|CERTIFICATIONS|SUMMARY|EXPERIENCE|CONTACT|ABOUT)/i);
        
        // More lenient name detection
        const isLikelyName = !isSectionHeader && 
                            !isKnownSection &&
                            !hasEmail &&
                            !hasPhone &&
                            !trimmedLine.match(/^[0-9]/) && // doesn't start with number
                            !trimmedLine.match(/^[A-Z]{2,}\s+[A-Z]{2,}$/) && // not all caps two words (likely section)
                            trimmedLine.split(/\s+/).length <= 5; // reasonable name length
        
        // Additional check: if it's the very first line and looks like a name
        const isFirstLine = i === 0;
        const wordCount = trimmedLine.split(/\s+/).length;
        const hasProperCase = trimmedLine.match(/^[A-Z][a-z]+/);
        const isAllCapsName = trimmedLine === trimmedLine.toUpperCase() && wordCount >= 2 && wordCount <= 4;
        
        if (isLikelyName || (isFirstLine && wordCount >= 1 && wordCount <= 4 && (hasProperCase || isAllCapsName))) {
          result.contact.name = cleanMarkdown(trimmedLine);
          foundName = true;
          currentSection = 'contactInfo';
          // Don't add this line to sections, it's the name
          continue;
        }
      }
      
      // Add content to current section
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push(trimmedLine);
    }
  }
  
  // If we still haven't found a name, try extracting from the entire text
  if (!foundName || !result.contact.name || result.contact.name.trim() === '') {
    // Try to find name in first few lines more aggressively
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i].trim();
      if (!line || line.length < 2 || line.length > 80) continue;
      
      // Skip if it's clearly not a name
      if (line.match(/^[#*\-•]/) || 
          extractEmail(line) || 
          extractPhone(line) ||
          line.match(/^(PROFESSIONAL|WORK|EDUCATION|SKILLS|CERTIFICATIONS|SUMMARY|EXPERIENCE|CONTACT|ABOUT)/i) ||
          line.match(/^\d/)) {
        continue;
      }
      
      // If it looks like a name (2-4 words, mostly letters)
      const words = line.split(/\s+/);
      if (words.length >= 1 && words.length <= 4 && 
          words.every(w => /^[A-Za-z\-']+$/.test(w)) &&
          line.length >= 3 && line.length <= 50) {
        result.contact.name = cleanMarkdown(line);
        foundName = true;
        break;
      }
    }
  }

  // Parse contact info from the contactInfo section
  if (sections['contactInfo']) {
    const contactLines = sections['contactInfo'].join(' ');

    // Extract email
    result.contact.email = extractEmail(contactLines);

    // Extract phone
    result.contact.phone = extractPhone(contactLines);

    // Extract LinkedIn
    result.contact.linkedin = extractLinkedIn(contactLines);

    // Extract location (usually in **bold** or first part before |)
    const locationMatch = contactLines.match(/\*\*([^*]+)\*\*/);
    if (locationMatch) {
      result.contact.location = locationMatch[1].trim();
    } else {
      // Try to find location from pipe-separated format
      const parts = contactLines.split('|').map(p => p.trim());
      if (parts.length > 0) {
        const firstPart = cleanMarkdown(parts[0]);
        if (firstPart && !firstPart.includes('@') && !firstPart.match(/^\+?\d/)) {
          result.contact.location = firstPart;
        }
      }
    }
  }

  // Parse summary
  if (sections['summary']) {
    result.summary = sections['summary']
      .map(line => cleanMarkdown(line))
      .join(' ')
      .replace(/^[-•*]\s*/g, '')
      .trim();
  }

  // Parse experience
  if (sections['experience']) {
    const expLines = sections['experience'];
    let currentExp: WorkExperience | null = null;

    // Enhanced period pattern - handles various date formats
    const periodPatterns = [
      /\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Now)/i, // 2024 - 2025 or 2024 - Present
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\d{4}/i, // Aug 2024 – Oct 2024
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*(?:Present|Current|Now)/i, // Aug 2024 – Present
      /\d{1,2}\/\d{4}\s*[-–]\s*(?:\d{1,2}\/\d{4}|Present|Current|Now)/i, // 08/2024 - 10/2024
    ];

    const hasPeriod = (text: string): string | null => {
      for (const pattern of periodPatterns) {
        const match = text.match(pattern);
        if (match) return match[0];
      }
      return null;
    };

    for (const line of expLines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      // Check for job title (markdown bold: **Title** or plain text with | separator)
      const titleMatch = cleanLine.match(/^\*\*([^*|]+)\*\*/);
      const hasPipeSeparator = cleanLine.includes('|');
      const periodMatch = hasPeriod(cleanLine);
      
      // More flexible: if line has pipe separator OR period OR markdown title, it might be a job entry
      const looksLikeJobEntry = titleMatch || 
                                (hasPipeSeparator && !cleanLine.match(/^[-•*]/)) ||
                                (periodMatch && !cleanLine.match(/^[-•*]/) && cleanLine.length < 50);
      
      if (looksLikeJobEntry) {
        // Save previous experience
        if (currentExp && (currentExp.title || currentExp.company || currentExp.bullets.length > 0)) {
          result.experience.push(currentExp);
        }

        if (titleMatch) {
          currentExp = {
            title: titleMatch[1].trim(),
            company: '',
            period: '',
            bullets: [],
          };
          // Check if company and period are on same line
          const restOfLine = cleanLine.replace(/^\*\*[^*]+\*\*\s*/, '');
          if (restOfLine) {
            const period = hasPeriod(restOfLine);
            if (period) {
              currentExp.period = period;
            }
            // Extract company (usually after | or before period)
            const companyPart = restOfLine.replace(/\|?\s*[A-Z]{3}\s+\d{4}\s*[-–].*$/i, '') // Remove month-year period
                                          .replace(/\|?\s*\d{4}\s*[-–].*$/i, '') // Remove year period
                                          .replace(/^\|?\s*/, '').trim();
            if (companyPart && !companyPart.match(/^\d/)) {
              currentExp.company = cleanMarkdown(companyPart);
            }
          }
        } else {
          // Plain text format: could be "Title | Company | Period" or "Period" or "Title | Company"
          const parts = cleanLine.split('|').map(p => p.trim());
          const period = hasPeriod(cleanLine);
          
          // If period is found, extract it
          let title = '';
          let company = '';
          
          if (period) {
            // Period found - could be on its own line or part of a pipe-separated line
            if (hasPipeSeparator) {
              // Format: "Title | Company | Period" or "Period | Title | Company"
              const periodIndex = parts.findIndex(p => p.includes(period));
              if (periodIndex >= 0) {
                parts.splice(periodIndex, 1); // Remove period from parts
              }
              title = parts[0] || '';
              company = parts.length > 1 ? parts[1] : '';
            } else {
              // Period on its own line - this will be handled below
              currentExp = {
                title: '',
                company: '',
                period: period,
                bullets: [],
              };
              continue; // Skip to next line to get title/company
            }
          } else if (hasPipeSeparator) {
            // No period but has pipe - likely "Title | Company"
            title = parts[0] || '';
            company = parts.length > 1 ? parts[1] : '';
          } else {
            // Single item - could be title, company, or period
            // If it looks like a period, handle it
            if (period) {
              currentExp = {
                title: '',
                company: '',
                period: period,
                bullets: [],
              };
              continue;
            }
            // Otherwise, treat as title if we don't have one yet
            title = cleanLine;
          }
          
          if (!currentExp) {
            currentExp = {
              title: cleanMarkdown(title),
              company: cleanMarkdown(company),
              period: period || '',
              bullets: [],
            };
          } else {
            // Update existing entry
            if (!currentExp) {
              currentExp = {
                title: cleanMarkdown(title),
                company: cleanMarkdown(company),
                period: period || '',
                bullets: [],
              };
            } else {
              if (title && !currentExp.title) currentExp.title = cleanMarkdown(title);
              if (company && !currentExp.company) currentExp.company = cleanMarkdown(company);
            }
          }
        }
      }
      // Check for company line (if not on title line and we have a current entry)
      else if (currentExp && !currentExp.company && cleanLine.match(/^[A-Z]/) && !cleanLine.match(/^[-•*]/)) {
        const period = hasPeriod(cleanLine);
        if (period) {
          if (!currentExp.period) currentExp.period = period;
          currentExp.company = cleanMarkdown(cleanLine.replace(period, '').replace(/\|/g, '').trim());
        } else {
          currentExp.company = cleanMarkdown(cleanLine);
        }
      }
      // Check for title line (if we have period but no title)
      else if (currentExp && currentExp.period && !currentExp.title && !cleanLine.match(/^[-•*]/)) {
        const period = hasPeriod(cleanLine);
        if (!period) { // This line doesn't have a period, so it might be the title
          if (hasPipeSeparator) {
            const parts = cleanLine.split('|').map(p => p.trim());
            currentExp.title = cleanMarkdown(parts[0] || '');
            if (parts.length > 1 && !currentExp.company) {
              currentExp.company = cleanMarkdown(parts[1]);
            }
          } else {
            currentExp.title = cleanMarkdown(cleanLine);
          }
        }
      }
      // Check for bullet points
      else if (cleanLine.match(/^[-•*]\s+/)) {
        if (currentExp) {
          const bullet = cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, ''));
          if (bullet) {
            currentExp.bullets.push(bullet);
          }
        } else {
          // Bullet point without a job entry - create a minimal entry
          currentExp = {
            title: '',
            company: '',
            period: '',
            bullets: [cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, ''))],
          };
        }
      }
      // Check for period on its own line (if we don't have one yet)
      else if (currentExp && !currentExp.period) {
        const period = hasPeriod(cleanLine);
        if (period) {
          currentExp.period = period;
        }
      }
      // If we have a current entry but this line doesn't match any pattern, add it as a bullet
      else if (currentExp && cleanLine.length > 10) {
        // Might be a description line without bullet marker
        currentExp.bullets.push(cleanMarkdown(cleanLine));
      }
      // If no current entry and this looks like it could be a job entry, start one
      else if (!currentExp && !cleanLine.match(/^[-•*]/) && cleanLine.length > 5) {
        const period = hasPeriod(cleanLine);
        if (period || hasPipeSeparator) {
          currentExp = {
            title: hasPipeSeparator ? cleanLine.split('|')[0].trim() : '',
            company: hasPipeSeparator && cleanLine.split('|').length > 1 ? cleanLine.split('|')[1].trim() : '',
            period: period || '',
            bullets: [],
          };
        }
      }
    }

    // Don't forget the last experience
    if (currentExp && (currentExp.title || currentExp.company || currentExp.bullets.length > 0)) {
      result.experience.push(currentExp);
    }
  }

  // Parse education
  if (sections['education']) {
    const eduLines = sections['education'];
    let currentEdu: Education | null = null;

    for (const line of eduLines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      // Check for degree (markdown bold or contains degree keywords, or pipe-separated format)
      const degreeMatch = cleanLine.match(/^\*\*([^*]+)\*\*/) ||
        cleanLine.match(/(Bachelor|Master|PhD|B\.|M\.|MBA|BSc|MSc|BE|B\.Tech|M\.Tech|BS|MS)[^|]*/i);
      
      const hasPipeSeparator = cleanLine.includes('|');
      const hasYear = cleanLine.match(/\d{4}/);

      if (degreeMatch || (hasPipeSeparator && hasYear && !cleanLine.match(/^[-•*]/))) {
        // Save previous education
        if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
          result.education.push(currentEdu);
        }

        if (degreeMatch) {
          currentEdu = {
            degree: cleanMarkdown(degreeMatch[1] || degreeMatch[0]),
            institution: '',
            period: '',
          };
          // Extract period from same line
          const periodMatch = cleanLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Expected))/i);
          if (periodMatch) {
            currentEdu.period = periodMatch[1];
          }
        } else if (hasPipeSeparator) {
          // Format: "Degree | Institution | Period" or "Degree | Institution | Year"
          const parts = cleanLine.split('|').map(p => p.trim());
          const periodMatch = cleanLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Expected))/i);
          
          currentEdu = {
            degree: parts[0] || '',
            institution: parts.length > 1 ? parts[1] : '',
            period: periodMatch ? periodMatch[1] : (parts.length > 2 ? parts[2] : ''),
          };
        }
      }
      // Check for institution
      else if (currentEdu && cleanLine.match(/University|College|Institute|School/i)) {
        currentEdu.institution = cleanMarkdown(cleanLine.replace(/\|.*$/, ''));

        // Extract period if present
        const periodMatch = cleanLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Expected))/i);
        if (periodMatch && !currentEdu.period) {
          currentEdu.period = periodMatch[1];
        }
      }
      // Check for period on its own
      else if (currentEdu && !currentEdu.period) {
        const periodMatch = cleanLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Expected))/i);
        if (periodMatch) {
          currentEdu.period = periodMatch[1];
        }
      }
    }

    // Don't forget the last education
    if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
      result.education.push(currentEdu);
    }
  }

  // Parse skills
  if (sections['skills']) {
    const skillLines = sections['skills'];
    let currentCategory = 'General';

    for (const line of skillLines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine === '--' || cleanLine === '---') continue;

      // Check for category header (bold or with colon)
      const categoryMatch = cleanLine.match(/^\*\*([^*:]+)\*\*:?\s*(.*)/) ||
        cleanLine.match(/^([A-Za-z\s]+):\s*(.+)/);

      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        const skillsText = categoryMatch[2] || '';

        if (!result.skills[currentCategory]) {
          result.skills[currentCategory] = [];
        }

        if (skillsText) {
          // Split by comma or semicolon, and also handle "Language: English – Fluent, Urdu – Native"
          const skills = skillsText.split(/[,;]/).map(s => {
            // Remove "– Fluent" or "– Native" type suffixes
            s = s.replace(/\s*–\s*(Fluent|Native|Proficient|Basic|Intermediate|Advanced).*$/i, '').trim();
            return cleanMarkdown(s);
          }).filter(Boolean);
          result.skills[currentCategory].push(...skills);
        }
      }
      // Bullet point skills
      else if (cleanLine.match(/^[-•*]\s+/)) {
        const skill = cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, ''));
        if (skill) {
          if (!result.skills[currentCategory]) {
            result.skills[currentCategory] = [];
          }
          result.skills[currentCategory].push(skill);
        }
      }
      // Plain text skills (comma-separated) - handle uppercase languages like "ENGLISH, URDU, ARABIC"
      else if (cleanLine.includes(',') && !cleanLine.match(/^[-•*]/)) {
        const skills = cleanLine.split(',').map(s => {
          s = s.replace(/\s*–\s*(Fluent|Native|Proficient|Basic|Intermediate|Advanced).*$/i, '').trim();
          return cleanMarkdown(s);
        }).filter(Boolean);
        if (!result.skills[currentCategory]) {
          result.skills[currentCategory] = [];
        }
        result.skills[currentCategory].push(...skills);
      }
      // Single line with comma-separated skills (no category header)
      else if (cleanLine.includes(',')) {
        const skills = cleanLine.split(/[,;]/).map(s => {
          s = s.replace(/\s*–\s*(Fluent|Native|Proficient|Basic|Intermediate|Advanced).*$/i, '').trim();
          return cleanMarkdown(s);
        }).filter(Boolean);
        if (!result.skills[currentCategory]) {
          result.skills[currentCategory] = [];
        }
        result.skills[currentCategory].push(...skills);
      }
      // Single skill on a line (no comma, no bullet)
      else if (cleanLine.length > 2 && cleanLine.length < 50 && !cleanLine.match(/^[#*]/)) {
        const skill = cleanMarkdown(cleanLine);
        if (skill) {
          if (!result.skills[currentCategory]) {
            result.skills[currentCategory] = [];
          }
          result.skills[currentCategory].push(skill);
        }
      }
    }
  }

  // Parse certifications
  if (sections['certifications']) {
    for (const line of sections['certifications']) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine === '--' || cleanLine === '---') continue;

      if (cleanLine.match(/^[-•*]\s+/)) {
        const cert = cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, ''));
        if (cert) {
          result.certifications.push(cert);
        }
      } else if (!cleanLine.match(/^#/)) {
        result.certifications.push(cleanMarkdown(cleanLine));
      }
    }
  }

  // Parse languages
  if (sections['languages']) {
    result.languages = [];
    for (const line of sections['languages']) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine === '--' || cleanLine === '---') continue;

      if (cleanLine.match(/^[-•*]\s+/)) {
        result.languages.push(cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, '')));
      } else if (cleanLine.includes(',')) {
        const langs = cleanLine.split(/[,;]/).map(l => cleanMarkdown(l)).filter(Boolean);
        result.languages.push(...langs);
      } else if (!cleanLine.match(/^#/)) {
        result.languages.push(cleanMarkdown(cleanLine));
      }
    }
  }

  // Parse projects
  if (sections['projects']) {
    result.projects = [];
    let currentProject: { name: string; description: string } | null = null;

    for (const line of sections['projects']) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine === '--' || cleanLine === '---') continue;

      // Project name (bold)
      const projectMatch = cleanLine.match(/^\*\*([^*]+)\*\*/);
      if (projectMatch) {
        if (currentProject) {
          result.projects.push(currentProject);
        }
        currentProject = {
          name: projectMatch[1].trim(),
          description: cleanLine.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim(),
        };
      } else if (currentProject && cleanLine.match(/^[-•*]\s+/)) {
        const desc = cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, ''));
        currentProject.description += (currentProject.description ? ' ' : '') + desc;
      }
    }

    if (currentProject) {
      result.projects.push(currentProject);
    }
  }

  // Ensure we always have at least a name - if still missing, use "Unknown" or extract from text
  if (!result.contact.name || result.contact.name.trim() === '') {
    // Last resort: use first non-empty line that looks like a name
    for (const line of lines.slice(0, 20)) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length >= 2 && trimmed.length <= 50 && 
          !trimmed.match(/^[#*\-•]/) && 
          !extractEmail(trimmed) && 
          !extractPhone(trimmed) &&
          trimmed.split(/\s+/).length <= 4) {
        result.contact.name = cleanMarkdown(trimmed);
        break;
      }
    }
    
    // If still no name, use a default
    if (!result.contact.name || result.contact.name.trim() === '') {
      result.contact.name = 'Resume';
    }
  }

  return result;
}

/**
 * Check if text looks like a structured resume that can be parsed
 * Made more lenient to accept various formats
 */
export function isStructuredResume(text: string): boolean {
  if (!text || text.length < 50) return false;

  // Check for markdown headers
  const hasMarkdownHeaders = /^#{1,3}\s+/m.test(text);

  // Check for section keywords (more comprehensive)
  const hasSectionKeywords = /(professional summary|work experience|employment|education|skills|certifications|experience|summary|profile|objective|qualifications|academic)/i.test(text);

  // Check for structured formatting (bullet points, bold text, pipe separators)
  const hasFormatting = /(\*\*[^*]+\*\*|^[-•*]\s+|[\|\|])/m.test(text);

  // Check for ALL CAPS section headers (plain text format)
  const hasPlainTextHeaders = /^[A-Z\s]{10,50}$/m.test(text);

  // Accept if it has markdown headers OR (section keywords AND formatting) OR plain text headers
  return hasMarkdownHeaders || (hasSectionKeywords && hasFormatting) || (hasPlainTextHeaders && hasSectionKeywords);
}
