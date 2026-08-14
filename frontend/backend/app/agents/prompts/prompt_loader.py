"""
Prompt Loader
Utility to load prompt templates from files
"""
import logging
from pathlib import Path
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)


class PromptLoader:
    """Load and cache prompt templates"""

    _cache = {}

    @classmethod
    def load_prompt(cls, prompt_path: Path) -> str:
        """
        Load prompt from file with caching

        Args:
            prompt_path: Path to prompt file

        Returns:
            str: Prompt content

        Raises:
            FileNotFoundError: If prompt file not found
        """
        # Check cache
        cache_key = str(prompt_path)
        if cache_key in cls._cache:
            logger.debug(f"Returning cached prompt: {prompt_path.name}")
            return cls._cache[cache_key]

        # Load from file
        if not prompt_path.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")

        try:
            with open(prompt_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Cache it
            cls._cache[cache_key] = content
            logger.info(f"Loaded prompt: {prompt_path.name} ({len(content)} chars)")

            return content

        except Exception as e:
            logger.error(f"Error loading prompt from {prompt_path}: {e}")
            raise

    @classmethod
    def load_analyst_prompt(cls) -> str:
        """Load Prompt 1: The Analyst"""
        return cls.load_prompt(settings.PROMPT1_PATH)

    @classmethod
    def load_gatherer_prompt(cls) -> str:
        """Load Prompt 2: The Gatherer"""
        return cls.load_prompt(settings.PROMPT2_PATH)

    @classmethod
    def load_craftsman_prompt(cls) -> str:
        """Load Prompt 3: The Craftsman"""
        return cls.load_prompt(settings.PROMPT3_PATH)

    @classmethod
    def clear_cache(cls):
        """Clear prompt cache (useful for development)"""
        cls._cache.clear()
        logger.info("Prompt cache cleared")


# Global instance
prompt_loader = PromptLoader()
