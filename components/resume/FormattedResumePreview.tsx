'use client';

import React, { useMemo } from 'react';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, Code, Award, User, Globe, Linkedin } from 'lucide-react';
import { parseResumeText, isStructuredResume } from '@/lib/parseResumeText';

interface FormattedResumePreviewProps {
  optimizedText: string;
  className?: string;
}

export function FormattedResumePreview({ optimizedText, className = '' }: FormattedResumePreviewProps) {
  const parsedResume = useMemo(() => {
    if (!optimizedText) return null;

    // Check if text is structured enough to parse
    if (!isStructuredResume(optimizedText)) {
      console.log('Resume text is not structured enough to parse');
      return null;
    }

    try {
      const parsed = parseResumeText(optimizedText);
      console.log('Parsed resume:', parsed);
      return parsed;
    } catch (error) {
      console.error('Error parsing resume:', error);
      return null;
    }
  }, [optimizedText]);

  // If parsing failed or text isn't structured, show raw text
  if (!parsedResume || !parsedResume.contact.name) {
    return (
      <div className={`bg-white p-8 ${className}`}>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
          {optimizedText}
        </div>
      </div>
    );
  }

  const { contact, summary, experience, education, skills, certifications, languages } = parsedResume;

  return (
    <div className={`bg-white p-8 ${className}`}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header / Contact Info */}
        <div className="text-center border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">{contact.name}</h1>
          {contact.title && (
            <p className="mt-1 text-lg text-gray-600">{contact.title}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            {contact.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{contact.location}</span>
              </div>
            )}
            {contact.linkedin && (
              <div className="flex items-center gap-1.5">
                <Linkedin className="h-4 w-4 text-gray-400" />
                <span>{contact.linkedin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {summary && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Professional Summary</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{summary}</p>
          </section>
        )}

        {/* Work Experience */}
        {experience.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Work Experience</h2>
            </div>

            <div className="space-y-5">
              {experience.map((exp, idx) => (
                <div key={idx} className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{exp.title || 'Position'}</h3>
                      {exp.company && (
                        <p className="text-sm text-gray-600">{exp.company}</p>
                      )}
                    </div>
                    {exp.period && (
                      <span className="text-sm text-blue-600 font-medium whitespace-nowrap ml-4">
                        {exp.period}
                      </span>
                    )}
                  </div>

                  {exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {exp.bullets.map((bullet, bulletIdx) => (
                        <li key={bulletIdx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Education</h2>
            </div>

            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                    {edu.institution && (
                      <p className="text-sm text-gray-600">{edu.institution}</p>
                    )}
                  </div>
                  {edu.period && (
                    <span className="text-sm text-blue-600 font-medium whitespace-nowrap ml-4">
                      {edu.period}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills and Certifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Skills */}
          {Object.keys(skills).length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">Technical Skills</h2>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                {Object.entries(skills).map(([category, skillList]) => (
                  <p key={category}>
                    <strong className="text-gray-900">{category}:</strong>{' '}
                    {Array.isArray(skillList) ? skillList.join(', ') : skillList}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">Certifications</h2>
              </div>

              <ul className="space-y-1.5">
                {certifications.map((cert, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-gray-400">•</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Languages */}
        {languages && languages.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Languages</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {lang}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
