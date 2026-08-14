"""
File Service
Handles file uploads, storage, and management
"""
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime
import logging

from fastapi import UploadFile, HTTPException
from app.config import settings

logger = logging.getLogger(__name__)


class FileService:
    """File handling service for local storage"""

    @staticmethod
    def validate_file(file: UploadFile) -> Tuple[bool, str]:
        """
        Validate uploaded file

        Args:
            file: UploadFile object

        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        # Check if file exists
        if not file:
            return False, "No file provided"

        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"File type not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"

        # File size will be checked during streaming
        return True, ""

    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """
        Generate unique filename with timestamp and UUID

        Args:
            original_filename: Original file name

        Returns:
            str: Unique filename
        """
        file_ext = Path(original_filename).suffix.lower()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"{timestamp}_{unique_id}{file_ext}"

    @staticmethod
    async def save_upload(file: UploadFile) -> Tuple[str, str, int]:
        """
        Save uploaded file to local storage

        Args:
            file: UploadFile object

        Returns:
            Tuple[str, str, int]: (file_path, file_type, file_size)

        Raises:
            HTTPException: If file validation fails or save fails
        """
        # Validate file
        is_valid, error_msg = FileService.validate_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        # Generate unique filename
        unique_filename = FileService.generate_unique_filename(file.filename)

        # Get file path
        file_path = settings.UPLOAD_DIR / unique_filename

        # Ensure directory exists
        settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        try:
            # Save file with size check
            file_size = 0
            with open(file_path, "wb") as buffer:
                while True:
                    chunk = await file.read(8192)  # 8KB chunks
                    if not chunk:
                        break

                    file_size += len(chunk)

                    # Check size limit
                    if file_size > settings.MAX_FILE_SIZE:
                        # Remove partial file
                        if file_path.exists():
                            os.remove(file_path)
                        raise HTTPException(
                            status_code=413,
                            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
                        )

                    buffer.write(chunk)

            file_type = Path(file.filename).suffix.lower().replace(".", "")

            logger.info(f"File saved successfully: {unique_filename} ({file_size} bytes)")

            return str(file_path), file_type, file_size

        except HTTPException:
            raise
        except Exception as e:
            # Clean up on error
            if file_path.exists():
                os.remove(file_path)
            logger.error(f"Error saving file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Delete file from storage

        Args:
            file_path: Path to file

        Returns:
            bool: True if deleted successfully
        """
        try:
            path = Path(file_path)
            if path.exists():
                os.remove(path)
                logger.info(f"File deleted: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {str(e)}")
            return False

    @staticmethod
    def get_file_path(filename: str, optimized: bool = False) -> Optional[Path]:
        """
        Get full file path

        Args:
            filename: Filename
            optimized: Whether to look in optimized directory

        Returns:
            Optional[Path]: File path if exists, None otherwise
        """
        directory = settings.OPTIMIZED_DIR if optimized else settings.UPLOAD_DIR
        file_path = directory / filename

        if file_path.exists():
            return file_path
        return None

    @staticmethod
    def save_optimized_resume(content: str, original_filename: str, format: str = "txt") -> str:
        """
        Save optimized resume content

        Args:
            content: Resume content
            original_filename: Original file name for reference
            format: Output format (txt, pdf, docx)

        Returns:
            str: Path to saved file
        """
        # Generate filename
        base_name = Path(original_filename).stem
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{base_name}_optimized_{timestamp}.{format}"

        file_path = settings.OPTIMIZED_DIR / filename

        # Ensure directory exists
        settings.OPTIMIZED_DIR.mkdir(parents=True, exist_ok=True)

        try:
            # For now, just save as text
            # TODO: Add PDF/DOCX generation
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)

            logger.info(f"Optimized resume saved: {filename}")
            return str(file_path)

        except Exception as e:
            logger.error(f"Error saving optimized resume: {str(e)}")
            raise


# Global instance
file_service = FileService()
