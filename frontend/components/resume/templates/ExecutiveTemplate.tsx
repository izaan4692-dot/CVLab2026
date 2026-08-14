'use client';

import React from 'react';
import { ResumeData } from '@/lib/resumeDataTypes';

interface ExecutiveTemplateProps {
  data: ResumeData;
}

export function ExecutiveTemplate({ data }: ExecutiveTemplateProps) {
  return (
    <div className="bg-white p-8 min-h-[1000px] font-sans">
      {/* Header - Bold name with gold accent title */}
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          {data.name || 'Your Name'}
        </h1>
        {data.title && (
          <p className="text-lg font-medium text-[#b45309] uppercase tracking-wide mt-1">
            {data.title}
          </p>
        )}
        <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
          {data.location && <span>{data.location}</span>}
          {data.location && data.email && <span>|</span>}
          {data.email && <span>{data.email}</span>}
          {data.email && data.website && <span>|</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </div>

      <hr className="border-[#b45309] border-t-2 mb-5" />

      <div className="space-y-5">
        {/* Summary */}
        {data.summary && (
          <div>
            <h2 className="text-sm font-bold text-[#b45309] uppercase tracking-wide mb-2">
              Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">{data.summary}</p>
          </div>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#b45309] uppercase tracking-wide mb-3">
              Professional Experience
            </h2>
            <div className="space-y-4">
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

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#b45309] uppercase tracking-wide mb-3">
              Projects
            </h2>
            <div className="space-y-3">
              {data.projects.map((project, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      {project.organization && (
                        <p className="text-sm text-gray-600">{project.organization}</p>
                      )}
                    </div>
                    {project.period && <span className="text-sm text-gray-500">{project.period}</span>}
                  </div>
                  {project.details && project.details.length > 0 && (
                    <ul className="mt-1">
                      {project.details.map((detail, dIdx) => (
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

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#b45309] uppercase tracking-wide mb-3">
              Education
            </h2>
            <div className="space-y-3">
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

        {/* Additional Information */}
        {((data.languages && data.languages.length > 0) ||
          (data.certifications && data.certifications.length > 0)) && (
          <div>
            <h2 className="text-sm font-bold text-[#b45309] uppercase tracking-wide mb-3">
              Additional Information
            </h2>
            <div className="space-y-1">
              {data.languages && data.languages.length > 0 && (
                <p className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span><span className="font-semibold">Languages:</span> {data.languages.join(', ')}</span>
                </p>
              )}
              {data.certifications && data.certifications.length > 0 && (
                <p className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span><span className="font-semibold">Certifications:</span> {data.certifications.join(', ')}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
