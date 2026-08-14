"""Initial tables creation

Revision ID: 0001_initial
Revises:
Create Date: 2025-12-17 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create resumes table
    op.create_table(
        'resumes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_type', sa.String(length=10), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('s3_key', sa.String(length=500), nullable=True),
        sa.Column('s3_url', sa.String(length=1000), nullable=True),
        sa.Column('extracted_text', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('UPLOADED', 'EXTRACTING', 'EXTRACTED', 'ANALYZING', 'ANALYZED',
                                     'QUESTIONS_GENERATED', 'OPTIMIZING', 'OPTIMIZED', 'FAILED',
                                     name='resumestatus'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', sa.String(length=100), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_resumes_id'), 'resumes', ['id'], unique=False)

    # Create analyses table
    op.create_table(
        'analyses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('resume_id', sa.Integer(), nullable=False),
        sa.Column('report_json', sa.JSON(), nullable=False),
        sa.Column('total_issues', sa.Integer(), nullable=True),
        sa.Column('confidence_level', sa.String(length=20), nullable=True),
        sa.Column('analysis_duration', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resume_id')
    )
    op.create_index(op.f('ix_analyses_id'), 'analyses', ['id'], unique=False)

    # Create questions table
    op.create_table(
        'questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('resume_id', sa.Integer(), nullable=False),
        sa.Column('analysis_id', sa.Integer(), nullable=False),
        sa.Column('questions_json', sa.JSON(), nullable=False),
        sa.Column('total_questions', sa.Integer(), nullable=True),
        sa.Column('generation_duration', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['analysis_id'], ['analyses.id'], ),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resume_id')
    )
    op.create_index(op.f('ix_questions_id'), 'questions', ['id'], unique=False)

    # Create answers table
    op.create_table(
        'answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('resume_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('answers_json', sa.JSON(), nullable=False),
        sa.Column('total_answered', sa.Integer(), nullable=True),
        sa.Column('total_skipped', sa.Integer(), nullable=True),
        sa.Column('completion_percentage', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resume_id')
    )
    op.create_index(op.f('ix_answers_id'), 'answers', ['id'], unique=False)

    # Create optimized_resumes table
    op.create_table(
        'optimized_resumes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('resume_id', sa.Integer(), nullable=False),
        sa.Column('analysis_id', sa.Integer(), nullable=False),
        sa.Column('answer_id', sa.Integer(), nullable=False),
        sa.Column('optimized_text', sa.Text(), nullable=False),
        sa.Column('optimized_json', sa.JSON(), nullable=True),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('file_format', sa.String(length=10), nullable=True),
        sa.Column('s3_key', sa.String(length=500), nullable=True),
        sa.Column('s3_url', sa.String(length=1000), nullable=True),
        sa.Column('changes_summary', sa.JSON(), nullable=True),
        sa.Column('optimization_duration', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['analysis_id'], ['analyses.id'], ),
        sa.ForeignKeyConstraint(['answer_id'], ['answers.id'], ),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resume_id')
    )
    op.create_index(op.f('ix_optimized_resumes_id'), 'optimized_resumes', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_optimized_resumes_id'), table_name='optimized_resumes')
    op.drop_table('optimized_resumes')
    op.drop_index(op.f('ix_answers_id'), table_name='answers')
    op.drop_table('answers')
    op.drop_index(op.f('ix_questions_id'), table_name='questions')
    op.drop_table('questions')
    op.drop_index(op.f('ix_analyses_id'), table_name='analyses')
    op.drop_table('analyses')
    op.drop_index(op.f('ix_resumes_id'), table_name='resumes')
    op.drop_table('resumes')
    sa.Enum('UPLOADED', 'EXTRACTING', 'EXTRACTED', 'ANALYZING', 'ANALYZED',
            'QUESTIONS_GENERATED', 'OPTIMIZING', 'OPTIMIZED', 'FAILED',
            name='resumestatus').drop(op.get_bind())
