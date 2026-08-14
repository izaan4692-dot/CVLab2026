/**
 * PDF Generation Utility using @react-pdf/renderer
 * 
 * This generates real text-based PDFs with:
 * - Selectable text
 * - Searchable content
 * - Smaller file size
 * - Professional quality
 */

import { pdf } from '@react-pdf/renderer';
import { ResumeData } from './resumeDataTypes';
import { getPDFTemplate, PDFTemplate, ensureFontsRegistered } from './pdfTemplates';

/**
 * Generate and download a PDF resume with real selectable text
 * 
 * @param data - The resume data to render
 * @param template - The template style to use ('classic' | 'modern' | 'executive' | 'technical')
 * @param filename - The filename for the downloaded PDF (default: 'resume.pdf')
 */
export async function generateAndDownloadPDF(
  data: ResumeData,
  template: PDFTemplate = 'classic',
  filename: string = 'resume.pdf',
  language: 'en' | 'ar' = 'en'
): Promise<void> {
  console.log('[generatePDF] Starting PDF generation for:', filename);
  console.log('[generatePDF] Template:', template);
  console.log('[generatePDF] Language:', language);
  console.log('[generatePDF] Data:', data);

  try {
    // Ensure fonts are registered before generating PDF
    await ensureFontsRegistered();
    
    // Get the appropriate template component
    const pdfDocument = getPDFTemplate(template, data, language);
    
    // Generate the PDF blob
    console.log('[generatePDF] Generating PDF blob...');
    const blob = await pdf(pdfDocument).toBlob();
    console.log('[generatePDF] PDF blob generated, size:', blob.size, 'bytes');

    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(url);
    
    console.log('[generatePDF] PDF download triggered successfully');
  } catch (error) {
    console.error('[generatePDF] Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a PDF blob without downloading (useful for previews or uploads)
 * 
 * @param data - The resume data to render
 * @param template - The template style to use
 * @returns Promise<Blob> - The generated PDF as a Blob
 */
export async function generatePDFBlob(
  data: ResumeData,
  template: PDFTemplate = 'classic',
  language: 'en' | 'ar' = 'en'
): Promise<Blob> {
  console.log('[generatePDF] Generating PDF blob for template:', template);

  try {
    const pdfDocument = getPDFTemplate(template, data, language);
    const blob = await pdf(pdfDocument).toBlob();
    console.log('[generatePDF] PDF blob generated, size:', blob.size, 'bytes');
    return blob;
  } catch (error) {
    console.error('[generatePDF] Error generating PDF blob:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a PDF as base64 string (useful for API uploads or email attachments)
 * 
 * @param data - The resume data to render
 * @param template - The template style to use
 * @returns Promise<string> - The generated PDF as a base64 string
 */
export async function generatePDFBase64(
  data: ResumeData,
  template: PDFTemplate = 'classic',
  language: 'en' | 'ar' = 'en'
): Promise<string> {
  console.log('[generatePDF] Generating PDF base64 for template:', template);

  try {
    const blob = await generatePDFBlob(data, template, language);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64Data = base64.split(',')[1];
        console.log('[generatePDF] PDF base64 generated, length:', base64Data.length);
        resolve(base64Data);
      };
      reader.onerror = () => {
        reject(new Error('Failed to convert PDF to base64'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[generatePDF] Error generating PDF base64:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

