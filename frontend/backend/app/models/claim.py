"""
Claim Model
Stores user claims/support tickets for admin management
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class ClaimStatus(str, enum.Enum):
    """Claim processing status"""
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"


class Claim(Base):
    """Claims/Support tickets table"""
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)

    # User information (Supabase user UUID)
    user_id = Column(String(100), nullable=False, index=True)

    # Claim details
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    # Status
    status = Column(
        Enum(ClaimStatus),
        default=ClaimStatus.OPEN,
        nullable=False
    )

    # Resolution tracking
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(100), nullable=True)  # Admin user ID
    resolution_notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Claim(id={self.id}, subject={self.subject}, status={self.status})>"

    @property
    def claim_id_formatted(self) -> str:
        """Format claim ID as #CLM-YYYY-XXX"""
        year = self.created_at.year if self.created_at else 2024
        return f"#CLM-{year}-{str(self.id).zfill(3)}"
