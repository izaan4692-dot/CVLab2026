"""
S3 Service
Handles all S3 operations for resume uploads and downloads
"""
import boto3
import logging
import os
from typing import Optional, Tuple
from botocore.exceptions import ClientError
from botocore.config import Config

logger = logging.getLogger(__name__)

# S3 Configuration
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'me-central-1')
S3_BUCKET = os.getenv('S3_BUCKET', 'file-upload-cvai')


def get_s3_client():
    """Get configured S3 client"""
    # Configure boto3 for me-central-1 region compatibility
    config = Config(
        signature_version='s3v4',
        s3={
            'addressing_style': 'path'  # Use path-style addressing for better compatibility
        }
    )
    
    return boto3.client(
        's3',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        config=config
    )


def download_file_from_s3(s3_key: str, local_path: str) -> bool:
    """
    Download a file from S3 to local path

    Args:
        s3_key: The S3 object key
        local_path: Local file path to save to

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Use get_object instead of download_file to avoid HeadObject permission issues
        # Get file content first
        content = get_file_content_from_s3(s3_key)
        if content is None:
            logger.error(f"Failed to get file content from S3: {s3_key}")
            return False
        
        # Write content to local file
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"Downloaded {s3_key} to {local_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to download from S3: {e}")
        return False


def upload_file_to_s3(
    local_path: str,
    s3_key: str,
    content_type: str = 'application/octet-stream'
) -> Optional[str]:
    """
    Upload a file to S3

    Args:
        local_path: Local file path
        s3_key: S3 object key (path in bucket)
        content_type: MIME type of the file

    Returns:
        str: S3 URL if successful, None otherwise
    """
    try:
        s3_client = get_s3_client()

        extra_args = {
            'ContentType': content_type,
        }

        s3_client.upload_file(local_path, S3_BUCKET, s3_key, ExtraArgs=extra_args)

        s3_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        logger.info(f"Uploaded {local_path} to {s3_url}")
        return s3_url

    except ClientError as e:
        logger.error(f"Failed to upload to S3: {e}")
        return None


def upload_content_to_s3(
    content: bytes,
    s3_key: str,
    content_type: str = 'text/plain'
) -> Optional[str]:
    """
    Upload content directly to S3 (without saving to local file first)

    Args:
        content: Bytes content to upload
        s3_key: S3 object key
        content_type: MIME type

    Returns:
        str: S3 URL if successful, None otherwise
    """
    try:
        s3_client = get_s3_client()

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=content,
            ContentType=content_type
        )

        s3_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        logger.info(f"Uploaded content to {s3_url}")
        return s3_url

    except ClientError as e:
        logger.error(f"Failed to upload content to S3: {e}")
        return None


def get_presigned_url(s3_key: str, expiration: int = 3600, filename: Optional[str] = None, force_download: bool = False) -> Optional[str]:
    """
    Generate a presigned URL for downloading a file

    Args:
        s3_key: S3 object key
        expiration: URL expiration time in seconds (default 1 hour)
        filename: Optional filename for Content-Disposition header
        force_download: If True, add Content-Disposition: attachment to force download

    Returns:
        str: Presigned URL if successful, None otherwise
    """
    try:
        # For me-central-1, create client with explicit endpoint URL
        if AWS_REGION == 'me-central-1':
            endpoint_url = f'https://s3.{AWS_REGION}.amazonaws.com'
            s3_client = boto3.client(
                's3',
                region_name=AWS_REGION,
                endpoint_url=endpoint_url,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version='s3v4', s3={'addressing_style': 'path'})
            )
        else:
            s3_client = get_s3_client()

        params = {
            'Bucket': S3_BUCKET,
            'Key': s3_key
        }
        
        # Add Content-Disposition header to force download if requested
        if force_download:
            if filename:
                params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'
            else:
                params['ResponseContentDisposition'] = 'attachment'

        url = s3_client.generate_presigned_url(
            'get_object',
            Params=params,
            ExpiresIn=expiration
        )

        return url

    except ClientError as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error generating presigned URL: {e}")
        return None


def get_file_content_from_s3(s3_key: str) -> Optional[bytes]:
    """
    Get file content directly from S3

    Args:
        s3_key: S3 object key

    Returns:
        bytes: File content if successful, None otherwise
    """
    try:
        s3_client = get_s3_client()

        response = s3_client.get_object(Bucket=S3_BUCKET, Key=s3_key)
        content = response['Body'].read()

        return content

    except ClientError as e:
        logger.error(f"Failed to get file from S3: {e}")
        return None


def delete_file_from_s3(s3_key: str) -> bool:
    """
    Delete a file from S3

    Args:
        s3_key: S3 object key

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        s3_client = get_s3_client()
        s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
        logger.info(f"Deleted {s3_key} from S3")
        return True

    except ClientError as e:
        logger.error(f"Failed to delete from S3: {e}")
        return False


def check_s3_connection() -> bool:
    """
    Check if S3 connection is working

    Returns:
        bool: True if connection successful
    """
    try:
        s3_client = get_s3_client()
        s3_client.head_bucket(Bucket=S3_BUCKET)
        logger.info(f"S3 connection successful to bucket: {S3_BUCKET}")
        return True
    except ClientError as e:
        logger.error(f"S3 connection failed: {e}")
        return False
