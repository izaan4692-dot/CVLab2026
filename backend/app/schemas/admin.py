"""
Admin Schemas
Pydantic models for admin API requests/responses
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ============== Stats Schemas ==============

class DashboardStats(BaseModel):
    """Dashboard statistics response"""
    server_uptime: str = "99.9%"
    resumes_processed: int
    total_sessions: int
    total_users: int


# ============== User Management Schemas ==============

class UserRole(str, Enum):
    """User role types"""
    USER = "user"
    ADMIN = "admin"
    AUTHENTICATED = "authenticated"  # Default Supabase role


class UserStatus(str, Enum):
    """User status types"""
    ACTIVE = "active"
    INACTIVE = "inactive"


class AdminUserResponse(BaseModel):
    """User response for admin panel"""
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    last_active: Optional[datetime] = None
    created_at: Optional[datetime] = None
    resumes_count: int = 0

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Paginated user list response"""
    users: List[AdminUserResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


class UserStatusUpdate(BaseModel):
    """Request to update user status"""
    status: UserStatus


# ============== Resume Management Schemas ==============

class AdminResumeStatus(str, Enum):
    """Resume status for admin view"""
    OPTIMIZED = "optimized"
    ANALYZED = "analyzed"
    FAILED = "failed"
    PROCESSING = "processing"


class AdminResumeListItem(BaseModel):
    """Resume item for admin list view"""
    id: int
    request_number: str  # Formatted as #1234
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    original_filename: str
    status: AdminResumeStatus
    user_status: Optional[UserStatus] = None  # User's active/inactive status
    created_at: datetime
    file_size: Optional[int] = None

    class Config:
        from_attributes = True


class AdminResumeListResponse(BaseModel):
    """Paginated resume list response"""
    resumes: List[AdminResumeListItem]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


class AIOptimizationInfo(BaseModel):
    """AI optimization details"""
    status: str
    optimization_score: Optional[int] = None
    readability_score: Optional[str] = None
    ats_score: Optional[int] = None
    improvements: List[str] = []


class AdminResumeDetail(BaseModel):
    """Detailed resume information for admin"""
    id: int
    request_number: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_status: Optional[UserStatus] = None  # User's active/inactive status
    original_filename: str
    file_type: str
    file_size: Optional[int] = None
    status: AdminResumeStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    extracted_text: Optional[str] = None
    ai_optimization: Optional[AIOptimizationInfo] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


# ============== Claims Management Schemas ==============

class ClaimStatus(str, Enum):
    """Claim status types"""
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"


class ClaimCreate(BaseModel):
    """Request to create a new claim"""
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)


class ClaimResponse(BaseModel):
    """Claim response"""
    id: int
    claim_id: str  # Formatted as #CLM-2024-001
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    subject: str
    description: str
    status: ClaimStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    class Config:
        from_attributes = True


class ClaimListResponse(BaseModel):
    """Paginated claim list response"""
    claims: List[ClaimResponse]
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1


class ClaimStatsResponse(BaseModel):
    """Claim statistics"""
    open_claims: int
    in_review: int
    resolved: int
    total: int


class ClaimStatusUpdate(BaseModel):
    """Request to update claim status"""
    status: ClaimStatus


# ============== LLM & Prompt Management Schemas ==============

class LLMProvider(str, Enum):
    """Supported LLM providers"""
    ANTHROPIC = "anthropic"
    OPENAI = "openai"


class LLMConfigResponse(BaseModel):
    """Current LLM configuration"""
    provider: LLMProvider
    model: str
    max_tokens: int


class LLMConfigUpdate(BaseModel):
    """Request to update LLM configuration"""
    provider: LLMProvider
    model: str


class PromptStatus(str, Enum):
    """Prompt status"""
    ACTIVE = "active"
    DRAFT = "draft"


class PromptResponse(BaseModel):
    """Prompt information"""
    id: str
    name: str
    title: str
    description: str
    content: str
    status: PromptStatus
    last_updated: datetime

    class Config:
        from_attributes = True


class PromptListResponse(BaseModel):
    """List of prompts"""
    prompts: List[PromptResponse]


class PromptUpdate(BaseModel):
    """Request to update a prompt"""
    content: str
    status: Optional[PromptStatus] = None
