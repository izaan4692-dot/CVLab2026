/**
 * Simplified Resume Data types for template rendering
 */

export type SectionKey = 'summary' | 'experience' | 'skills' | 'education' | 'projects' | 'certifications' | 'languages';

export interface ResumeData {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  summary?: string;
  experience: {
    title: string;
    company: string;
    period: string;
    location?: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    period: string;
    details?: string[];
  }[];
  skills: string[];
  certifications: string[];
  languages: string[];
  projects?: {
    name: string;
    organization?: string;
    period?: string;
    details?: string[];
  }[];
  sectionOrder?: SectionKey[]; // Optional: order for ALL sections (summary, experience, skills, education, projects, certifications, languages)
  sectionLabels?: Partial<Record<SectionKey, string>>; // Optional: custom labels for sections (e.g., { experience: "Career History", skills: "Core Competencies" })
  primaryColor?: string; // Optional: primary/accent color (hex format, e.g., "#1D61CB") - used for name, section headings, borders, periods
}

/**
 * Convert ParsedResume to simplified ResumeData for templates
 */
import { ParsedResume } from './parseResumeText';
import { StructuredResumeData } from './api';

/**
 * Default section order: Summary, Experience, Skills, Education, Projects, Certifications, Languages
 */
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary',
  'experience',
  'skills',
  'education',
  'projects',
  'certifications',
  'languages'
];

/**
 * Default section labels by template type
 */
export type TemplateType = 'classic' | 'modern' | 'executive' | 'technical';

export const DEFAULT_SECTION_LABELS: Record<TemplateType, Record<SectionKey, string>> = {
  classic: {
    summary: 'Summary',
    experience: 'Work Experience',
    skills: 'Key Skills',
    education: 'Education',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
  },
  modern: {
    summary: 'Summary',
    experience: 'Professional Experience',
    skills: 'Skills',
    education: 'Education',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
  },
  executive: {
    summary: 'Summary',
    experience: 'Professional Experience',
    skills: 'Skills',
    education: 'Education',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
  },
  technical: {
    summary: 'Summary',
    experience: 'Professional Experience',
    skills: 'Technical Skills',
    education: 'Education',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
  },
};

/**
 * Get the label for a section, using custom label if provided, otherwise template default
 */
export function getSectionLabel(
  data: ResumeData,
  sectionKey: SectionKey,
  template: TemplateType = 'classic'
): string {
  // First check for custom label
  if (data.sectionLabels && data.sectionLabels[sectionKey]) {
    return data.sectionLabels[sectionKey]!;
  }
  
  // Fall back to template default
  return DEFAULT_SECTION_LABELS[template][sectionKey];
}

/**
 * Default primary colors by template type
 */
export const DEFAULT_PRIMARY_COLORS: Record<TemplateType, string> = {
  classic: '#004081',
  modern: '#111827', // gray-900
  executive: '#d4a574',
  technical: '#1D61CB',
};

/**
 * Get the primary color, using custom color if provided, otherwise template default
 */
export function getPrimaryColor(
  data: ResumeData,
  template: TemplateType = 'classic'
): string {
  // Use custom color if provided
  if (data.primaryColor) {
    return data.primaryColor;
  }
  
  // Fall back to template default
  return DEFAULT_PRIMARY_COLORS[template];
}

/**
 * Check if a section has data to display
 */
function hasSectionData(data: ResumeData, section: SectionKey): boolean {
  switch (section) {
    case 'summary':
      return !!data.summary && data.summary.trim().length > 0;
    case 'experience':
      return !!(data.experience && data.experience.length > 0);
    case 'skills':
      return !!(data.skills && data.skills.length > 0);
    case 'education':
      return !!(data.education && data.education.length > 0);
    case 'projects':
      return !!(data.projects && data.projects.length > 0);
    case 'certifications':
      return !!(data.certifications && data.certifications.length > 0);
    case 'languages':
      return !!(data.languages && data.languages.length > 0);
    default:
      return false;
  }
}

/**
 * Get the ordered section keys for rendering
 * Returns sections in the specified order, or default order if not specified
 * Only includes sections that have data
 */
export function getSectionOrder(data: ResumeData): SectionKey[] {
  const allSections: SectionKey[] = ['summary', 'experience', 'skills', 'education', 'projects', 'certifications', 'languages'];
  
  if (data.sectionOrder && data.sectionOrder.length > 0) {
    // Validate and filter to only include valid sections that have data
    const validSections: SectionKey[] = [];
    
    // Add sections from custom order that have data
    for (const section of data.sectionOrder) {
      if (allSections.includes(section) && hasSectionData(data, section)) {
        validSections.push(section);
      }
    }
    
    // Add any missing sections that have data but weren't in the custom order
    for (const section of allSections) {
      if (!validSections.includes(section) && hasSectionData(data, section)) {
        validSections.push(section);
      }
    }
    
    return validSections;
  }
  
  // Default order, but only include sections that have data
  const defaultOrder: SectionKey[] = [];
  for (const section of DEFAULT_SECTION_ORDER) {
    if (hasSectionData(data, section)) {
      defaultOrder.push(section);
    }
  }
  
  return defaultOrder;
}

/**
 * Convert structured JSON from LLM directly to ResumeData (no parsing needed!)
 */
export function convertStructuredToResumeData(structured: StructuredResumeData): ResumeData {
  // Flatten skills from Record<string, string[]> to string[]
  const flatSkills: string[] = [];
  for (const category in structured.skills) {
    if (structured.skills[category] && Array.isArray(structured.skills[category])) {
      flatSkills.push(...structured.skills[category]);
    }
  }

  return {
    name: structured.contact.name || 'Resume',
    title: structured.contact.title,
    email: structured.contact.email,
    phone: structured.contact.phone,
    location: structured.contact.location,
    website: structured.contact.website,
    linkedin: structured.contact.linkedin,
    summary: structured.summary,
    experience: (structured.experience || []).map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      period: exp.period || '',
      location: exp.location,
      bullets: exp.bullets || [],
    })),
    education: (structured.education || []).map(edu => ({
      degree: edu.degree || '',
      institution: edu.institution || '',
      period: edu.period || '',
      details: edu.details || [],
    })),
    skills: flatSkills,
    certifications: structured.certifications || [],
    languages: structured.languages || [],
    projects: structured.projects?.map(proj => ({
      name: proj.name || '',
      details: proj.description ? [proj.description, ...(proj.details || [])] : (proj.details || []),
    })),
    sectionOrder: structured.sectionOrder, // Pass through section order from backend/LLM
    sectionLabels: structured.sectionLabels, // Pass through section labels from backend/LLM
    primaryColor: structured.primaryColor, // Pass through primary color from backend/LLM
  };
}

export function convertToResumeData(parsed: ParsedResume): ResumeData | null {
  if (!parsed) {
    return null;
  }

  // Flatten skills from Record<string, string[]> to string[]
  const flatSkills: string[] = [];
  for (const category in parsed.skills) {
    if (parsed.skills[category] && Array.isArray(parsed.skills[category])) {
      flatSkills.push(...parsed.skills[category]);
    }
  }

  // Ensure we have at least a name
  const name = parsed.contact?.name || 'Resume';

  return {
    name: name,
    title: parsed.contact?.title,
    email: parsed.contact?.email,
    phone: parsed.contact?.phone,
    location: parsed.contact?.location,
    website: parsed.contact?.website,
    linkedin: parsed.contact?.linkedin,
    summary: parsed.summary,
    experience: (parsed.experience || []).map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      period: exp.period || '',
      bullets: exp.bullets || [],
    })),
    education: (parsed.education || []).map(edu => ({
      degree: edu.degree || '',
      institution: edu.institution || '',
      period: edu.period || '',
      details: edu.details || [],
    })),
    skills: flatSkills,
    certifications: parsed.certifications || [],
    languages: parsed.languages || [],
    projects: parsed.projects?.map(proj => ({
      name: proj.name || '',
      details: proj.description ? [proj.description] : [],
    })),
  };
}
