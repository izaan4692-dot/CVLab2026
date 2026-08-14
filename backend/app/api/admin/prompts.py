"""
Admin Prompt & LLM Configuration Endpoints
Manage prompts and LLM settings from admin panel
"""
import logging
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.admin.middleware import get_admin_user
from app.auth.middleware import AuthUser
from app.config import settings
from app.schemas.admin import (
    LLMConfigResponse,
    LLMConfigUpdate,
    LLMProvider,
    PromptResponse,
    PromptListResponse,
    PromptUpdate,
    PromptStatus
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Prompt definitions
PROMPTS = {
    "analyze_resume": {
        "id": "analyze_resume",
        "name": "Resume Analysis",
        "title": "Analyze Resume",
        "description": "Extract and analyze resume content to identify issues, strengths, and areas for improvement.",
        "file_path": settings.PROMPT1_PATH
    },
    "generate_questions": {
        "id": "generate_questions",
        "name": "Question Generation",
        "title": "Generate Questions",
        "description": "Generate targeted questions based on resume analysis to gather additional information from the user.",
        "file_path": settings.PROMPT2_PATH
    },
    "optimize_resume": {
        "id": "optimize_resume",
        "name": "Resume Optimization",
        "title": "Optimize Resume",
        "description": "Create an optimized version of the resume using analysis insights and user-provided answers.",
        "file_path": settings.PROMPT3_PATH
    }
}


@router.get("/llm-config", response_model=LLMConfigResponse)
async def get_llm_config(
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Get current LLM configuration

    Returns:
        LLMConfigResponse: Current provider, model, and settings
    """
    logger.info(f"Admin {admin_user.id} fetching LLM config")

    # Map provider string to enum
    provider_map = {
        "claude": LLMProvider.ANTHROPIC,
        "anthropic": LLMProvider.ANTHROPIC,
        "openai": LLMProvider.OPENAI,
    }

    current_provider = provider_map.get(
        settings.DEFAULT_LLM_PROVIDER.lower(),
        LLMProvider.ANTHROPIC
    )

    # Get current model based on provider
    if current_provider == LLMProvider.ANTHROPIC:
        current_model = settings.CLAUDE_MODEL
    elif current_provider == LLMProvider.OPENAI:
        current_model = settings.OPENAI_MODEL
    else:
        current_model = settings.CLAUDE_MODEL

    return LLMConfigResponse(
        provider=current_provider,
        model=current_model,
        max_tokens=settings.MAX_TOKENS
    )


@router.put("/llm-config", response_model=LLMConfigResponse)
async def update_llm_config(
    config_update: LLMConfigUpdate,
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Update LLM configuration

    Note: This updates the runtime configuration. For persistent changes,
    environment variables should be updated.

    Args:
        config_update: New provider and model settings

    Returns:
        LLMConfigResponse: Updated configuration
    """
    logger.info(
        f"Admin {admin_user.id} updating LLM config to "
        f"provider={config_update.provider}, model={config_update.model}"
    )

    # Validate model for provider - Latest production models as of December 2025
    valid_models = {
        LLMProvider.ANTHROPIC: [
            "claude-sonnet-4-20250514",        # Claude Sonnet 4 (May 2025)
            "claude-sonnet-4-5-20250929",      # Latest Claude Sonnet 4.5 (Sept 2025) - Best performance
            "claude-opus-4-5-20251101",        # Latest Claude Opus 4.5 (Nov 2025) - Most capable
            "claude-haiku-4-5-20251001",       # Latest Claude Haiku 4.5 (Oct 2025) - Fastest
            "claude-3-5-sonnet-20241022",      # Claude 3.5 Sonnet (Oct 2024)
            "claude-3-opus-20240229",          # Claude 3 Opus (Feb 2024)
            "claude-3-sonnet-20240229",        # Claude 3 Sonnet (Feb 2024)
            "claude-3-haiku-20240307",         # Claude 3 Haiku (Mar 2024)
        ],
        LLMProvider.OPENAI: [
            "gpt-4o",                          # Latest GPT-4o (Omni) - Best performance, multimodal
            "gpt-4o-mini",                     # GPT-4o Mini - Cost-effective, fast
            "gpt-4-turbo",                     # GPT-4 Turbo - Enhanced performance
            "gpt-4",                           # GPT-4 Standard
            "gpt-3.5-turbo",                   # GPT-3.5 Turbo - Fastest/Cheapest
        ]
    }

    if config_update.model not in valid_models.get(config_update.provider, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model '{config_update.model}' for provider '{config_update.provider}'"
        )

    # Update runtime settings
    # Note: These changes won't persist after restart
    provider_name = {
        LLMProvider.ANTHROPIC: "claude",
        LLMProvider.OPENAI: "openai",
    }

    # Update the settings object (runtime only)
    settings.DEFAULT_LLM_PROVIDER = provider_name[config_update.provider]
    if config_update.provider == LLMProvider.ANTHROPIC:
        settings.CLAUDE_MODEL = config_update.model
    elif config_update.provider == LLMProvider.OPENAI:
        settings.OPENAI_MODEL = config_update.model

    logger.info(f"LLM config updated successfully")

    return LLMConfigResponse(
        provider=config_update.provider,
        model=config_update.model,
        max_tokens=settings.MAX_TOKENS
    )


@router.get("/prompts", response_model=PromptListResponse)
async def list_prompts(
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    List all prompts

    Returns:
        PromptListResponse: List of all prompts with their content
    """
    logger.info(f"Admin {admin_user.id} listing prompts")

    prompts = []
    for prompt_id, prompt_info in PROMPTS.items():
        file_path = Path(prompt_info["file_path"])

        # Read prompt content
        content = ""
        last_updated = datetime.now()
        status = PromptStatus.DRAFT

        if file_path.exists():
            try:
                content = file_path.read_text(encoding="utf-8")
                last_updated = datetime.fromtimestamp(file_path.stat().st_mtime)
                status = PromptStatus.ACTIVE
            except Exception as e:
                logger.error(f"Failed to read prompt file {file_path}: {e}")
                content = f"Error reading prompt: {e}"

        prompts.append(PromptResponse(
            id=prompt_info["id"],
            name=prompt_info["name"],
            title=prompt_info["title"],
            description=prompt_info["description"],
            content=content,
            status=status,
            last_updated=last_updated
        ))

    return PromptListResponse(prompts=prompts)


@router.get("/prompts/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: str,
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Get a specific prompt

    Args:
        prompt_id: The prompt identifier

    Returns:
        PromptResponse: Prompt details and content
    """
    logger.info(f"Admin {admin_user.id} fetching prompt {prompt_id}")

    if prompt_id not in PROMPTS:
        raise HTTPException(status_code=404, detail="Prompt not found")

    prompt_info = PROMPTS[prompt_id]
    file_path = Path(prompt_info["file_path"])

    # Read prompt content
    content = ""
    last_updated = datetime.now()
    status = PromptStatus.DRAFT

    if file_path.exists():
        try:
            content = file_path.read_text(encoding="utf-8")
            last_updated = datetime.fromtimestamp(file_path.stat().st_mtime)
            status = PromptStatus.ACTIVE
        except Exception as e:
            logger.error(f"Failed to read prompt file {file_path}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to read prompt: {e}")

    return PromptResponse(
        id=prompt_info["id"],
        name=prompt_info["name"],
        title=prompt_info["title"],
        description=prompt_info["description"],
        content=content,
        status=status,
        last_updated=last_updated
    )


@router.put("/prompts/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: str,
    prompt_update: PromptUpdate,
    admin_user: AuthUser = Depends(get_admin_user)
):
    """
    Update a prompt's content

    Args:
        prompt_id: The prompt identifier
        prompt_update: New content and optional status

    Returns:
        PromptResponse: Updated prompt details
    """
    logger.info(f"Admin {admin_user.id} updating prompt {prompt_id}")

    if prompt_id not in PROMPTS:
        raise HTTPException(status_code=404, detail="Prompt not found")

    prompt_info = PROMPTS[prompt_id]
    file_path = Path(prompt_info["file_path"])

    # Validate content
    if not prompt_update.content or len(prompt_update.content.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Prompt content must be at least 10 characters"
        )

    # Write new content
    try:
        # Ensure directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Write content
        file_path.write_text(prompt_update.content, encoding="utf-8")

        # Clear prompt cache so agents will use the updated prompt
        from app.agents.prompts.prompt_loader import PromptLoader
        PromptLoader.clear_cache()
        logger.info(f"Prompt cache cleared after update")

        # Also clear agent-level caches to force reload
        from app.agents.prompt1_analyst import analyst_agent
        from app.agents.prompt2_gatherer import gatherer_agent
        from app.agents.prompt3_craftsman import craftsman_agent
        
        # Clear agent prompt template caches
        if prompt_id == "analyze_resume":
            analyst_agent.prompt_template = None
            logger.info("Cleared analyst agent prompt cache")
        elif prompt_id == "generate_questions":
            gatherer_agent.prompt_template = None
            logger.info("Cleared gatherer agent prompt cache")
        elif prompt_id == "optimize_resume":
            craftsman_agent.prompt_template = None
            logger.info("Cleared craftsman agent prompt cache")

        logger.info(f"Prompt {prompt_id} updated successfully and caches cleared")
    except Exception as e:
        logger.error(f"Failed to write prompt file {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save prompt: {e}")

    # Return updated prompt
    return await get_prompt(prompt_id, admin_user)
