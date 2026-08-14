'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Template } from './TemplateSelector';
import { ClassicTemplate, ModernTemplate, ExecutiveTemplate, TechnicalTemplate } from './templates';
import { parseResumeText } from '@/lib/parseResumeText';
import { convertToResumeData, ResumeData } from '@/lib/resumeDataTypes';

interface ResumePreviewProps {
  optimizedText?: string;
  template?: Template;
}

// Sample data for when no optimized text is provided
const sampleResumeData: ResumeData = {
  name: 'John Doe',
  title: 'Software Engineer',
  email: 'john.doe@email.com',
  phone: '+1 234-567-8900',
  location: 'San Francisco, CA',
  summary: 'Experienced software engineer with 5+ years of experience in full-stack development. Proven track record of delivering high-quality applications and leading technical initiatives.',
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Company Inc.',
      period: 'Jan 2022 - Present',
      bullets: [
        'Led development of microservices architecture serving 1M+ users',
        'Mentored team of 5 junior developers',
        'Reduced deployment time by 60% through CI/CD improvements',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'Startup Co.',
      period: 'Jun 2019 - Dec 2021',
      bullets: [
        'Built responsive web applications using React and Node.js',
        'Implemented RESTful APIs and database optimization',
      ],
    },
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Technology',
      period: '2015 - 2019',
      details: ['GPA: 3.8/4.0', 'Dean\'s List'],
    },
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL'],
  certifications: ['AWS Solutions Architect', 'Google Cloud Professional'],
  languages: ['English', 'Spanish'],
};

export function ResumePreview({ optimizedText, template = 'classic' }: ResumePreviewProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Close fullscreen on Escape key
  useEffect(() => {
    if (!isFullscreen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  // Parse optimized text into resume data
  const resumeData = useMemo(() => {
    if (!optimizedText || optimizedText.trim().length === 0) {
      console.log('No optimized text provided');
      return null;
    }

    try {
      console.log('Parsing optimized text, length:', optimizedText.length);
      const parsed = parseResumeText(optimizedText);
      console.log('Parsed resume:', parsed);
      
      const converted = convertToResumeData(parsed);
      console.log('Converted resume data:', converted);
      console.log('Parsed sections:', {
        hasExperience: parsed?.experience?.length || 0,
        hasEducation: parsed?.education?.length || 0,
        hasSkills: Object.keys(parsed?.skills || {}).length || 0,
        hasSummary: !!parsed?.summary,
        contactName: parsed?.contact?.name,
      });
      
      // Always use converted data if parsing was successful (even if name is missing)
      // Extract name separately if needed
      if (converted) {
        // If name is missing, try to extract it
        if (!converted.name || converted.name.trim() === '') {
          console.warn('Converted data missing name, extracting from text');
          const lines = optimizedText.split('\n').filter(line => line.trim());
          for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();
            const cleanLine = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
            if (cleanLine && /^[A-Za-z\s\-']{2,50}$/.test(cleanLine) && cleanLine.split(/\s+/).length <= 4) {
              converted.name = cleanLine;
              console.log('Extracted name:', cleanLine);
              break;
            }
          }
        }
        return converted;
      }
      
      // If convertToResumeData returned null, try to use parsed data directly
      if (parsed) {
        console.warn('convertToResumeData returned null, using parsed data directly');
        const flatSkills: string[] = [];
        for (const category in parsed.skills) {
          flatSkills.push(...parsed.skills[category]);
        }
        
        // Extract name if missing
        let name = parsed.contact?.name || '';
        if (!name || name.trim() === '') {
          const lines = optimizedText.split('\n').filter(line => line.trim());
          for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();
            const cleanLine = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
            if (cleanLine && /^[A-Za-z\s\-']{2,50}$/.test(cleanLine) && cleanLine.split(/\s+/).length <= 4) {
              name = cleanLine;
              break;
            }
          }
        }
        
        return {
          name: name || 'Unknown',
          title: parsed.contact?.title,
          email: parsed.contact?.email,
          phone: parsed.contact?.phone,
          location: parsed.contact?.location,
          summary: parsed.summary,
          experience: parsed.experience.map(exp => ({
            title: exp.title,
            company: exp.company,
            period: exp.period,
            bullets: exp.bullets,
          })),
          education: parsed.education.map(edu => ({
            degree: edu.degree,
            institution: edu.institution,
            period: edu.period,
            details: edu.details,
          })),
          skills: flatSkills,
          certifications: parsed.certifications,
          languages: parsed.languages || [],
        };
      }
      
      return null;
    } catch (e) {
      console.error('Error parsing resume:', e);
      
      // On error, try to extract at least the name from text
      try {
        const lines = optimizedText.split('\n').filter(line => line.trim());
        for (let i = 0; i < Math.min(3, lines.length); i++) {
          const line = lines[i].trim().replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
          if (line && /^[A-Za-z\s\-']{2,50}$/.test(line) && line.split(/\s+/).length <= 4) {
            const emailMatch = optimizedText.match(/[\w.-]+@[\w.-]+\.\w+/);
            return {
              name: line,
              email: emailMatch ? emailMatch[0] : undefined,
              summary: undefined,
              experience: [],
              education: [],
              skills: [],
              certifications: [],
              languages: [],
            };
          }
        }
      } catch (extractError) {
        console.error('Error extracting name:', extractError);
      }
      
      return null;
    }
  }, [optimizedText]);

  // Only use sample data if we have NO optimized text at all
  // If we have optimized text but parsing failed, show raw text instead
  const displayData = resumeData || (!optimizedText ? sampleResumeData : null);

  // Render the appropriate template - render directly to ensure React detects changes
  const renderTemplate = () => {
    console.log('[ResumePreview] Rendering template:', template, 'resumeData exists:', !!resumeData, 'displayData:', displayData?.name || 'null');
    
    // If displayData is null (parsing failed but we have optimized text), show formatted raw text
    if (!displayData && optimizedText) {
      return (
        <div className="p-8 text-gray-700 whitespace-pre-wrap font-sans">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{optimizedText}</pre>
          </div>
        </div>
      );
    }
    
    // If no data at all, show sample data for template preview
    if (!displayData) {
      return (
        <div className="p-8 text-gray-700 whitespace-pre-wrap font-sans">
          <p className="text-sm text-gray-500">No resume data available</p>
        </div>
      );
    }
    
    switch (template) {
      case 'classic':
        return <ClassicTemplate key={`classic-${template}`} data={displayData} />;
      case 'modern':
        return <ModernTemplate key={`modern-${template}`} data={displayData} />;
      case 'executive':
        return <ExecutiveTemplate key={`executive-${template}`} data={displayData} />;
      case 'technical':
        return <TechnicalTemplate key={`technical-${template}`} data={displayData} />;
      default:
        return <ClassicTemplate key={`classic-default-${template}`} data={displayData} />;
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('resumePreview.title')}</h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <Card
          key={`card-${template}`}
          className="overflow-hidden shadow-lg inline-block"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            minWidth: '210mm',
          }}
        >
          {renderTemplate()}
        </Card>
      </div>
    </div>

    {/* Fullscreen Modal Overlay */}
    {isFullscreen && (
      <div
        ref={fullscreenRef}
        className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsFullscreen(false);
          }
        }}
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Close button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Resume content in fullscreen */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <Card
              key={`fullscreen-card-${template}`}
              className="overflow-hidden shadow-2xl inline-block bg-white"
              style={{
                minWidth: '210mm',
                maxWidth: '210mm',
              }}
            >
              {renderTemplate()}
            </Card>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
