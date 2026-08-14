/**
 * PDF Templates using @react-pdf/renderer
 * These templates generate real text-based PDFs (selectable, searchable, editable)
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { ResumeData, getSectionOrder, getSectionLabel, getPrimaryColor, SectionKey } from './resumeDataTypes';

// Translation helper for PDF templates
type Language = 'en' | 'ar';

const pdfTranslations: Record<Language, Record<string, string>> = {
  en: {
    'resume.summary': 'Summary',
    'resume.professionalSummary': 'Professional Summary',
    'resume.workExperience': 'Work Experience',
    'resume.professionalExperience': 'Professional Experience',
    'resume.education': 'Education',
    'resume.skills': 'Skills',
    'resume.keySkills': 'Key Skills',
    'resume.technicalSkills': 'Technical Skills',
    'resume.certifications': 'Certifications',
    'resume.languages': 'Languages',
    'resume.projects': 'Projects',
    'resume.additionalInformation': 'Additional Information',
  },
  ar: {
    'resume.summary': 'الملخص',
    'resume.professionalSummary': 'الملخص المهني',
    'resume.workExperience': 'الخبرة العملية',
    'resume.professionalExperience': 'الخبرة المهنية',
    'resume.education': 'التعليم',
    'resume.skills': 'المهارات',
    'resume.keySkills': 'المهارات الرئيسية',
    'resume.technicalSkills': 'المهارات التقنية',
    'resume.certifications': 'الشهادات',
    'resume.languages': 'اللغات',
    'resume.projects': 'المشاريع',
    'resume.additionalInformation': 'معلومات إضافية',
  },
};

function getPDFTranslation(language: Language, key: string, fallback: string): string {
  return pdfTranslations[language]?.[key] || fallback;
}

function getPDFSectionLabel(language: Language, data: ResumeData, sectionKey: SectionKey, template: 'classic' | 'modern' | 'executive' | 'technical'): string {
  // First check if there's a custom label from data
  const customLabel = data.sectionLabels?.[sectionKey];
  if (customLabel) return customLabel;
  
  // Return English labels directly (Arabic translation disabled)
  const englishLabels: Record<SectionKey, Record<string, string>> = {
    summary: { classic: 'Summary', modern: 'Summary', executive: 'Summary', technical: 'Summary' },
    experience: { classic: 'Work Experience', modern: 'Professional Experience', executive: 'Professional Experience', technical: 'Professional Experience' },
    skills: { classic: 'Skills', modern: 'Skills', executive: 'Key Skills', technical: 'Technical Skills' },
    education: { classic: 'Education', modern: 'Education', executive: 'Education', technical: 'Education' },
    projects: { classic: 'Projects', modern: 'Projects', executive: 'Projects', technical: 'Projects' },
    certifications: { classic: 'Certifications', modern: 'Certifications', executive: 'Certifications', technical: 'Certifications' },
    languages: { classic: 'Languages', modern: 'Languages', executive: 'Languages', technical: 'Languages' },
  };
  
  return englishLabels[sectionKey]?.[template] || getSectionLabel(data, sectionKey, template);
}

// Register fonts using runtime fetch (works with both webpack and Turbopack)
// This approach fetches fonts from public folder and registers them
const isBrowser = typeof window !== 'undefined';
const baseUrl = isBrowser ? window.location.origin : '';

// Font registration state
let fontsRegistered = false;
let fontRegistrationPromise: Promise<void> | null = null;

// Helper to fetch and register font with proper data URL format
async function registerFontFromUrl(family: string, url: string, fontWeight: number | 'normal' | 'bold'): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }
    const fontData = await response.arrayBuffer();
    
    // Convert ArrayBuffer to base64 data URL with proper format
    const bytes = new Uint8Array(fontData);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    // Use application/octet-stream instead of font/truetype for better compatibility
    const dataUrl = `data:application/octet-stream;base64,${base64}`;
    
    // Ensure dataUrl is a string before registering
    if (typeof dataUrl !== 'string') {
      throw new Error('Failed to convert font to data URL string');
    }
    
    Font.register({
      family,
      src: dataUrl,
      fontWeight: fontWeight as any,
    });
    
    console.log(`[PDF] Registered ${family} ${fontWeight} successfully`);
    return true;
  } catch (error) {
    console.error(`[PDF] Failed to register ${family} ${fontWeight}:`, error);
    return false;
  }
}

// Function to ensure fonts are registered before PDF generation
export async function ensureFontsRegistered(): Promise<void> {
  if (fontsRegistered) {
    return;
  }

  if (!isBrowser) {
    return;
  }

  if (fontRegistrationPromise) {
    return fontRegistrationPromise;
  }

  fontRegistrationPromise = (async () => {
    try {
      // Register Poppins as 'Inter' (similar font, static TTF files)
      const interResults = await Promise.all([
        registerFontFromUrl('Inter', `${baseUrl}/fonts/Poppins-Regular.ttf`, 'normal'),
        registerFontFromUrl('Inter', `${baseUrl}/fonts/Poppins-SemiBold.ttf`, 600),
        registerFontFromUrl('Inter', `${baseUrl}/fonts/Poppins-Bold.ttf`, 'bold'),
      ]);

      // Also register DM Sans
      const dmSansResults = await Promise.all([
        registerFontFromUrl('DM Sans', `${baseUrl}/fonts/DMSans-Regular.ttf`, 'normal'),
        registerFontFromUrl('DM Sans', `${baseUrl}/fonts/DMSans-SemiBold.ttf`, 600),
        registerFontFromUrl('DM Sans', `${baseUrl}/fonts/DMSans-Bold.ttf`, 'bold'),
      ]);

      // Register Almarai for Arabic support
      const almaraiResults = await Promise.all([
        registerFontFromUrl('Almarai', `${baseUrl}/fonts/Almarai/Almarai-Regular.ttf`, 'normal'),
        registerFontFromUrl('Almarai', `${baseUrl}/fonts/Almarai/Almarai-Bold.ttf`, 'bold'),
        registerFontFromUrl('Almarai', `${baseUrl}/fonts/Almarai/Almarai-ExtraBold.ttf`, 800),
      ]);

      if (interResults.every(r => r) && dmSansResults.every(r => r) && almaraiResults.every(r => r)) {
        fontsRegistered = true;
        console.log('[PDF] All fonts registered successfully (including Arabic)');
      } else {
        console.warn('[PDF] Some fonts failed to register');
      }
    } catch (error) {
      console.error('[PDF] Error registering fonts:', error);
    }
  })();

  return fontRegistrationPromise;
}

// Pre-register fonts on module load (non-blocking)
if (isBrowser) {
  ensureFontsRegistered().catch(console.error);
}

// Use Inter font for English, Almarai for Arabic
const getFontFamily = (language: Language) => language === 'ar' ? 'Almarai' : 'Inter';

// ============================================
// CLASSIC TEMPLATE
// ============================================
const classicStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 700,
    color: '#004081',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    fontSize: 10,
    color: '#4b5563',
  },
  contactItem: {
    marginHorizontal: 4,
  },
  separator: {
    marginHorizontal: 4,
  },
  headerLine: {
    height: 3,
    backgroundColor: '#004081',
    marginBottom: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sectionLabelContainer: {
    width: 120,
    flexDirection: 'column',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#004081',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#004081',
    marginBottom: 12,
  },
  experienceItem: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  expCompany: {
    fontSize: 11,
    fontWeight: 700,
  },
  expLocation: {
    fontSize: 11,
    fontWeight: 400,
  },
  expPeriod: {
    fontSize: 11,
    fontWeight: 400,
  },
  bullet: {
    flexDirection: 'row',
    marginLeft: 12,
    marginTop: 2,
  },
  bulletPoint: {
    width: 8,
    fontSize: 11,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 2,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
  },
});

export function ClassicPDFTemplate({ data, language = 'en' }: { data: ResumeData; language?: Language }) {
  const sectionOrder = getSectionOrder(data);
  const primaryColor = getPrimaryColor(data, 'classic');
  const isRTL = false; // RTL disabled for Arabic
  const fontFamily = getFontFamily(language);
  
  // Create RTL-aware styles
  const rtlStyles = {
    sectionRow: { ...classicStyles.sectionRow, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
    sectionLabel: { ...classicStyles.sectionLabel, textAlign: isRTL ? 'right' as any : 'left' as any },
    sectionContent: { ...classicStyles.sectionContent, textAlign: isRTL ? 'right' as any : 'left' as any },
    text: { ...classicStyles.text, textAlign: isRTL ? 'right' as any : 'left' as any },
    expTitle: { ...classicStyles.expTitle, textAlign: isRTL ? 'right' as any : 'left' as any },
    bulletText: { ...classicStyles.bulletText, textAlign: isRTL ? 'right' as any : 'left' as any },
    expHeader: { ...classicStyles.expHeader, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
    bullet: { ...classicStyles.bullet, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 },
    contactRow: { ...classicStyles.contactRow, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
    skillItem: { ...classicStyles.skillItem, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
  };
  
  const renderSection = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'summary':
        if (!data.summary || data.summary.trim().length === 0) return null;
        return (
          <>
            <View style={rtlStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={[rtlStyles.sectionLabel, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'summary', 'classic')}</Text>
              </View>
              <Text style={[rtlStyles.sectionContent, rtlStyles.text, { fontFamily }]}>{data.summary}</Text>
            </View>
            <View style={[classicStyles.divider, { backgroundColor: primaryColor }]} />
          </>
        );
      
      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        const expLabel = getPDFSectionLabel(language, data, 'experience', 'classic');
        return (
          <>
            <View style={rtlStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                {(() => {
                  if (language === 'ar') {
                    return <Text style={[rtlStyles.sectionLabel, { color: primaryColor, fontFamily }]}>{expLabel}</Text>;
                  }
                  if (expLabel === 'Work Experience') {
                    return (
                      <>
                        <Text style={[classicStyles.sectionLabel, { fontFamily }]}>Work</Text>
                        <Text style={[classicStyles.sectionLabel, { fontFamily }]}>Experience</Text>
                      </>
                    );
                  }
                  return <Text style={[rtlStyles.sectionLabel, { color: primaryColor, fontFamily }]}>{expLabel}</Text>;
                })()}
              </View>
              <View style={rtlStyles.sectionContent}>
                {data.experience.map((exp, idx) => (
                  <View key={idx} style={classicStyles.experienceItem}>
                    <View>
                      <Text style={[rtlStyles.expTitle, { fontFamily, lineHeight: 1.2 }]}>{exp.title}</Text>
                      <Text style={[{ fontFamily, lineHeight: 1.2 }]}>
                        <Text style={[classicStyles.expCompany, { fontFamily }]}>{exp.company}</Text>
                        {exp.company && exp.location && <Text style={{ fontFamily }}> | </Text>}
                        {exp.location && <Text style={[classicStyles.expLocation, { fontFamily }]}>{exp.location}</Text>}
                        {(exp.company || exp.location) && exp.period && <Text style={{ fontFamily }}> | </Text>}
                        {exp.period && <Text style={[classicStyles.expPeriod, { fontFamily }]}>{exp.period}</Text>}
                      </Text>
                    </View>
                    {exp.bullets && exp.bullets.map((bullet, bIdx) => (
                      <View key={bIdx} style={rtlStyles.bullet}>
                        <Text style={[classicStyles.bulletPoint, { fontFamily }]}>•</Text>
                        <Text style={[rtlStyles.bulletText, { fontFamily }]}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <View style={[classicStyles.divider, { backgroundColor: primaryColor }]} />
          </>
        );
      
      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        return (
          <>
            <View style={rtlStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={[rtlStyles.sectionLabel, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'skills', 'classic')}</Text>
              </View>
              <View style={[rtlStyles.sectionContent, classicStyles.skillsGrid]}>
                {data.skills.map((skill, idx) => (
                  <View key={idx} style={rtlStyles.skillItem}>
                    <Text style={[classicStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.text, { fontFamily }]}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[classicStyles.divider, { backgroundColor: primaryColor }]} />
          </>
        );
      
      case 'education':
        if (!data.education || data.education.length === 0) return null;
        return (
          <>
            <View style={rtlStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={[rtlStyles.sectionLabel, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'education', 'classic')}</Text>
              </View>
              <View style={rtlStyles.sectionContent}>
                {data.education.map((edu, idx) => (
                  <View key={idx} style={classicStyles.experienceItem}>
                    <View style={rtlStyles.expHeader}>
                      <Text style={[rtlStyles.expTitle, { fontFamily }]}>{edu.degree}</Text>
                      <Text style={[classicStyles.expPeriod, { fontFamily }]}>{edu.period}</Text>
                    </View>
                    <Text style={[rtlStyles.text, { fontFamily }]}>{edu.institution}</Text>
                    {edu.details && edu.details.map((detail, dIdx) => (
                      <View key={dIdx} style={rtlStyles.bullet}>
                        <Text style={[classicStyles.bulletPoint, { fontFamily }]}>•</Text>
                        <Text style={[rtlStyles.bulletText, { fontFamily }]}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <View style={[classicStyles.divider, { backgroundColor: primaryColor }]} />
          </>
        );
      
      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <>
            <View style={rtlStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={[rtlStyles.sectionLabel, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'projects', 'classic')}</Text>
              </View>
              <View style={rtlStyles.sectionContent}>
                {data.projects.map((project, idx) => (
                  <View key={idx} style={classicStyles.experienceItem}>
                    <View style={rtlStyles.expHeader}>
                      <Text style={[rtlStyles.expTitle, { fontFamily }]}>{project.name}</Text>
                      {project.period && <Text style={[classicStyles.expPeriod, { fontFamily }]}>{project.period}</Text>}
                    </View>
                    {project.organization && <Text style={[rtlStyles.text, { fontFamily }]}>{project.organization}</Text>}
                    {project.details && project.details.map((detail, dIdx) => (
                      <View key={dIdx} style={rtlStyles.bullet}>
                        <Text style={[classicStyles.bulletPoint, { fontFamily }]}>•</Text>
                        <Text style={[rtlStyles.bulletText, { fontFamily }]}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <View style={[classicStyles.divider, { backgroundColor: primaryColor }]} />
          </>
        );
      
      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <>
            <View style={rtlStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={[rtlStyles.sectionLabel, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'certifications', 'classic')}</Text>
              </View>
              <View style={rtlStyles.sectionContent}>
                {data.certifications.map((cert, idx) => (
                  <View key={idx} style={rtlStyles.bullet}>
                    <Text style={[classicStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{cert}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[classicStyles.divider, { backgroundColor: primaryColor }]} />
          </>
        );
      
      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <View style={rtlStyles.sectionRow}>
            <View style={classicStyles.sectionLabelContainer}>
              <Text style={[rtlStyles.sectionLabel, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'languages', 'classic')}</Text>
            </View>
            <Text style={[rtlStyles.sectionContent, rtlStyles.text, { fontFamily }]}>
              {data.languages.join(', ')}
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={[classicStyles.page, { fontFamily, direction: isRTL ? 'rtl' : 'ltr' }]}>
        {/* Header */}
        <View style={classicStyles.header}>
          <Text style={[classicStyles.name, { color: primaryColor, fontFamily }]}>{data.name || 'Your Name'}</Text>
          <View style={rtlStyles.contactRow}>
            {data.email && <Text style={[classicStyles.contactItem, { fontFamily }]}>{data.email}</Text>}
            {data.email && data.phone && <Text style={[classicStyles.separator, { fontFamily }]}>|</Text>}
            {data.phone && <Text style={[classicStyles.contactItem, { fontFamily }]}>{data.phone}</Text>}
            {(data.email || data.phone) && data.location && <Text style={[classicStyles.separator, { fontFamily }]}>|</Text>}
            {data.location && <Text style={[classicStyles.contactItem, { fontFamily }]}>{data.location}</Text>}
          </View>
        </View>

        <View style={[classicStyles.headerLine, { backgroundColor: primaryColor }]} />

        {/* All sections rendered in order */}
        <View style={{ marginTop: 4 }}>
          {sectionOrder.map((sectionKey) => (
            <React.Fragment key={sectionKey}>
              {renderSection(sectionKey)}
            </React.Fragment>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ============================================
// MODERN TEMPLATE
// ============================================
const modernStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    fontSize: 10,
    color: '#4b5563',
  },
  contactItem: {
    marginHorizontal: 4,
  },
  separator: {
    marginHorizontal: 4,
  },
  headerLine: {
    height: 3,
    backgroundColor: '#111827',
    marginTop: 4,
    marginBottom: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitleContainer: {
    marginBottom: 6,
    paddingBottom: 4,
    minHeight: 20,
  },
  sectionTitleBorderBottom: {
    height: 1,
    backgroundColor: '#9ca3af',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  experienceItem: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  expCompany: {
    fontSize: 11,
    fontWeight: 700,
  },
  expLocation: {
    fontSize: 11,
    fontWeight: 400,
  },
  expPeriod: {
    fontSize: 11,
    fontWeight: 400,
  },
  bullet: {
    flexDirection: 'row',
    marginLeft: 8,
    marginTop: 2,
  },
  bulletPoint: {
    width: 10,
    fontSize: 11,
    color: '#374151',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    width: '33.33%',
    fontSize: 10,
    marginBottom: 3,
    color: '#374151',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
  },
});

export function ModernPDFTemplate({ data, language = 'en' }: { data: ResumeData; language?: Language }) {
  const sectionOrder = getSectionOrder(data);
  const primaryColor = getPrimaryColor(data, 'modern');
  const isRTL = false; // RTL disabled for Arabic
  const fontFamily = getFontFamily(language);
  
  // Create RTL-aware styles
  const rtlStyles = {
    sectionTitle: { ...modernStyles.sectionTitle, textAlign: isRTL ? 'right' as any : 'left' as any },
    text: { ...modernStyles.text, textAlign: isRTL ? 'right' as any : 'left' as any },
    expTitle: { ...modernStyles.expTitle, textAlign: isRTL ? 'right' as any : 'left' as any },
    expPeriod: { ...modernStyles.expPeriod, textAlign: isRTL ? 'right' as any : 'left' as any },
    bullet: { ...modernStyles.bullet, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 },
    bulletText: { ...modernStyles.bulletText, textAlign: isRTL ? 'right' as any : 'left' as any },
    expHeader: { ...modernStyles.expHeader, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
    contactRow: { ...modernStyles.contactRow, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
  };
  
  const renderSection = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'summary':
        if (!data.summary || data.summary.trim().length === 0) return null;
        return (
          <View style={modernStyles.section}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'summary', 'modern')}</Text>
              <View style={[modernStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            <Text style={[rtlStyles.text, { fontFamily }]}>{data.summary}</Text>
          </View>
        );
      
      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        return (
          <View style={modernStyles.section}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'experience', 'modern')}</Text>
              <View style={[modernStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={modernStyles.experienceItem}>
                <View>
                  <Text style={[rtlStyles.expTitle, { fontFamily, lineHeight: 1.2 }]}>{exp.title}</Text>
                  <Text style={[{ fontFamily, lineHeight: 1.2 }]}>
                    <Text style={[modernStyles.expCompany, { fontFamily }]}>{exp.company}</Text>
                    {exp.company && exp.location && <Text style={{ fontFamily }}> | </Text>}
                    {exp.location && <Text style={[modernStyles.expLocation, { fontFamily }]}>{exp.location}</Text>}
                    {(exp.company || exp.location) && exp.period && <Text style={{ fontFamily }}> | </Text>}
                    {exp.period && <Text style={[modernStyles.expPeriod, { fontFamily }]}>{exp.period}</Text>}
                  </Text>
                </View>
                {exp.bullets && exp.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={rtlStyles.bullet}>
                    <Text style={[modernStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      
      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        return (
          <View style={modernStyles.section}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'skills', 'modern')}</Text>
              <View style={[modernStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            <View style={modernStyles.skillsGrid}>
              {data.skills.map((skill, idx) => (
                <Text key={idx} style={[modernStyles.skillItem, { fontFamily, textAlign: isRTL ? 'right' as any : 'left' as any }]}>{skill}</Text>
              ))}
            </View>
          </View>
        );
      
      case 'education':
        if (!data.education || data.education.length === 0) return null;
        return (
          <View style={modernStyles.section}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'education', 'modern')}</Text>
              <View style={[modernStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.education.map((edu, idx) => (
              <View key={idx} style={modernStyles.experienceItem}>
                <View style={rtlStyles.expHeader}>
                  <Text style={[rtlStyles.expTitle, { fontFamily }]}>{edu.degree}</Text>
                  <Text style={[rtlStyles.expPeriod, { fontFamily }]}>{edu.period}</Text>
                </View>
                <Text style={[rtlStyles.text, { fontFamily }]}>{edu.institution}</Text>
                {edu.details && edu.details.map((detail, dIdx) => (
                  <View key={dIdx} style={rtlStyles.bullet}>
                    <Text style={[modernStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      
      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <View style={modernStyles.section}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'projects', 'modern')}</Text>
              <View style={[modernStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.projects.map((project, idx) => (
              <View key={idx} style={modernStyles.experienceItem}>
                <View style={rtlStyles.expHeader}>
                  <Text style={[rtlStyles.expTitle, { fontFamily }]}>{project.name}</Text>
                  {project.period && <Text style={[rtlStyles.expPeriod, { fontFamily }]}>{project.period}</Text>}
                </View>
                {project.organization && <Text style={[rtlStyles.text, { fontFamily }]}>{project.organization}</Text>}
                {project.details && project.details.map((detail, dIdx) => (
                  <View key={dIdx} style={rtlStyles.bullet}>
                    <Text style={[modernStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      
      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <View style={modernStyles.section}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'certifications', 'modern')}</Text>
              <View style={[modernStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.certifications.map((cert, idx) => (
              <View key={idx} style={rtlStyles.bullet}>
                <Text style={[modernStyles.bulletPoint, { fontFamily }]}>•</Text>
                <Text style={[rtlStyles.bulletText, { fontFamily }]}>{cert}</Text>
              </View>
            ))}
          </View>
        );
      
      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <View style={modernStyles.section}>
            <View style={modernStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'languages', 'modern')}</Text>
              <View style={[modernStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            <Text style={[rtlStyles.text, { fontFamily }]}>{data.languages.join(', ')}</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={[modernStyles.page, { fontFamily, direction: isRTL ? 'rtl' : 'ltr' }]}>
        {/* Header */}
        <View style={modernStyles.header}>
          <Text style={[modernStyles.name, { color: primaryColor, fontFamily }]}>{data.name || 'Your Name'}</Text>
          <View style={rtlStyles.contactRow}>
            {data.email && <Text style={[modernStyles.contactItem, { fontFamily }]}>{data.email}</Text>}
            {data.email && data.phone && <Text style={[modernStyles.separator, { fontFamily }]}>|</Text>}
            {data.phone && <Text style={[modernStyles.contactItem, { fontFamily }]}>{data.phone}</Text>}
            {(data.email || data.phone) && data.location && <Text style={[modernStyles.separator, { fontFamily }]}>|</Text>}
            {data.location && <Text style={[modernStyles.contactItem, { fontFamily }]}>{data.location}</Text>}
          </View>
        </View>

        <View style={[modernStyles.headerLine, { backgroundColor: primaryColor }]} />

        {/* All sections rendered in order */}
        <View style={{ marginTop: 4 }}>
          {sectionOrder.map((sectionKey) => (
            <React.Fragment key={sectionKey}>
              {renderSection(sectionKey)}
            </React.Fragment>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ============================================
// EXECUTIVE TEMPLATE
// ============================================
const executiveStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    marginBottom: 12,
    textAlign: 'center',
  },
  name: {
    fontSize: 32,
    fontWeight: 700,
    color: '#111827',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 0,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    fontSize: 10,
    color: '#4b5563',
  },
  contactItem: {
    marginRight: 8,
  },
  separator: {
    marginRight: 8,
  },
  headerLine: {
    height: 2,
    backgroundColor: '#b45309',
    marginTop: 0,
    marginBottom: 3,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitleContainer: {
    marginBottom: 8,
    paddingBottom: 4,
    minHeight: 20,
  },
  sectionTitleBorderBottom: {
    height: 1,
    backgroundColor: '#d4a574',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  experienceItem: {
    marginBottom: 12,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitleContainer: {},
  expTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
  },
  expCompany: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
  },
  expLocation: {
    fontSize: 12,
    fontWeight: 400,
    color: '#111827',
  },
  expPeriod: {
    fontSize: 12,
    fontWeight: 400,
    color: '#111827',
  },
  bullet: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bulletPoint: {
    width: 10,
    fontSize: 11,
    color: '#9ca3af',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
  },
});

export function ExecutivePDFTemplate({ data, language = 'en' }: { data: ResumeData; language?: Language }) {
  const sectionOrder = getSectionOrder(data);
  const primaryColor = getPrimaryColor(data, 'executive');
  const isRTL = false; // RTL disabled for Arabic
  const fontFamily = getFontFamily(language);
  
  // Create RTL-aware styles
  const rtlStyles = {
    sectionTitle: { ...executiveStyles.sectionTitle, textAlign: isRTL ? 'right' as any : 'left' as any },
    text: { ...executiveStyles.text, textAlign: isRTL ? 'right' as any : 'left' as any },
    expTitle: { ...executiveStyles.expTitle, textAlign: isRTL ? 'right' as any : 'left' as any },
    expCompany: { ...executiveStyles.expCompany, textAlign: isRTL ? 'right' as any : 'left' as any },
    expPeriod: { ...executiveStyles.expPeriod, textAlign: isRTL ? 'right' as any : 'left' as any },
    bullet: { ...executiveStyles.bullet, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
    bulletText: { ...executiveStyles.bulletText, textAlign: isRTL ? 'right' as any : 'left' as any },
    expHeader: { ...executiveStyles.expHeader, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
    contactRow: { ...executiveStyles.contactRow, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
  };
  
  const renderSection = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'summary':
        if (!data.summary || data.summary.trim().length === 0) return null;
        return (
          <View style={executiveStyles.section}>
            <View style={executiveStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { fontFamily }]}>{getPDFSectionLabel(language, data, 'summary', 'executive')}</Text>
              <View style={[executiveStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            <Text style={[rtlStyles.text, { fontFamily }]}>{data.summary}</Text>
          </View>
        );
      
      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        return (
          <View style={executiveStyles.section}>
            <View style={executiveStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { fontFamily }]}>{getPDFSectionLabel(language, data, 'experience', 'executive')}</Text>
              <View style={[executiveStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={executiveStyles.experienceItem}>
                <View>
                  <Text style={[rtlStyles.expTitle, { fontFamily, lineHeight: 1.2 }]}>{exp.title}</Text>
                  <Text style={[{ fontFamily, lineHeight: 1.2 }]}>
                    <Text style={[modernStyles.expCompany, { fontFamily }]}>{exp.company}</Text>
                    {exp.company && exp.location && <Text style={{ fontFamily }}> | </Text>}
                    {exp.location && <Text style={[modernStyles.expLocation, { fontFamily }]}>{exp.location}</Text>}
                    {(exp.company || exp.location) && exp.period && <Text style={{ fontFamily }}> | </Text>}
                    {exp.period && <Text style={[modernStyles.expPeriod, { fontFamily }]}>{exp.period}</Text>}
                  </Text>
                </View>
                {exp.bullets && exp.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={rtlStyles.bullet}>
                    <Text style={[executiveStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      
      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        return (
          <View style={executiveStyles.section}>
            <View style={executiveStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { fontFamily }]}>{getPDFSectionLabel(language, data, 'skills', 'executive')}</Text>
              <View style={[executiveStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            <View style={{ flexDirection: isRTL ? 'row-reverse' as any : 'row' as any, flexWrap: 'wrap' }}>
              {data.skills.map((skill, idx) => (
                <Text key={idx} style={[rtlStyles.text, { marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0, marginBottom: 3, fontFamily }]}>{skill}</Text>
              ))}
            </View>
          </View>
        );
      
      case 'education':
        if (!data.education || data.education.length === 0) return null;
        return (
          <View style={executiveStyles.section}>
            <View style={executiveStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { fontFamily }]}>{getPDFSectionLabel(language, data, 'education', 'executive')}</Text>
              <View style={[executiveStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.education.map((edu, idx) => (
              <View key={idx} style={executiveStyles.experienceItem}>
                <View style={rtlStyles.expHeader}>
                  <View style={executiveStyles.expTitleContainer}>
                    <Text style={[rtlStyles.expTitle, { fontFamily }]}>{edu.degree}</Text>
                    <Text style={[rtlStyles.expCompany, { fontFamily }]}>{edu.institution}</Text>
                  </View>
                  <Text style={[rtlStyles.expPeriod, { fontFamily }]}>{edu.period}</Text>
                </View>
                {edu.details && edu.details.map((detail, dIdx) => (
                  <View key={dIdx} style={rtlStyles.bullet}>
                    <Text style={[executiveStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      
      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <View style={executiveStyles.section}>
            <View style={executiveStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { fontFamily }]}>{getPDFSectionLabel(language, data, 'projects', 'executive')}</Text>
              <View style={[executiveStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.projects.map((project, idx) => (
              <View key={idx} style={executiveStyles.experienceItem}>
                <View style={rtlStyles.expHeader}>
                  <View style={executiveStyles.expTitleContainer}>
                    <Text style={[rtlStyles.expTitle, { fontFamily }]}>{project.name}</Text>
                    {project.organization && <Text style={[rtlStyles.expCompany, { fontFamily }]}>{project.organization}</Text>}
                  </View>
                  {project.period && <Text style={[rtlStyles.expPeriod, { fontFamily }]}>{project.period}</Text>}
                </View>
                {project.details && project.details.map((detail, dIdx) => (
                  <View key={dIdx} style={rtlStyles.bullet}>
                    <Text style={[executiveStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      
      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <View style={executiveStyles.section}>
            <View style={executiveStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { fontFamily }]}>{getPDFSectionLabel(language, data, 'certifications', 'executive')}</Text>
              <View style={[executiveStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.certifications.map((cert, idx) => (
              <View key={idx} style={rtlStyles.bullet}>
                <Text style={[executiveStyles.bulletPoint, { fontFamily }]}>•</Text>
                <Text style={[rtlStyles.bulletText, { fontFamily }]}>{cert}</Text>
              </View>
            ))}
          </View>
        );
      
      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <View style={executiveStyles.section}>
            <View style={executiveStyles.sectionTitleContainer}>
              <Text style={[rtlStyles.sectionTitle, { fontFamily }]}>{getPDFSectionLabel(language, data, 'languages', 'executive')}</Text>
              <View style={[executiveStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            <Text style={[rtlStyles.text, { fontFamily }]}>{data.languages.join(', ')}</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={[executiveStyles.page, { fontFamily, direction: isRTL ? 'rtl' : 'ltr' }]}>
        {/* Header */}
        <View style={executiveStyles.header}>
          <Text style={[executiveStyles.name, { fontFamily }]}>{data.name || 'Your Name'}</Text>
          {data.title && <Text style={[executiveStyles.title, { fontFamily }]}>{data.title}</Text>}
          <View style={rtlStyles.contactRow}>
            {data.location && <Text style={[executiveStyles.contactItem, { fontFamily }]}>{data.location}</Text>}
            {data.location && data.email && <Text style={[executiveStyles.separator, { fontFamily }]}>|</Text>}
            {data.email && <Text style={[executiveStyles.contactItem, { fontFamily }]}>{data.email}</Text>}
            {data.email && data.website && <Text style={[executiveStyles.separator, { fontFamily }]}>|</Text>}
            {data.website && <Text style={[executiveStyles.contactItem, { fontFamily }]}>{data.website}</Text>}
          </View>
        </View>

        <View style={[executiveStyles.headerLine, { backgroundColor: primaryColor }]} />

        {/* All sections rendered in order */}
        <View style={{ marginTop: 4 }}>
          {sectionOrder.map((sectionKey) => (
            <React.Fragment key={sectionKey}>
              {renderSection(sectionKey)}
            </React.Fragment>
          ))}
        </View>
      </Page>
    </Document>
  );
}

// ============================================
// TECHNICAL TEMPLATE
// ============================================
const technicalStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 30,
    fontWeight: 700,
    color: '#1D61CB',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    fontSize: 10,
    color: '#4b5563',
  },
  contactItem: {
    marginHorizontal: 4,
  },
  separator: {
    marginHorizontal: 4,
  },
  headerLine: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: 12,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitleContainer: {
    marginBottom: 6,
    paddingTop: 4,
    paddingBottom: 1,
    minHeight: 25,
  },
  sectionTitleBorderTop: {
    height: 1,
    backgroundColor: '#1D61CB',
    marginBottom: 4,
  },
  sectionTitleBorderBottom: {
    height: 1,
    backgroundColor: '#1D61CB',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1D61CB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  experienceItem: {
    marginBottom: 12,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitleContainer: {},
  expTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
  },
  expCompany: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
  },
  expLocation: {
    fontSize: 12,
    fontWeight: 400,
    color: '#111827',
  },
  expPeriod: {
    fontSize: 12,
    fontWeight: 400,
    color: '#111827',
  },
  bullet: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bulletPoint: {
    width: 10,
    fontSize: 11,
    color: '#9ca3af',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    width: '33.33%',
    fontSize: 10,
    marginBottom: 3,
    color: '#374151',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
  },
});

export function TechnicalPDFTemplate({ data, language = 'en' }: { data: ResumeData; language?: Language }) {
  const sectionOrder = getSectionOrder(data);
  const primaryColor = getPrimaryColor(data, 'technical');
  const isRTL = false; // RTL disabled for Arabic
  const fontFamily = getFontFamily(language);
  
  // Create RTL-aware styles
  const rtlStyles = {
    sectionTitle: { ...technicalStyles.sectionTitle, textAlign: isRTL ? 'right' as any : 'left' as any },
    text: { ...technicalStyles.text, textAlign: isRTL ? 'right' as any : 'left' as any },
    expTitle: { ...technicalStyles.expTitle, textAlign: isRTL ? 'right' as any : 'left' as any },
    expCompany: { ...technicalStyles.expCompany, textAlign: isRTL ? 'right' as any : 'left' as any },
    expPeriod: { ...technicalStyles.expPeriod, textAlign: isRTL ? 'right' as any : 'left' as any },
    bullet: { ...technicalStyles.bullet, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
    bulletText: { ...technicalStyles.bulletText, textAlign: isRTL ? 'right' as any : 'left' as any },
    expHeader: { ...technicalStyles.expHeader, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
    contactRow: { ...technicalStyles.contactRow, flexDirection: isRTL ? 'row-reverse' as any : 'row' as any },
  };
  
  const renderSection = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'summary':
        if (!data.summary || data.summary.trim().length === 0) return null;
        return (
          <View style={technicalStyles.section}>
            <View style={technicalStyles.sectionTitleContainer}>
              <View style={[technicalStyles.sectionTitleBorderTop, { backgroundColor: primaryColor }]} />
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'summary', 'technical')}</Text>
              <View style={[technicalStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            <Text style={[rtlStyles.text, { fontFamily }]}>{data.summary}</Text>
          </View>
        );
      
      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        return (
          <View style={technicalStyles.section}>
            <View style={technicalStyles.sectionTitleContainer}>
              <View style={[technicalStyles.sectionTitleBorderTop, { backgroundColor: primaryColor }]} />
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'experience', 'technical')}</Text>
              <View style={[technicalStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={technicalStyles.experienceItem}>
                <View>
                  <Text style={[rtlStyles.expTitle, { fontFamily, lineHeight: 1.2 }]}>{exp.title}</Text>
                  <Text style={[{ fontFamily, lineHeight: 1.2 }]}>
                    <Text style={[technicalStyles.expCompany, { fontFamily }]}>{exp.company}</Text>
                    {exp.company && exp.location && <Text style={{ fontFamily }}> | </Text>}
                    {exp.location && <Text style={[technicalStyles.expLocation, { fontFamily }]}>{exp.location}</Text>}
                    {(exp.company || exp.location) && exp.period && <Text style={{ fontFamily }}> | </Text>}
                    {exp.period && <Text style={[technicalStyles.expPeriod, { fontFamily }]}>{exp.period}</Text>}
                  </Text>
                </View>
                {exp.bullets && exp.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={rtlStyles.bullet}>
                    <Text style={[technicalStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      
      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        return (
          <View style={technicalStyles.section}>
            <View style={technicalStyles.sectionTitleContainer}>
              <View style={[technicalStyles.sectionTitleBorderTop, { backgroundColor: primaryColor }]} />
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'skills', 'technical')}</Text>
              <View style={[technicalStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            <View style={technicalStyles.skillsGrid}>
              {data.skills.map((skill, idx) => (
                <Text key={idx} style={[technicalStyles.skillItem, { fontFamily, textAlign: isRTL ? 'right' as any : 'left' as any }]}>{skill}</Text>
              ))}
            </View>
          </View>
        );
      
      case 'education':
        if (!data.education || data.education.length === 0) return null;
        return (
          <View style={technicalStyles.section}>
            <View style={technicalStyles.sectionTitleContainer}>
              <View style={[technicalStyles.sectionTitleBorderTop, { backgroundColor: primaryColor }]} />
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'education', 'technical')}</Text>
              <View style={[technicalStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.education.map((edu, idx) => (
              <View key={idx} style={technicalStyles.experienceItem}>
                <View style={rtlStyles.expHeader}>
                  <View style={technicalStyles.expTitleContainer}>
                    <Text style={[rtlStyles.expTitle, { fontFamily }]}>{edu.degree}</Text>
                    <Text style={[rtlStyles.expCompany, { fontFamily }]}>{edu.institution}</Text>
                  </View>
                  <Text style={[rtlStyles.expPeriod, { color: primaryColor, fontFamily }]}>{edu.period}</Text>
                </View>
                {edu.details && edu.details.map((detail, dIdx) => (
                  <View key={dIdx} style={rtlStyles.bullet}>
                    <Text style={[technicalStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      
      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <View style={technicalStyles.section}>
            <View style={technicalStyles.sectionTitleContainer}>
              <View style={[technicalStyles.sectionTitleBorderTop, { backgroundColor: primaryColor }]} />
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'projects', 'technical')}</Text>
              <View style={[technicalStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.projects.map((project, idx) => (
              <View key={idx} style={technicalStyles.experienceItem}>
                <View style={rtlStyles.expHeader}>
                  <View style={technicalStyles.expTitleContainer}>
                    <Text style={[rtlStyles.expTitle, { fontFamily }]}>{project.name}</Text>
                    {project.organization && <Text style={[rtlStyles.expCompany, { fontFamily }]}>{project.organization}</Text>}
                  </View>
                  {project.period && <Text style={[rtlStyles.expPeriod, { color: primaryColor, fontFamily }]}>{project.period}</Text>}
                </View>
                {project.details && project.details.map((detail, dIdx) => (
                  <View key={dIdx} style={rtlStyles.bullet}>
                    <Text style={[technicalStyles.bulletPoint, { fontFamily }]}>•</Text>
                    <Text style={[rtlStyles.bulletText, { fontFamily }]}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      
      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <View style={technicalStyles.section}>
            <View style={technicalStyles.sectionTitleContainer}>
              <View style={[technicalStyles.sectionTitleBorderTop, { backgroundColor: primaryColor }]} />
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'certifications', 'technical')}</Text>
              <View style={[technicalStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            {data.certifications.map((cert, idx) => (
              <View key={idx} style={rtlStyles.bullet}>
                <Text style={[technicalStyles.bulletPoint, { fontFamily }]}>•</Text>
                <Text style={[rtlStyles.bulletText, { fontFamily }]}>{cert}</Text>
              </View>
            ))}
          </View>
        );
      
      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <View style={technicalStyles.section}>
            <View style={technicalStyles.sectionTitleContainer}>
              <View style={[technicalStyles.sectionTitleBorderTop, { backgroundColor: primaryColor }]} />
              <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>{getPDFSectionLabel(language, data, 'languages', 'technical')}</Text>
              <View style={[technicalStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
            </View>
            <Text style={[rtlStyles.text, { fontFamily }]}>{data.languages.join(', ')}</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={[technicalStyles.page, { fontFamily, direction: isRTL ? 'rtl' : 'ltr' }]}>
        {/* Header */}
        <View style={technicalStyles.header}>
          <Text style={[technicalStyles.name, { color: primaryColor, fontFamily }]}>{data.name || 'Your Name'}</Text>
          <View style={rtlStyles.contactRow}>
            {data.email && <Text style={[technicalStyles.contactItem, { fontFamily }]}>{data.email}</Text>}
            {data.email && data.phone && <Text style={[technicalStyles.separator, { fontFamily }]}>|</Text>}
            {data.phone && <Text style={[technicalStyles.contactItem, { fontFamily }]}>{data.phone}</Text>}
            {(data.email || data.phone) && data.location && <Text style={[technicalStyles.separator, { fontFamily }]}>|</Text>}
            {data.location && <Text style={[technicalStyles.contactItem, { fontFamily }]}>{data.location}</Text>}
          </View>
        </View>

        {/* All sections rendered in order */}
        <View style={{ marginTop: 15 }}>
          {sectionOrder.map((sectionKey) => (
            <React.Fragment key={sectionKey}>
              {renderSection(sectionKey)}
            </React.Fragment>
          ))}

          {/* Additional Information */}
          {((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) && (
            <View style={technicalStyles.section}>
              <View style={technicalStyles.sectionTitleContainer}>
                <View style={[technicalStyles.sectionTitleBorderTop, { backgroundColor: primaryColor }]} />
                <Text style={[rtlStyles.sectionTitle, { color: primaryColor, fontFamily }]}>Additional Information</Text>
                <View style={[technicalStyles.sectionTitleBorderBottom, { backgroundColor: primaryColor }]} />
              </View>
              {data.languages && data.languages.length > 0 && (
                <View style={rtlStyles.bullet}>
                  <Text style={[technicalStyles.bulletPoint, { fontFamily }]}>•</Text>
                  <Text style={[rtlStyles.bulletText, { fontFamily }]}>
                    <Text style={{ fontWeight: 600, fontFamily }}>Languages: </Text>
                    {data.languages.join(', ')}
                  </Text>
                </View>
              )}
              {data.certifications && data.certifications.length > 0 && (
                <View style={rtlStyles.bullet}>
                  <Text style={[technicalStyles.bulletPoint, { fontFamily }]}>•</Text>
                  <Text style={[rtlStyles.bulletText, { fontFamily }]}>
                    <Text style={{ fontWeight: 600, fontFamily }}>Certifications: </Text>
                    {data.certifications.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ============================================
// TEMPLATE SELECTOR HELPER
// ============================================
export type PDFTemplate = 'classic' | 'modern' | 'executive' | 'technical';

export function getPDFTemplate(template: PDFTemplate, data: ResumeData, language: Language = 'en') {
  switch (template) {
    case 'classic':
      return <ClassicPDFTemplate data={data} language={language} />;
    case 'modern':
      return <ModernPDFTemplate data={data} language={language} />;
    case 'executive':
      return <ExecutivePDFTemplate data={data} language={language} />;
    case 'technical':
      return <TechnicalPDFTemplate data={data} language={language} />;
    default:
      return <ClassicPDFTemplate data={data} language={language} />;
  }
}

