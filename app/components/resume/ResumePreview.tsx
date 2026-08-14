'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Template } from './TemplateSelector';
import { ClassicTemplate, ModernTemplate, ExecutiveTemplate, TechnicalTemplate } from './templates';
import { parseResumeText } from '@/lib/parseResumeText';
import { convertToResumeData, convertStructuredToResumeData, ResumeData } from '@/lib/resumeDataTypes';
import { PreviewResponse } from '@/lib/api';

interface ResumePreviewProps {
  optimizedText?: string;
  template?: Template;
  onResumeDataReady?: (data: ResumeData | null, elementRef: React.RefObject<HTMLDivElement>) => void;
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

export function ResumePreview({ optimizedText, template = 'classic', onResumeDataReady }: ResumePreviewProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  const handleFullscreen = async () => {
    const container = fullscreenContainerRef.current;
    if (!container) {
      console.error('Fullscreen container ref not available');
      return;
    }

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen - try standard API first, then vendor prefixes
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        } else {
          console.error('Fullscreen API not supported');
          return;
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      // Fallback: try to exit if we're already in fullscreen
      if (document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement) {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          }
          setIsFullscreen(false);
        } catch (exitError) {
          console.error('Error exiting fullscreen:', exitError);
        }
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenActive = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreenActive);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Parse optimized text into resume data
  const resumeData = useMemo(() => {
    // First, check if we have structured_data (new format from LLM)
    if (optimizedText && typeof optimizedText === 'object' && 'structured_data' in optimizedText) {
      const previewResponse = optimizedText as PreviewResponse;
      const structured = previewResponse.structured_data;
      if (structured) {
        console.log('Using structured_data from LLM response');
        return convertStructuredToResumeData(structured);
      }
      // If structured_data is null but we have optimized_text, fall through to parsing
      if (previewResponse.optimized_text) {
        optimizedText = previewResponse.optimized_text;
      }
    }

    // Fallback: parse text if no structured data
    const textToParse = typeof optimizedText === 'string' ? optimizedText : '';
    if (!textToParse || textToParse.trim().length === 0) {
      console.log('No optimized text provided');
      return null;
    }

    try {
      console.log('Parsing optimized text, length:', textToParse.length);
      const parsed = parseResumeText(textToParse);
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
          const lines = textToParse.split('\n').filter(line => line.trim());
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
          const lines = textToParse.split('\n').filter(line => line.trim());
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
        const lines = textToParse.split('\n').filter(line => line.trim());
        for (let i = 0; i < Math.min(3, lines.length); i++) {
          const line = lines[i].trim().replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
          if (line && /^[A-Za-z\s\-']{2,50}$/.test(line) && line.split(/\s+/).length <= 4) {
            const emailMatch = textToParse.match(/[\w.-]+@[\w.-]+\.\w+/);
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
  const hasOptimizedText = optimizedText && (
    typeof optimizedText === 'string' 
      ? optimizedText.trim().length > 0
      : (optimizedText as PreviewResponse)?.optimized_text?.trim().length > 0 || 
        (optimizedText as PreviewResponse)?.structured_data !== null
  );
  const displayData = resumeData || (!hasOptimizedText ? sampleResumeData : null);

  // Expose resume data and template ref to parent for download functionality
  useEffect(() => {
    if (onResumeDataReady) {
      console.log('[ResumePreview] Calling onResumeDataReady', {
        hasDisplayData: !!displayData,
        hasRef: !!templateRef,
        refCurrent: !!templateRef.current,
        displayDataName: displayData?.name
      });
      onResumeDataReady(displayData, templateRef);
    }
  }, [displayData, onResumeDataReady, templateRef]);

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
            <Button variant="ghost" size="icon" onClick={handleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div 
        ref={fullscreenContainerRef}
        className={isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'overflow-auto'}
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'white',
          padding: '1rem',
          overflowY: 'auto',
          overflowX: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        } : {}}
      >
        <Card
          ref={templateRef}
          key={`card-${template}`}
          className="overflow-hidden shadow-lg inline-block"
          style={{
            transform: isFullscreen ? 'scale(1)' : `scale(${zoom / 100})`,
            transformOrigin: isFullscreen ? 'top center' : 'top left',
            minWidth: '210mm',
            ...(isFullscreen ? {
              width: '100%',
              maxWidth: '210mm',
              margin: '0',
            } : {}),
          }}
        >
          {renderTemplate()}
        </Card>
      </div>
    </div>
  );
}
