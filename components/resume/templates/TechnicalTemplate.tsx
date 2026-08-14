'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { ResumeData, getSectionOrder, getPrimaryColor, SectionKey } from '@/lib/resumeDataTypes';
import { useLanguage } from '@/contexts/LanguageContext';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

interface TechnicalTemplateProps {
  data: ResumeData;
}

export function TechnicalTemplate({ data }: TechnicalTemplateProps) {
  const { t, language } = useLanguage();
  const isRTL = false; // RTL disabled for Arabic
  const sectionOrder = getSectionOrder(data);
  const primaryColor = getPrimaryColor(data, 'technical');
  
  // Map section keys to English labels (Arabic translation disabled)
  const getSectionTranslation = (sectionKey: SectionKey): string => {
    const englishLabels: Record<SectionKey, string> = {
      summary: 'Summary',
      experience: 'Professional Experience',
      skills: 'Technical Skills',
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
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2 py-1 border-t border-b" style={{ color: primaryColor, borderColor: primaryColor }}>
              {getSectionTranslation('summary')}
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">{data.summary}</p>
          </div>
        );
      
      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2 py-1 border-t border-b" style={{ color: primaryColor, borderColor: primaryColor }}>
              {getSectionTranslation('experience')}
            </h2>
            <div className="space-y-4">
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
                    <ul className={`mt-1 space-y-0.5 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-600">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide mb-3 py-1 border-t border-b" style={{ color: primaryColor, borderColor: primaryColor }}>
              {getSectionTranslation('skills')}
            </h2>
            <div className="grid grid-cols-3 gap-x-6 gap-y-1">
              {data.skills.map((skill, idx) => (
                <span key={idx} className="text-sm text-gray-700">{skill}</span>
              ))}
            </div>
          </div>
        );
      
      case 'education':
        if (!data.education || data.education.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2 py-1 border-t border-b" style={{ color: primaryColor, borderColor: primaryColor }}>
              {getSectionTranslation('education')}
            </h2>
            <div className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              {data.education.map((edu, idx) => (
                <div key={idx}>
                  <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h3 className="font-bold text-sm">{edu.degree}</h3>
                    <span className={`font-bold text-sm flex-shrink-0 ${isRTL ? 'mr-4' : 'ml-4'}`} style={{ color: primaryColor }}>{edu.period}</span>
                  </div>
                  <p className={`text-sm text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{edu.institution}</p>
                  {edu.details && edu.details.length > 0 && (
                    <ul className={`mt-1 ${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
                      {edu.details.map((detail, dIdx) => (
                        <li key={dIdx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-600">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2 py-1 border-t border-b" style={{ color: primaryColor, borderColor: primaryColor }}>
              {getSectionTranslation('projects')}
            </h2>
            <div className="space-y-3">
              {data.projects.map((project, idx) => (
                <div key={idx}>
                  <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h3 className="font-bold text-sm">{project.name}</h3>
                    {project.period && <span className={`font-bold text-sm flex-shrink-0 ${isRTL ? 'mr-4' : 'ml-4'}`} style={{ color: primaryColor }}>{project.period}</span>}
                  </div>
                  {project.organization && (
                    <p className="text-sm text-gray-700">{project.organization}</p>
                  )}
                  {project.details && project.details.length > 0 && (
                    <ul className={`mt-1 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                      {project.details.map((detail, dIdx) => (
                        <li key={dIdx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-600">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2 py-1 border-t border-b" style={{ color: primaryColor, borderColor: primaryColor }}>
              {getSectionTranslation('certifications')}
            </h2>
            <ul className={`${isRTL ? 'mr-3' : 'ml-3'} space-y-0.5`}>
              {data.certifications.map((cert, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-600">•</span>
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      
      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2 py-1 border-t border-b" style={{ color: primaryColor, borderColor: primaryColor }}>
              {getSectionTranslation('languages')}
            </h2>
            <p className="text-sm text-gray-700">{data.languages.join(', ')}</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white p-8 min-h-[1000px] text-gray-800 ${inter.className} ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold tracking-wide uppercase" style={{ color: primaryColor }}>
          {data.name || 'Your Name'}
        </h1>
        <div className="mt-2 text-sm text-gray-600 flex items-center justify-center gap-2">
          {data.email && <span>{data.email}</span>}
          {data.email && data.phone && <span>|</span>}
          {data.phone && <span>{data.phone}</span>}
          {(data.email || data.phone) && data.location && <span>|</span>}
          {data.location && <span>{data.location}</span>}
        </div>
      </div>

      <div className="space-y-5 mt-10">
        {/* All sections rendered in order */}
        {sectionOrder.map((sectionKey) => (
          <React.Fragment key={sectionKey}>
            {renderSection(sectionKey)}
          </React.Fragment>
        ))}

        {/* Additional Information */}
        {((data.languages && data.languages.length > 0) ||
          (data.certifications && data.certifications.length > 0)) && (
          <div>
            <h2 className="text-base font-bold uppercase tracking-wide mb-2 py-1 border-t border-b" style={{ color: primaryColor, borderColor: primaryColor }}>
              Additional Information
            </h2>
            <ul className={`${isRTL ? 'mr-3' : 'ml-3'} space-y-0.5`}>
              {data.languages && data.languages.length > 0 && (
                <li className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-600">•</span>
                  <span><span className="font-bold">Languages:</span> {data.languages.join(', ')}</span>
                </li>
              )}
              {data.certifications && data.certifications.length > 0 && (
                <li className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-600">•</span>
                  <span><span className="font-bold">Certifications:</span> {data.certifications.join(', ')}</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
