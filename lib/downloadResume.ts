/**
 * Download resume utilities for PDF and Word generation
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx';
import { ResumeData } from './resumeDataTypes';

// Font configuration - using Inter to match templates, with Calibri as fallback
// Note: Inter may not be available on all systems, Word will use fallback fonts
const FONT_FAMILY = 'Inter';

// Helper function to create TextRun with consistent font
function createTextRun(
  text: string,
  options: {
    bold?: boolean;
    size?: number;
    color?: string;
    font?: string;
  } = {}
): TextRun {
  return new TextRun({
    text,
    bold: options.bold,
    size: options.size,
    color: options.color,
    font: options.font || FONT_FAMILY,
  });
}

// Border configuration for tables without borders
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

/**
 * Download resume as PDF from HTML element
 */
export async function downloadResumeAsPDF(element: HTMLElement, filename: string = 'resume.pdf'): Promise<void> {
  console.log('[downloadResume] Starting PDF generation for:', filename);
  console.log('[downloadResume] Element:', element);
  
  try {
    // Fix for technical template gradient header - replace with solid color for PDF
    const gradientHeaders = element.querySelectorAll('h1');
    const originalStyles: { element: HTMLElement; originalClass: string; originalColor: string }[] = [];
    
    gradientHeaders.forEach((header) => {
      const htmlHeader = header as HTMLElement;
      if (htmlHeader.className.includes('bg-clip-text') || htmlHeader.className.includes('text-transparent')) {
        originalStyles.push({
          element: htmlHeader,
          originalClass: htmlHeader.className,
          originalColor: htmlHeader.style.color || '',
        });
        // Remove gradient-related classes and add solid blue color
        htmlHeader.className = htmlHeader.className
          .replace(/bg-gradient-to-r\s+from-\[#[^\]]+\]\s+to-\[#[^\]]+\]/g, '')
          .replace(/bg-clip-text/g, '')
          .replace(/text-transparent/g, '')
          .trim();
        // Set solid blue color via inline style (more reliable for PDF)
        htmlHeader.style.color = '#2563eb';
        htmlHeader.style.webkitBackgroundClip = 'unset';
        htmlHeader.style.backgroundClip = 'unset';
      }
    });

    // Remove min-height constraints that cause page splitting
    const minHeightElements = element.querySelectorAll('[class*="min-h-"]');
    const originalMinHeights: { element: HTMLElement; originalStyle: string }[] = [];
    
    minHeightElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.minHeight || htmlEl.className.includes('min-h-')) {
        originalMinHeights.push({
          element: htmlEl,
          originalStyle: htmlEl.style.cssText,
        });
        htmlEl.style.minHeight = 'auto';
        // Remove min-h-* classes
        htmlEl.className = htmlEl.className.replace(/min-h-\[?\d+[^\s]*\]?/g, '').trim();
      }
    });

    // Reduce spacing for Technical/Modern templates to fit on one page
    const spaceYElements = element.querySelectorAll('[class*="space-y-"]');
    const originalSpaceY: { element: HTMLElement; originalClass: string }[] = [];
    spaceYElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.className.includes('space-y-5')) {
        originalSpaceY.push({
          element: htmlEl,
          originalClass: htmlEl.className,
        });
        // Reduce spacing from space-y-5 to space-y-2 for PDF (more aggressive)
        htmlEl.className = htmlEl.className.replace(/space-y-5/g, 'space-y-2');
      }
    });

    // Reduce header spacing (mb-2, my-4) to prevent page breaks
    const headerElements = element.querySelectorAll('[class*="mb-"], [class*="my-"], [class*="mt-"]');
    const originalHeaderSpacing: { element: HTMLElement; originalClass: string }[] = [];
    headerElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const className = htmlEl.className;
      // Reduce margin-bottom and margin-y values
      if (className.includes('mb-2') || className.includes('mb-4') || className.includes('mb-6')) {
        originalHeaderSpacing.push({
          element: htmlEl,
          originalClass: className,
        });
        htmlEl.className = className
          .replace(/mb-2/g, 'mb-1')
          .replace(/mb-4/g, 'mb-2')
          .replace(/mb-6/g, 'mb-3');
      }
      if (className.includes('my-4') || className.includes('my-6')) {
        if (!originalHeaderSpacing.find(e => e.element === htmlEl)) {
          originalHeaderSpacing.push({
            element: htmlEl,
            originalClass: className,
          });
        }
        htmlEl.className = htmlEl.className
          .replace(/my-4/g, 'my-2')
          .replace(/my-6/g, 'my-3');
      }
    });

    // Reduce container padding (p-8 to p-4 for more space)
    const paddedElements = element.querySelectorAll('[class*="p-8"]');
    const originalPadding: { element: HTMLElement; originalClass: string }[] = [];
    paddedElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.className.includes('p-8')) {
        originalPadding.push({
          element: htmlEl,
          originalClass: htmlEl.className,
        });
        htmlEl.className = htmlEl.className.replace(/p-8/g, 'p-4');
      }
    });

    // Remove any overflow/clipping CSS that might hide content
    const overflowElements = element.querySelectorAll('*');
    const originalOverflows: { element: HTMLElement; originalOverflow: string; originalTextOverflow: string; originalWhiteSpace: string }[] = [];
    
    overflowElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const style = window.getComputedStyle(htmlEl);
      if (style.overflow === 'hidden' || style.textOverflow === 'ellipsis' || style.whiteSpace === 'nowrap') {
        originalOverflows.push({
          element: htmlEl,
          originalOverflow: htmlEl.style.overflow || '',
          originalTextOverflow: htmlEl.style.textOverflow || '',
          originalWhiteSpace: htmlEl.style.whiteSpace || '',
        });
        // Temporarily remove overflow restrictions for PDF capture
        htmlEl.style.overflow = 'visible';
        htmlEl.style.textOverflow = 'clip';
        htmlEl.style.whiteSpace = 'normal';
      }
    });

    // Ensure element itself doesn't clip content
    const originalElementOverflow = element.style.overflow;
    const originalElementOverflowX = element.style.overflowX;
    const originalElementOverflowY = element.style.overflowY;
    element.style.overflow = 'visible';
    element.style.overflowX = 'visible';
    element.style.overflowY = 'visible';

    // Wait for DOM reflow after removing min-height and overflow
    await new Promise(resolve => {
      // Force reflow by reading offsetHeight
      void element.offsetHeight;
      // Use requestAnimationFrame to ensure reflow is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    // Dynamic import for browser-only library
    console.log('[downloadResume] Importing html2pdf.js...');
    const html2pdf = (await import('html2pdf.js')).default;
    console.log('[downloadResume] html2pdf imported successfully');
    
    // Get accurate dimensions - use the maximum of scroll/offset/client dimensions
    // This ensures we capture all content even if there's overflow
    const elementHeight = Math.max(
      element.scrollHeight,
      element.offsetHeight,
      element.clientHeight
    );
    const elementWidth = Math.max(
      element.scrollWidth,
      element.offsetWidth,
      element.clientWidth
    );
    
    console.log('[downloadResume] Element dimensions:', {
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      offsetHeight: element.offsetHeight,
      offsetWidth: element.offsetWidth,
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      finalHeight: elementHeight,
      finalWidth: elementWidth,
    });
    
    // A4 dimensions in mm
    const a4Height = 297; // Full A4 height
    const a4Width = 210; // Full A4 width
    const pxToMm = 0.264583; // 1px = 0.264583mm at 96dpi
    const elementHeightMm = elementHeight * pxToMm;
    const elementWidthMm = elementWidth * pxToMm;
    
    // Calculate scale - but be less aggressive, allow multi-page if needed
    // Use margins of 10mm (5mm each side)
    const availableHeight = a4Height - 10; // Top + bottom margins
    const availableWidth = a4Width - 10; // Left + right margins
    
    const heightScale = availableHeight / elementHeightMm;
    const widthScale = availableWidth / elementWidthMm;
    
    // Use the smaller scale, but don't go below 0.7 to maintain readability
    // If content is too large, allow it to span multiple pages
    const optimalScale = Math.min(heightScale, widthScale, 1);
    const finalScale = Math.max(optimalScale, 0.7); // Minimum 0.7 scale for readability
    
    console.log('[downloadResume] Scale calculation:', {
      elementHeightMm,
      elementWidthMm,
      availableHeight,
      availableWidth,
      heightScale,
      widthScale,
      optimalScale,
      finalScale,
    });
    
    // Use higher scale for html2canvas to ensure quality
    // html2canvas scale is independent of PDF page size
    const canvasScale = 2; // High quality rendering
    
    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number], // 5mm margins
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: canvasScale, // High quality canvas rendering
        useCORS: true,
        logging: false,
        letterRendering: true,
        // Use actual element dimensions, not scroll dimensions
        // This ensures all content is captured
        width: elementWidth,
        height: elementHeight,
        windowWidth: elementWidth,
        windowHeight: elementHeight,
        // Additional options to ensure full content capture
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: false,
        // Ensure text is fully rendered - remove all overflow restrictions in cloned doc
        onclone: (clonedDoc: any) => {
          // Find all elements in cloned document and remove overflow restrictions
          // html2pdf passes a Document-like object, use any to avoid type conflicts
          if (clonedDoc && typeof clonedDoc.querySelectorAll === 'function') {
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el: any) => {
              // Check if element is an HTMLElement
              if (el instanceof HTMLElement) {
                // Force remove all overflow restrictions
                el.style.overflow = 'visible';
                el.style.overflowX = 'visible';
                el.style.overflowY = 'visible';
                // Remove text overflow clipping
                if (el.style.textOverflow === 'ellipsis') {
                  el.style.textOverflow = 'clip';
                }
                // Remove white-space nowrap that might cause clipping
                if (el.style.whiteSpace === 'nowrap') {
                  el.style.whiteSpace = 'normal';
                }
              }
            });
          }
        },
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const,
        compress: true,
        // Allow content to span multiple pages if needed
        putOnlyUsedFonts: true,
        floatPrecision: 16,
      },
      pagebreak: { 
        mode: ['css', 'legacy'], // Changed from 'avoid-all' to allow natural page breaks
        avoid: ['.avoid-break'],
      },
    };

    console.log('[downloadResume] Calling html2pdf().set().from().save()...');
    await html2pdf().set(opt).from(element).save();
    console.log('[downloadResume] PDF generation completed successfully');

    // Restore original gradient classes and styles
    originalStyles.forEach(({ element: el, originalClass, originalColor }) => {
      el.className = originalClass;
      if (originalColor) {
        el.style.color = originalColor;
      } else {
        el.style.color = '';
      }
      el.style.webkitBackgroundClip = '';
      el.style.backgroundClip = '';
    });

    // Restore original min-height styles
    originalMinHeights.forEach(({ element: el, originalStyle }) => {
      el.style.cssText = originalStyle;
    });

    // Restore original spacing
    originalSpaceY.forEach(({ element: el, originalClass }) => {
      el.className = originalClass;
    });

    // Restore original header spacing
    originalHeaderSpacing.forEach(({ element: el, originalClass }) => {
      el.className = originalClass;
    });

    // Restore original padding
    originalPadding.forEach(({ element: el, originalClass }) => {
      el.className = originalClass;
    });

    // Restore original overflow styles
    originalOverflows.forEach(({ element: el, originalOverflow, originalTextOverflow, originalWhiteSpace }) => {
      el.style.overflow = originalOverflow;
      el.style.textOverflow = originalTextOverflow;
      el.style.whiteSpace = originalWhiteSpace;
    });

    // Restore original element overflow
    element.style.overflow = originalElementOverflow;
    element.style.overflowX = originalElementOverflowX;
    element.style.overflowY = originalElementOverflowY;
  } catch (error) {
    console.error('[downloadResume] Error generating PDF:', error);
    console.error('[downloadResume] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download resume as Word document with template-specific styling
 */
export async function downloadResumeAsWord(data: ResumeData, template: string, filename: string = 'resume.docx'): Promise<void> {
  console.log('[downloadResume] Starting Word generation for:', filename, 'Template:', template);
  console.log('[downloadResume] Resume Data:', data);

  try {
    const children: (Paragraph | Table)[] = [];

    // Template-specific color constants
    const BLUE = '#2563eb';
    const TECHNICAL_BLUE = '#1D61CB'; // Technical template uses darker blue
    const GOLD = '#b45309';
    const BLACK = '#000000';
    const GRAY_600 = '#4b5563';
    const GRAY_700 = '#374151';
    const GRAY_500 = '#6b7280';

    // Apply template-specific formatting
    switch (template) {
      case 'classic':
        generateClassicTemplate(data, children, BLUE, GRAY_600, GRAY_700);
        break;
      case 'modern':
        generateModernTemplate(data, children, BLACK, GRAY_600, GRAY_700);
        break;
      case 'executive':
        generateExecutiveTemplate(data, children, GOLD, GRAY_600, GRAY_700);
        break;
      case 'technical':
        generateTechnicalTemplate(data, children, TECHNICAL_BLUE, GRAY_600, GRAY_700);
        break;
      default:
        generateClassicTemplate(data, children, BLUE, GRAY_600, GRAY_700);
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: FONT_FAMILY,
            },
          },
        },
      },
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('[downloadResume] Word generation completed successfully');
  } catch (error) {
    console.error('[downloadResume] Error generating Word document:', error);
    console.error('[downloadResume] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`Failed to generate Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate Classic Template (Two-column layout with blue headings)
 */
function generateClassicTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
  headingColor: string,
  textColor: string,
  secondaryTextColor: string
) {
  // Header - Blue Name (Centered, Uppercase)
  children.push(
    new Paragraph({
      children: [
        createTextRun((data.name || 'Your Name').toUpperCase(), {
          bold: true,
          size: 36,
          color: headingColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Contact Information (Centered)
  const contactInfo: string[] = [];
  if (data.email) contactInfo.push(data.email);
  if (data.phone) contactInfo.push(data.phone);
  if (data.location) contactInfo.push(data.location);

  if (contactInfo.length > 0) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(contactInfo.join(' | '), {
            size: 20,
            color: textColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Horizontal Rule (using border)
  children.push(
    new Paragraph({
      spacing: { after: 400 },
      border: {
        bottom: {
          color: '#d1d5db',
          size: 1,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  // Two-column layout for sections using Table
  const createTwoColumnSection = (heading: string, content: (Paragraph | Table)[]) => {
    const headingCell = new TableCell({
      width: { size: 20, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          children: [
            createTextRun(heading.toUpperCase(), {
              bold: true,
              size: 22,
              color: headingColor,
            }),
          ],
        }),
      ],
    });

    const contentCell = new TableCell({
      width: { size: 80, type: WidthType.PERCENTAGE },
      children: content,
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [headingCell, contentCell],
        }),
      ],
    });
  };

  // Summary
  if (data.summary) {
    const summaryContent = [
      new Paragraph({
        children: [
          createTextRun(data.summary, {
            size: 22,
            color: textColor,
          }),
        ],
        spacing: { after: 0 },
      }),
    ];
    children.push(createTwoColumnSection('Summary', summaryContent));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Work Experience
  if (data.experience && data.experience.length > 0) {
    const expContent: Paragraph[] = [];
    data.experience.forEach((exp) => {
      // Title and Company
      expContent.push(
        new Paragraph({
          children: [
            createTextRun(exp.title || '', {
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (exp.company) {
        expContent.push(
          new Paragraph({
            children: [
              createTextRun(exp.company, {
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      // Period
      if (exp.period) {
        expContent.push(
          new Paragraph({
            children: [
              createTextRun(exp.period, {
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          expContent.push(
            new Paragraph({
              children: [
                createTextRun(`• ${bullet}`, {
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      expContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    children.push(createTwoColumnSection('Work Experience', expContent));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduContent: Paragraph[] = [];
    data.education.forEach((edu) => {
      eduContent.push(
        new Paragraph({
          children: [
            createTextRun(edu.degree || '', {
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (edu.institution) {
        eduContent.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (edu.period) {
        eduContent.push(
          new Paragraph({
            children: [
              createTextRun(edu.period, {
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          eduContent.push(
            new Paragraph({
              children: [
                createTextRun(`• ${detail}`, {
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      eduContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    children.push(createTwoColumnSection('Education', eduContent));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Key Skills (2 columns grid)
  if (data.skills && data.skills.length > 0) {
    const skillsContent: Paragraph[] = [];
    const skillsPerColumn = Math.ceil(data.skills.length / 2);
    const leftSkills = data.skills.slice(0, skillsPerColumn);
    const rightSkills = data.skills.slice(skillsPerColumn);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: leftSkills.map(
                (skill) =>
                  new Paragraph({
                    children: [
                createTextRun(`• ${skill}`, {
                  size: 20,
                  color: textColor,
                }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: rightSkills.map(
                (skill) =>
                  new Paragraph({
                    children: [
                createTextRun(`• ${skill}`, {
                  size: 20,
                  color: textColor,
                }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
          ],
        }),
      ],
    });
    children.push(createTwoColumnSection('Key Skills', [skillsTable]));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    const certContent = data.certifications.map(
      (cert) =>
        new Paragraph({
          children: [
            createTextRun(`• ${cert}`, {
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
        })
    );
    children.push(createTwoColumnSection('Certifications', certContent));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    const langContent = [
      new Paragraph({
        children: [
              createTextRun(data.languages.join(', '), {
                size: 20,
                color: textColor,
              }),
        ],
      }),
    ];
    children.push(createTwoColumnSection('Languages', langContent));
  }
}

/**
 * Generate Modern Template (Clean minimal with black headings and borders)
 */
function generateModernTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
  headingColor: string,
  textColor: string,
  secondaryTextColor: string
) {
  // Header - Black Name (Centered, Uppercase)
  children.push(
    new Paragraph({
      children: [
        createTextRun((data.name || 'Your Name').toUpperCase(), {
          bold: true,
          size: 36,
          color: headingColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Contact Information
  const contactInfo: string[] = [];
  if (data.email) contactInfo.push(data.email);
  if (data.phone) contactInfo.push(data.phone);
  if (data.location) contactInfo.push(data.location);

  if (contactInfo.length > 0) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(contactInfo.join(' | '), {
            size: 20,
            color: textColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Thick horizontal rule
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      border: {
        bottom: {
          color: '#000000',
          size: 6,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  const createSection = (heading: string, content: (Paragraph | Table)[]) => {
    // Heading with border-bottom
    children.push(
      new Paragraph({
        children: [
          createTextRun(heading.toUpperCase(), {
            bold: true,
            size: 22,
            color: headingColor,
          }),
        ],
        spacing: { after: 200 },
        border: {
          bottom: {
            color: '#d1d5db',
            size: 1,
            style: BorderStyle.SINGLE,
          },
        },
      })
    );
    // Content
    content.forEach((p) => children.push(p));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  };

  // Summary
  if (data.summary) {
    createSection('Summary', [
      new Paragraph({
        children: [
          createTextRun(data.summary, {
            size: 22,
            color: textColor,
          }),
        ],
        spacing: { after: 0 },
      }),
    ]);
  }

  // Professional Experience
  if (data.experience && data.experience.length > 0) {
    const expContent: Paragraph[] = [];
    data.experience.forEach((exp) => {
      expContent.push(
        new Paragraph({
          children: [
            createTextRun(exp.title || '', {
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (exp.company) {
        expContent.push(
          new Paragraph({
            children: [
              createTextRun(exp.company, {
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (exp.period) {
        expContent.push(
          new Paragraph({
            children: [
              createTextRun(exp.period, {
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          expContent.push(
            new Paragraph({
              children: [
                createTextRun(`• ${bullet}`, {
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      expContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Professional Experience', expContent);
  }

  // Skills (3 columns)
  if (data.skills && data.skills.length > 0) {
    const skillsPerColumn = Math.ceil(data.skills.length / 3);
    const col1 = data.skills.slice(0, skillsPerColumn);
    const col2 = data.skills.slice(skillsPerColumn, skillsPerColumn * 2);
    const col3 = data.skills.slice(skillsPerColumn * 2);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col1.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      createTextRun(skill, {
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col2.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      createTextRun(skill, {
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col3.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      createTextRun(skill, {
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
          ],
        }),
      ],
    });
    createSection('Skills', [skillsTable]);
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduContent: Paragraph[] = [];
    data.education.forEach((edu) => {
      eduContent.push(
        new Paragraph({
          children: [
            createTextRun(edu.degree || '', {
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (edu.institution) {
        eduContent.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (edu.period) {
        eduContent.push(
          new Paragraph({
            children: [
              createTextRun(edu.period, {
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          eduContent.push(
            new Paragraph({
              children: [
                createTextRun(`• ${detail}`, {
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      eduContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Education', eduContent);
  }

  // Additional Information
  if ((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) {
    const additionalContent: Paragraph[] = [];
    if (data.languages && data.languages.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Languages: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
              createTextRun(data.languages.join(', '), {
                size: 20,
                color: textColor,
              }),
          ],
          spacing: { after: 100 },
        })
      );
    }
    if (data.certifications && data.certifications.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Certifications: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: data.certifications.join(', '),
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
    createSection('Additional Information', additionalContent);
  }
}

/**
 * Generate Executive Template (Gold accents, left-aligned name)
 */
function generateExecutiveTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
  headingColor: string,
  textColor: string,
  secondaryTextColor: string
) {
  // Header - Large Bold Name (Left-aligned)
  children.push(
    new Paragraph({
      children: [
        createTextRun(data.name || 'Your Name', {
          bold: true,
          size: 48,
          color: '#000000',
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // Title in Gold
  if (data.title) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(data.title.toUpperCase(), {
            bold: true,
            size: 28,
            color: headingColor,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Contact Information
  const contactInfo: string[] = [];
  if (data.location) contactInfo.push(data.location);
  if (data.email) contactInfo.push(data.email);
  if (data.website) contactInfo.push(data.website);

  if (contactInfo.length > 0) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(contactInfo.join(' | '), {
            size: 20,
            color: textColor,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Thick Gold horizontal rule
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      border: {
        bottom: {
          color: headingColor,
          size: 6,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  const createSection = (heading: string, content: (Paragraph | Table)[]) => {
    children.push(
      new Paragraph({
        children: [
          createTextRun(heading.toUpperCase(), {
            bold: true,
            size: 22,
            color: headingColor,
          }),
        ],
        spacing: { after: 200 },
      })
    );
    content.forEach((p) => children.push(p));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  };

  // Summary
  if (data.summary) {
    createSection('Summary', [
      new Paragraph({
        children: [
          createTextRun(data.summary, {
            size: 22,
            color: textColor,
          }),
        ],
        spacing: { after: 0 },
      }),
    ]);
  }

  // Professional Experience
  if (data.experience && data.experience.length > 0) {
    const expContent: Paragraph[] = [];
    data.experience.forEach((exp) => {
      expContent.push(
        new Paragraph({
          children: [
            createTextRun(exp.title || '', {
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (exp.company) {
        expContent.push(
          new Paragraph({
            children: [
              createTextRun(exp.company, {
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (exp.period) {
        expContent.push(
          new Paragraph({
            children: [
              createTextRun(exp.period, {
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          expContent.push(
            new Paragraph({
              children: [
                createTextRun(`• ${bullet}`, {
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      expContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Professional Experience', expContent);
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduContent: Paragraph[] = [];
    data.education.forEach((edu) => {
      eduContent.push(
        new Paragraph({
          children: [
            createTextRun(edu.degree || '', {
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (edu.institution) {
        eduContent.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (edu.period) {
        eduContent.push(
          new Paragraph({
            children: [
              createTextRun(edu.period, {
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          eduContent.push(
            new Paragraph({
              children: [
                createTextRun(`• ${detail}`, {
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      eduContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Education', eduContent);
  }

  // Additional Information
  if ((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) {
    const additionalContent: Paragraph[] = [];
    if (data.languages && data.languages.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ',
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: 'Languages: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
              createTextRun(data.languages.join(', '), {
                size: 20,
                color: textColor,
              }),
          ],
          spacing: { after: 100 },
          indent: { left: 200 },
        })
      );
    }
    if (data.certifications && data.certifications.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ',
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: 'Certifications: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: data.certifications.join(', '),
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 200 },
        })
      );
    }
    createSection('Additional Information', additionalContent);
  }
}

/**
 * Generate Technical Template (Blue headings, skills before experience)
 */
function generateTechnicalTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
  headingColor: string,
  textColor: string,
  secondaryTextColor: string
) {
  // Color constants matching the template
  const GRAY_600 = '#4b5563';
  const GRAY_700 = '#374151';

  // Header - Blue Name (Centered, Uppercase) - matches text-3xl
  children.push(
    new Paragraph({
      children: [
        createTextRun((data.name || 'Your Name').toUpperCase(), {
          bold: true,
          size: 36, // text-3xl equivalent
          color: headingColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Contact Information - smaller text (text-sm)
  const contactInfo: string[] = [];
  if (data.email) contactInfo.push(data.email);
  if (data.email && data.phone) contactInfo.push('|');
  if (data.phone) contactInfo.push(data.phone);
  if ((data.email || data.phone) && data.location) contactInfo.push('|');
  if (data.location) contactInfo.push(data.location);

  if (contactInfo.length > 0) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(contactInfo.join(' '), {
            size: 18, // text-sm equivalent
            color: GRAY_600,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  const createSection = (heading: string, content: (Paragraph | Table)[]) => {
    // Section heading with top AND bottom borders (border-t border-b)
    children.push(
      new Paragraph({
        children: [
          createTextRun(heading.toUpperCase(), {
            bold: true,
            size: 22, // text-base equivalent
            color: headingColor,
          }),
        ],
        spacing: { before: 200, after: 200 },
        border: {
          top: {
            color: headingColor,
            size: 1,
            style: BorderStyle.SINGLE,
          },
          bottom: {
            color: headingColor,
            size: 1,
            style: BorderStyle.SINGLE,
          },
        },
      })
    );
    content.forEach((p) => children.push(p));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  };

  // Summary
  if (data.summary) {
    createSection('Summary', [
      new Paragraph({
        children: [
          createTextRun(data.summary, {
            size: 20, // text-sm equivalent
            color: GRAY_700,
          }),
        ],
        spacing: { after: 0 },
      }),
    ]);
  }

  // Technical Skills (BEFORE Experience - 3 columns grid)
  if (data.skills && data.skills.length > 0) {
    const skillsPerColumn = Math.ceil(data.skills.length / 3);
    const col1 = data.skills.slice(0, skillsPerColumn);
    const col2 = data.skills.slice(skillsPerColumn, skillsPerColumn * 2);
    const col3 = data.skills.slice(skillsPerColumn * 2);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col1.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      createTextRun(skill, {
                        size: 20, // text-sm equivalent
                        color: GRAY_700,
                      }),
                    ],
                    spacing: { after: 50 }, // gap-y-1 equivalent
                  })
              ),
            }),
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col2.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skill,
                        size: 20,
                        color: GRAY_700,
                      }),
                    ],
                    spacing: { after: 50 },
                  })
              ),
            }),
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col3.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skill,
                        size: 20,
                        color: GRAY_700,
                      }),
                    ],
                    spacing: { after: 50 },
                  })
              ),
            }),
          ],
        }),
      ],
    });
    createSection('Technical Skills', [skillsTable]);
  }

  // Professional Experience
  if (data.experience && data.experience.length > 0) {
    const expContent: (Paragraph | Table)[] = [];
    data.experience.forEach((exp) => {
      // Title and company on same line, period on right (flex justify-between) - using table
      const titleCompany = exp.title ? `${exp.title}${exp.company ? `, ${exp.company}` : ''}` : exp.company || '';
      expContent.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: titleCompany,
                          bold: true,
                          size: 20, // text-sm equivalent
                          color: '#000000',
                        }),
                      ],
                    }),
                  ],
                }),
                ...(exp.period ? [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          createTextRun(exp.period, {
                            bold: true,
                            size: 20,
                            color: headingColor,
                          }),
                        ],
                        alignment: AlignmentType.RIGHT,
                      }),
                    ],
                  }),
                ] : []),
              ],
            }),
          ],
        })
      );
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          expContent.push(
            new Paragraph({
              children: [
                createTextRun('• ', {
                  size: 20,
                  color: GRAY_600,
                }),
                createTextRun(bullet, {
                  size: 20,
                  color: GRAY_700,
                }),
              ],
              spacing: { after: 50 },
              indent: { left: 200 },
            })
          );
        });
      }
      expContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Professional Experience', expContent);
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduContent: (Paragraph | Table)[] = [];
    data.education.forEach((edu) => {
      // Degree and period on same line (flex justify-between) - using table
      eduContent.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: edu.degree || '',
                          bold: true,
                          size: 20, // text-sm equivalent
                          color: '#000000',
                        }),
                      ],
                    }),
                  ],
                }),
                ...(edu.period ? [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                            createTextRun(edu.period, {
                              bold: true,
                              size: 20,
                              color: headingColor,
                            }),
                        ],
                        alignment: AlignmentType.RIGHT,
                      }),
                    ],
                  }),
                ] : []),
              ],
            }),
          ],
        })
      );
      if (edu.institution) {
        eduContent.push(
          new Paragraph({
            children: [
                createTextRun(edu.institution, {
                  size: 20,
                  color: GRAY_700,
                }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          eduContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '• ',
                  size: 20,
                  color: GRAY_600,
                }),
                          createTextRun(detail, {
                            size: 20,
                            color: GRAY_700,
                          }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      eduContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Education', eduContent);
  }

  // Additional Information
  if ((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) {
    const additionalContent: Paragraph[] = [];
    if (data.languages && data.languages.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
              createTextRun('• ', {
                size: 20,
                color: GRAY_600,
              }),
              createTextRun('Languages: ', {
                bold: true,
                size: 20,
                color: GRAY_700,
              }),
              createTextRun(data.languages.join(', ') + '.', {
                size: 20,
                color: GRAY_700,
              }),
          ],
          spacing: { after: 50 },
          indent: { left: 200 },
        })
      );
    }
    if (data.certifications && data.certifications.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ',
              size: 20,
              color: GRAY_600,
            }),
            createTextRun('Certifications: ', {
              bold: true,
              size: 20,
              color: GRAY_700,
            }),
            createTextRun(data.certifications.join(', ') + '.', {
              size: 20,
              color: GRAY_700,
            }),
          ],
          spacing: { after: 50 },
          indent: { left: 200 },
        })
      );
    }
    createSection('Additional Information', additionalContent);
  }
}

