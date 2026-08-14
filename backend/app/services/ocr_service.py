"""
OCR Service
Extracts text from PDF/DOC/DOCX files using OpenAI Vision API and fallback methods
Supports multiple file formats with robust error handling
"""
import logging
import subprocess
import os
from pathlib import Path
from typing import Optional, List, Tuple
import base64
import io
import mimetypes

# PDF processing
import PyPDF2
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

# PDF to image conversion for OpenAI Vision
try:
    import pdf2image
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

# Document processing
try:
    from docx import Document
except ImportError:
    Document = None

# For .doc files (legacy Word format)
try:
    import textract
    TEXTRACT_AVAILABLE = True
except ImportError:
    TEXTRACT_AVAILABLE = False

from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

# Supported file extensions and their normalized types
SUPPORTED_EXTENSIONS = {
    '.pdf': 'pdf',
    '.doc': 'doc',
    '.docx': 'docx',
    '.rtf': 'rtf',
    '.txt': 'txt',
    '.odt': 'odt',
}

# MIME type to extension mapping for validation
MIME_TO_EXT = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/rtf': 'rtf',
    'text/rtf': 'rtf',
    'text/plain': 'txt',
    'application/vnd.oasis.opendocument.text': 'odt',
}


class OCRService:
    """OCR service for text extraction from documents"""

    def __init__(self):
        """Initialize OCR service with OpenAI client"""
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            try:
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized for OCR")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client for OCR: {e}")

    def detect_file_type(self, file_path: str) -> Tuple[str, str]:
        """
        Detect file type from extension and content.
        Returns normalized file type and any warnings.

        Args:
            file_path: Path to file

        Returns:
            Tuple of (file_type, warning_message)
        """
        path = Path(file_path)
        ext = path.suffix.lower()
        warning = ""

        # Check if extension is supported
        if ext not in SUPPORTED_EXTENSIONS:
            # Try to detect from MIME type
            mime_type, _ = mimetypes.guess_type(file_path)
            if mime_type and mime_type in MIME_TO_EXT:
                detected_type = MIME_TO_EXT[mime_type]
                warning = f"Extension '{ext}' not recognized, detected as '{detected_type}' from MIME type"
                logger.info(warning)
                return detected_type, warning
            else:
                # Try to detect from file magic bytes
                detected_type = self._detect_from_magic_bytes(file_path)
                if detected_type:
                    warning = f"Extension '{ext}' not recognized, detected as '{detected_type}' from file content"
                    logger.info(warning)
                    return detected_type, warning

            return ext.lstrip('.'), f"Unknown file type: {ext}"

        return SUPPORTED_EXTENSIONS[ext], warning

    def _detect_from_magic_bytes(self, file_path: str) -> Optional[str]:
        """
        Detect file type from magic bytes (file signature).

        Args:
            file_path: Path to file

        Returns:
            Detected file type or None
        """
        try:
            with open(file_path, 'rb') as f:
                header = f.read(8)

            # PDF: %PDF
            if header.startswith(b'%PDF'):
                return 'pdf'

            # DOCX/XLSX/PPTX (ZIP-based): PK
            if header.startswith(b'PK\x03\x04'):
                # Could be docx, xlsx, pptx - check further
                return 'docx'  # Assume docx for resume context

            # DOC (OLE2): D0 CF 11 E0
            if header.startswith(b'\xd0\xcf\x11\xe0'):
                return 'doc'

            # RTF: {\rtf
            if header.startswith(b'{\\rtf'):
                return 'rtf'

            # Plain text (check if mostly printable ASCII)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    sample = f.read(1000)
                    if sample and all(c.isprintable() or c.isspace() for c in sample):
                        return 'txt'
            except:
                pass

            return None
        except Exception as e:
            logger.info(f"Magic byte detection failed: {e}")
            return None

    def extract_text_from_doc(self, file_path: str) -> str:
        """
        Extract text from legacy .doc file (Microsoft Word 97-2003)

        Args:
            file_path: Path to .doc file

        Returns:
            str: Extracted text
        """
        # Method 1: Try textract if available
        if TEXTRACT_AVAILABLE:
            try:
                text = textract.process(file_path).decode('utf-8')
                if text and len(text.strip()) > 10:
                    logger.info(f"Extracted {len(text)} chars from DOC using textract")
                    return text.strip()
            except Exception as e:
                logger.info(f"textract extraction not successful: {e}")

        # Method 2: Try antiword (Linux command line tool)
        try:
            result = subprocess.run(
                ['antiword', file_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0 and result.stdout:
                text = result.stdout.strip()
                if len(text) > 10:
                    logger.info(f"Extracted {len(text)} chars from DOC using antiword")
                    return text
        except FileNotFoundError:
            logger.info("antiword not installed, skipping")
        except Exception as e:
            logger.info(f"antiword extraction not successful: {e}")

        # Method 3: Try catdoc (another Linux tool)
        try:
            result = subprocess.run(
                ['catdoc', file_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0 and result.stdout:
                text = result.stdout.strip()
                if len(text) > 10:
                    logger.info(f"Extracted {len(text)} chars from DOC using catdoc")
                    return text
        except FileNotFoundError:
            logger.info("catdoc not installed, skipping")
        except Exception as e:
            logger.info(f"catdoc extraction not successful: {e}")

        # Method 4: Try python-docx (works for some .doc files that are actually .docx)
        text = self.extract_text_from_docx(file_path)
        if text and len(text) > 10:
            return text

        return ""

    def extract_text_from_rtf(self, file_path: str) -> str:
        """
        Extract text from RTF file

        Args:
            file_path: Path to RTF file

        Returns:
            str: Extracted text
        """
        # Method 1: Try textract
        if TEXTRACT_AVAILABLE:
            try:
                text = textract.process(file_path).decode('utf-8')
                if text and len(text.strip()) > 10:
                    logger.info(f"Extracted {len(text)} chars from RTF using textract")
                    return text.strip()
            except Exception as e:
                logger.info(f"textract RTF extraction not successful: {e}")

        # Method 2: Try unrtf command
        try:
            result = subprocess.run(
                ['unrtf', '--text', file_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0 and result.stdout:
                # unrtf adds some header text, try to clean it
                text = result.stdout
                # Remove the unrtf header
                if '###' in text:
                    text = text.split('###')[-1]
                text = text.strip()
                if len(text) > 10:
                    logger.info(f"Extracted {len(text)} chars from RTF using unrtf")
                    return text
        except FileNotFoundError:
            logger.info("unrtf not installed, skipping")
        except Exception as e:
            logger.info(f"unrtf extraction not successful: {e}")

        # Method 3: Basic RTF stripping (fallback)
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            # Very basic RTF tag removal
            import re
            text = re.sub(r'\\[a-z]+\d* ?', '', content)
            text = re.sub(r'[{}]', '', text)
            text = text.strip()
            if len(text) > 10:
                logger.info(f"Extracted {len(text)} chars from RTF using basic stripping")
                return text
        except Exception as e:
            logger.info(f"Basic RTF extraction not successful: {e}")

        return ""

    def extract_text_from_txt(self, file_path: str) -> str:
        """
        Extract text from plain text file

        Args:
            file_path: Path to text file

        Returns:
            str: Extracted text
        """
        encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']

        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    text = f.read().strip()
                if text:
                    logger.info(f"Extracted {len(text)} chars from TXT using {encoding}")
                    return text
            except Exception as e:
                continue

        logger.info("TXT extraction not successful with any encoding")
        return ""

    def extract_text_from_image_openai(self, file_path: str) -> str:
        """
        Extract text from image file using OpenAI Vision API

        Args:
            file_path: Path to image file

        Returns:
            str: Extracted text
        """
        if not self.openai_client:
            logger.info("OpenAI client not available for image OCR")
            return ""

        try:
            with open(file_path, 'rb') as f:
                img_data = f.read()

            img_base64 = base64.b64encode(img_data).decode('utf-8')

            # Detect image type
            ext = Path(file_path).suffix.lower()
            mime_type = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
            }.get(ext, 'image/png')

            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract ALL text from this resume/CV image. Return ONLY the extracted text, preserving the structure and formatting. Do not add any commentary."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{img_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=4000
            )

            text = response.choices[0].message.content
            if text:
                logger.info(f"Extracted {len(text)} chars from image using OpenAI Vision")
                return text.strip()

        except Exception as e:
            logger.info(f"OpenAI image OCR not successful: {e}")

        return ""

    def extract_text_from_pdf_pypdf2(self, file_path: str) -> str:
        """
        Extract text from PDF using PyPDF2 (fallback method)

        Args:
            file_path: Path to PDF file

        Returns:
            str: Extracted text
        """
        try:
            text = ""
            with open(file_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"

            logger.info(f"Extracted {len(text)} chars using PyPDF2")
            return text.strip()
        except Exception as e:
            logger.info(f"PyPDF2 extraction not successful: {e}")
            return ""

    def extract_text_from_pdf_pdfplumber(self, file_path: str) -> str:
        """
        Extract text from PDF using pdfplumber (better quality)

        Args:
            file_path: Path to PDF file

        Returns:
            str: Extracted text
        """
        if not pdfplumber:
            logger.warning("pdfplumber not available")
            return ""

        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

            logger.info(f"Extracted {len(text)} chars using pdfplumber")
            return text.strip()
        except Exception as e:
            logger.info(f"pdfplumber extraction not successful: {e}")
            return ""

    def extract_text_from_docx(self, file_path: str) -> str:
        """
        Extract text from DOCX file

        Args:
            file_path: Path to DOCX file

        Returns:
            str: Extracted text
        """
        if not Document:
            logger.info("python-docx not available")
            return ""

        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            logger.info(f"Extracted {len(text)} chars from DOCX")
            return text.strip()
        except Exception as e:
            logger.info(f"DOCX extraction not successful: {e}")
            return ""

    def extract_text_from_pdf_openai_direct(self, file_path: str) -> str:
        """
        Extract text from PDF using OpenAI by uploading the file directly.
        Uses the Assistants API with file upload for PDF text extraction.

        Args:
            file_path: Path to PDF file

        Returns:
            str: Extracted text
        """
        if not self.openai_client:
            logger.info("OpenAI client not available for PDF extraction")
            return ""

        try:
            logger.info("Extracting PDF text using OpenAI direct file upload...")

            # Read PDF file and encode as base64
            with open(file_path, 'rb') as f:
                pdf_data = f.read()

            pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')

            # Use GPT-4o which can process PDFs directly via base64
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",  # GPT-4o can handle PDF files
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Extract ALL text content from this resume/CV PDF document.

Instructions:
- Return ONLY the extracted text content
- Preserve the original structure and formatting as much as possible
- Include all sections: contact info, summary, experience, education, skills, etc.
- Do not add any commentary, explanations, or modifications
- If text is unclear, make your best effort to extract it accurately"""
                            },
                            {
                                "type": "file",
                                "file": {
                                    "filename": Path(file_path).name,
                                    "file_data": f"data:application/pdf;base64,{pdf_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=8000
            )

            text = response.choices[0].message.content
            if text:
                logger.info(f"OpenAI direct PDF extraction successful: {len(text)} chars")
                return text.strip()

        except Exception as e:
            logger.warning(f"OpenAI direct PDF extraction failed: {e}")
            # Fall back to Vision API with pdf2image if available
            return self.extract_text_from_pdf_openai_vision(file_path)

        return ""

    def extract_text_from_pdf_openai_vision(self, file_path: str) -> str:
        """
        Extract text from PDF using OpenAI Vision API (requires pdf2image/Poppler)
        Converts PDF pages to images and sends to GPT-4 Vision

        Args:
            file_path: Path to PDF file

        Returns:
            str: Extracted text
        """
        if not self.openai_client:
            logger.info("OpenAI client not available for Vision OCR")
            return ""

        if not PDF2IMAGE_AVAILABLE:
            logger.info("pdf2image not available, skipping OpenAI Vision OCR")
            return ""

        try:
            # Convert PDF to images
            logger.info("Converting PDF to images for OpenAI Vision OCR...")
            images = pdf2image.convert_from_path(file_path, dpi=150, first_page=1, last_page=5)  # Limit to 5 pages

            if not images:
                logger.info("No images extracted from PDF")
                return ""

            logger.info(f"Converted {len(images)} pages to images")

            all_text = []
            for i, image in enumerate(images):
                # Convert PIL image to base64
                buffered = io.BytesIO()
                image.save(buffered, format="PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

                # Call OpenAI Vision API
                logger.info(f"Processing page {i+1}/{len(images)} with OpenAI Vision...")
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",  # Use mini for cost efficiency
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Extract ALL text from this resume/CV image. Return ONLY the extracted text, preserving the structure and formatting. Do not add any commentary or explanations."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/png;base64,{img_base64}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=4000
                )

                page_text = response.choices[0].message.content
                if page_text:
                    all_text.append(page_text)
                    logger.info(f"Page {i+1}: Extracted {len(page_text)} characters")

            combined_text = "\n\n".join(all_text)
            logger.info(f"OpenAI Vision OCR complete: {len(combined_text)} total characters")
            return combined_text.strip()

        except Exception as e:
            logger.warning(f"OpenAI Vision OCR failed: {e}")
            return ""

    def extract_text(self, file_path: str, file_type: str) -> str:
        """
        Extract text from document using appropriate method.
        Handles multiple file formats with robust fallback mechanisms.

        Priority for PDF: OpenAI Vision OCR > pdfplumber > PyPDF2

        Args:
            file_path: Path to file
            file_type: File type (pdf, doc, docx, rtf, txt, etc.)

        Returns:
            str: Extracted text

        Raises:
            Exception: If extraction fails
        """
        # Detect actual file type (handles mismatched extensions)
        detected_type, warning = self.detect_file_type(file_path)

        # Use detected type if provided type doesn't match or is generic
        if file_type.lower() in ['', 'unknown', 'file'] or warning:
            file_type = detected_type
            if warning:
                logger.info(f"Using detected file type: {file_type}")
        else:
            file_type = file_type.lower()

        text = ""
        logger.info(f"Extracting text from {file_type} file: {file_path}")

        # Handle different file types
        if file_type == "pdf":
            text = self._extract_from_pdf(file_path)

        elif file_type == "docx":
            text = self.extract_text_from_docx(file_path)
            # If docx extraction fails, try as PDF (might be misnamed)
            if not text or len(text) < 50:
                logger.info("DOCX extraction failed, trying as PDF...")
                text = self._extract_from_pdf(file_path)

        elif file_type == "doc":
            text = self.extract_text_from_doc(file_path)
            # If doc extraction fails, try as docx then PDF
            if not text or len(text) < 50:
                logger.info("DOC extraction failed, trying as DOCX...")
                text = self.extract_text_from_docx(file_path)
            if not text or len(text) < 50:
                logger.info("DOCX fallback failed, trying as PDF...")
                text = self._extract_from_pdf(file_path)

        elif file_type == "rtf":
            text = self.extract_text_from_rtf(file_path)

        elif file_type == "txt":
            text = self.extract_text_from_txt(file_path)

        elif file_type == "odt":
            # Try textract for ODT
            if TEXTRACT_AVAILABLE:
                try:
                    text = textract.process(file_path).decode('utf-8')
                    logger.info(f"Extracted {len(text)} chars from ODT using textract")
                except Exception as e:
                    logger.info(f"ODT extraction not successful: {e}")

        else:
            # Unknown type - try all methods
            logger.info(f"Unknown file type '{file_type}', trying all extraction methods...")
            text = self._try_all_extraction_methods(file_path)

        # Validate extraction
        if not text or len(text) < 50:
            # Provide helpful error message based on what was tried
            raise Exception(
                f"Text extraction failed or insufficient content (extracted {len(text) if text else 0} chars). "
                f"File type detected: {file_type}. "
                f"Please ensure the file contains readable text or try converting to PDF/DOCX format."
            )

        logger.info(f"Successfully extracted {len(text)} characters from {file_type} file")
        return text

    def _extract_from_pdf(self, file_path: str) -> str:
        """
        Extract text from PDF using OpenAI as the primary method.
        Uses OpenAI direct PDF extraction (no fallbacks unless OpenAI fails).

        Args:
            file_path: Path to PDF file

        Returns:
            str: Extracted text
        """
        text = ""

        # Primary method: OpenAI direct PDF extraction
        if self.openai_client:
            logger.info("Using OpenAI for PDF text extraction (primary method)...")
            text = self.extract_text_from_pdf_openai_direct(file_path)
            if text and len(text) >= 50:
                logger.info(f"OpenAI PDF extraction successful: {len(text)} chars")
                return text
            else:
                logger.warning(f"OpenAI PDF extraction returned insufficient text: {len(text) if text else 0} chars")

        # If OpenAI is not available or failed, raise an error (no fallbacks)
        if not self.openai_client:
            raise Exception("OpenAI API key not configured. OpenAI is required for PDF text extraction.")

        # If we get here, OpenAI failed - raise an error
        raise Exception(
            f"OpenAI PDF extraction failed or returned insufficient content. "
            f"Please ensure the PDF contains readable text and try again."
        )

    def _try_all_extraction_methods(self, file_path: str) -> str:
        """
        Try extraction methods for unknown file types.
        Uses OpenAI as the primary method.

        Args:
            file_path: Path to file

        Returns:
            str: Extracted text
        """
        # Try OpenAI PDF extraction first (works for most document types)
        try:
            text = self._extract_from_pdf(file_path)
            if text and len(text) >= 50:
                return text
        except Exception as e:
            logger.info(f"PDF extraction failed: {e}")

        # Try DOCX
        text = self.extract_text_from_docx(file_path)
        if text and len(text) >= 50:
            return text

        # Try DOC
        text = self.extract_text_from_doc(file_path)
        if text and len(text) >= 50:
            return text

        # Try plain text
        text = self.extract_text_from_txt(file_path)
        if text and len(text) >= 50:
            return text

        return text or ""


# Global instance
ocr_service = OCRService()
