'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { ResumeData, getSectionOrder, getPrimaryColor, SectionKey } from '@/lib/resumeDataTypes';
import { useLanguage } from '@/contexts/LanguageContext';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

interface ClassicTemplateProps {
  data: ResumeData;
}

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  const { t, language } = useLanguage();
  const isRTL = false; // RTL disabled for Arabic
  const sectionOrder = getSectionOrder(data);
  const primaryColor = getPrimaryColor(data, 'classic');
  
  // Map section keys to English labels (Arabic translation disabled)
  const getSectionTranslation = (sectionKey: SectionKey): string => {
    const englishLabels: Record<SectionKey, string> = {
      summary: 'Summary',
      experience: 'Work Experience',
      skills: 'Key Skills',
      education: 'Education',
      projects: 'Projects',
      certifications: 'Certifications',
      languages: 'Languages',
    };
    return englishLabels[sectionKey] || sectionKey;
  };
  
  const renderSection = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'summary':
        if (!data.summary || data.summary.trim().length === 0) return null;
        return (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold uppercase tracking-wide" style={{ color: primaryColor }}>{getSectionTranslation('summary')}</h2>
              <p className="flex-1 text-sm leading-relaxed text-justify">{data.summary}</p>
            </div>
            <div className="h-px" style={{ backgroundColor: primaryColor }} />
          </>
        );
      
      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        const experienceLabel = getSectionTranslation('experience');
        return (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold uppercase tracking-wide" style={{ color: primaryColor }}>{experienceLabel}</h2>
              <div className="flex-1 space-y-4">
                {data.experience.map((exp, idx) => (
                  <div key={idx}>
                    <h3 className={`font-bold text-sm leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                      <div>{exp.title}</div>
                      <div className="text-sm">
                        <span className="font-bold">{exp.company}</span>
                        {exp.company && exp.location && <span> | </span>}
                        <span className="font-normal">{exp.location}</span>
                        {(exp.company || exp.location) && exp.period && <span> | </span>}
                        <span className="font-normal">{exp.period}</span>
                      </div>
                    </h3>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className={`mt-1 space-y-0.5 list-disc ${isRTL ? 'mr-6' : 'ml-6'}`}>
                        {exp.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="text-sm">{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px" style={{ backgroundColor: primaryColor }} />
          </>
        );
      
      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        return (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold uppercase tracking-wide" style={{ color: primaryColor }}>{getSectionTranslation('skills')}</h2>
              <ul className={`flex-1 grid grid-cols-2 gap-x-8 gap-y-0.5 list-disc ${isRTL ? 'mr-6' : 'ml-6'}`}>
                {data.skills.map((skill, idx) => (
                  <li key={idx} className="text-sm">{skill}</li>
                ))}
              </ul>
            </div>
            <div className="h-px" style={{ backgroundColor: primaryColor }} />
          </>
        );
      
      case 'education':
        if (!data.education || data.education.length === 0) return null;
        return (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold uppercase tracking-wide" style={{ color: primaryColor }}>{getSectionTranslation('education')}</h2>
              <div className={`flex-1 space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                {data.education.map((edu, idx) => (
                  <div key={idx}>
                    <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <h3 className="font-bold text-sm">{edu.degree}</h3>
                      <span className={`font-bold text-sm flex-shrink-0 ${isRTL ? 'mr-4' : 'ml-4'}`}>{edu.period}</span>
                    </div>
                    <p className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{edu.institution}</p>
                    {edu.details && edu.details.length > 0 && (
                      <ul className={`mt-1 space-y-0.5 list-disc ${isRTL ? 'mr-6 text-right' : 'ml-6 text-left'}`}>
                        {edu.details.map((detail, dIdx) => (
                          <li key={dIdx} className="text-sm">{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px" style={{ backgroundColor: primaryColor }} />
          </>
        );
      
      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold uppercase tracking-wide" style={{ color: primaryColor }}>{getSectionTranslation('projects')}</h2>
              <div className="flex-1 space-y-3">
                {data.projects.map((project, idx) => (
                  <div key={idx}>
                    <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <h3 className="font-bold text-sm">{project.name}</h3>
                      {project.period && <span className={`font-bold text-sm flex-shrink-0 ${isRTL ? 'mr-4' : 'ml-4'}`}>{project.period}</span>}
                    </div>
                    {project.organization && <p className="text-sm">{project.organization}</p>}
                    {project.details && project.details.length > 0 && (
                      <ul className={`mt-1 space-y-0.5 list-disc ${isRTL ? 'mr-6' : 'ml-6'}`}>
                        {project.details.map((detail, dIdx) => (
                          <li key={dIdx} className="text-sm">{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px" style={{ backgroundColor: primaryColor }} />
          </>
        );
      
      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold uppercase tracking-wide" style={{ color: primaryColor }}>{getSectionTranslation('certifications')}</h2>
              <ul className={`flex-1 list-disc space-y-0.5 ${isRTL ? 'mr-6' : 'ml-6'}`}>
                {data.certifications.map((cert, idx) => (
                  <li key={idx} className="text-sm">{cert}</li>
                ))}
              </ul>
            </div>
            <div className="h-px" style={{ backgroundColor: primaryColor }} />
          </>
        );
      
      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <div className="flex gap-6">
            <h2 className="w-36 flex-shrink-0 text-base font-bold uppercase tracking-wide" style={{ color: primaryColor }}>{getSectionTranslation('languages')}</h2>
            <p className="flex-1 text-sm">{data.languages.join(', ')}</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white p-8 min-h-[1000px] text-gray-800 ${inter.className} ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold tracking-wide uppercase" style={{ color: primaryColor }}>
          {data.name || 'Your Name'}
        </h1>
        <div className="mt-2 text-sm text-gray-600 flex items-center justify-center gap-2 flex-wrap">
          {data.email && <span>{data.email}</span>}
          {data.email && data.phone && <span>|</span>}
          {data.phone && <span>{data.phone}</span>}
          {(data.email || data.phone) && data.location && <span>|</span>}
          {data.location && <span>{data.location}</span>}
        </div>
      </div>

      <div className="h-1 mb-2" style={{ backgroundColor: primaryColor }} />

      <div className="space-y-6 mt-0">
        {/* All sections rendered in order */}
        {sectionOrder.map((sectionKey) => (
          <React.Fragment key={sectionKey}>
            {renderSection(sectionKey)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
