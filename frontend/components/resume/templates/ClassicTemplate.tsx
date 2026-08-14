'use client';

import React from 'react';
import { ResumeData } from '@/lib/resumeDataTypes';

interface ClassicTemplateProps {
  data: ResumeData;
}

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  return (
    <div className="bg-white p-8 min-h-[1000px] font-serif">
      {/* Header with Blue Name */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#2563eb] tracking-wide uppercase">
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

      <hr className="border-gray-300 mb-6" />

      {/* Two Column Layout */}
      <div className="space-y-6">
        {/* Summary */}
        {data.summary && (
          <div className="flex gap-8">
            <div className="w-32 flex-shrink-0">
              <h2 className="text-sm font-bold text-[#2563eb] uppercase tracking-wide">Summary</h2>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed text-justify">{data.summary}</p>
            </div>
          </div>
        )}

        {/* Work Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="flex gap-8">
            <div className="w-32 flex-shrink-0">
              <h2 className="text-sm font-bold text-[#2563eb] uppercase tracking-wide">Work Experience</h2>
            </div>
            <div className="flex-1 space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                    </div>
                    <span className="text-sm text-gray-500">{exp.period}</span>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div className="flex gap-8">
            <div className="w-32 flex-shrink-0">
              <h2 className="text-sm font-bold text-[#2563eb] uppercase tracking-wide">Education</h2>
            </div>
            <div className="flex-1 space-y-3">
              {data.education.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-sm text-gray-600">{edu.institution}</p>
                    </div>
                    <span className="text-sm text-gray-500">{edu.period}</span>
                  </div>
                  {edu.details && edu.details.length > 0 && (
                    <ul className="mt-1">
                      {edu.details.map((detail, dIdx) => (
                        <li key={dIdx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="flex gap-8">
            <div className="w-32 flex-shrink-0">
              <h2 className="text-sm font-bold text-[#2563eb] uppercase tracking-wide">Key Skills</h2>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                {data.skills.map((skill, idx) => (
                  <div key={idx} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="flex gap-8">
            <div className="w-32 flex-shrink-0">
              <h2 className="text-sm font-bold text-[#2563eb] uppercase tracking-wide">Certifications</h2>
            </div>
            <div className="flex-1">
              <ul className="space-y-1">
                {data.certifications.map((cert, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div className="flex gap-8">
            <div className="w-32 flex-shrink-0">
              <h2 className="text-sm font-bold text-[#2563eb] uppercase tracking-wide">Languages</h2>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{data.languages.join(', ')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
