"""
Unified LLM Handler for Claude and OpenAI
Provides a consistent interface for both providers with automatic fallback
Based on reference implementation
"""
import os
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path

# LLM Client imports
from openai import OpenAI
from anthropic import Anthropic

from app.config import settings

# Setup logging
logger = logging.getLogger(__name__)


class LLMHandler:
    """
    Unified handler for Claude and OpenAI APIs with automatic fallback
    """

    # Default models - Using Claude Sonnet 4 for best performance
    DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514"
    DEFAULT_OPENAI_MODEL = "gpt-4o"

    def __init__(
        self,
        llm_provider: str = None,
        model: Optional[str] = None,
        claude_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None
    ):
        """
        Initialize LLM Handler

        Args:
            llm_provider: "claude" or "openai" (defaults to settings)
            model: Specific model to use (if None, uses default for provider)
            claude_api_key: Claude API key (if None, reads from settings)
            openai_api_key: OpenAI API key (if None, reads from settings)
        """
        self.llm_provider = (llm_provider or settings.DEFAULT_LLM_PROVIDER).lower()

        # Get API keys from settings if not provided
        self.claude_api_key = claude_api_key or settings.ANTHROPIC_API_KEY
        self.openai_api_key = openai_api_key or settings.OPENAI_API_KEY

        # Initialize clients
        self.claude_client = None
        self.openai_client = None

        # Set model
        if model:
            self.model = model
        else:
            self.model = (
                settings.CLAUDE_MODEL if self.llm_provider == "claude"
                else settings.OPENAI_MODEL
            )

        # Initialize primary client
        self._initialize_clients()

        logger.info(f"LLM Handler initialized with provider: {self.llm_provider}, model: {self.model}")

    def _initialize_clients(self):
        """Initialize API clients"""
        # Try to initialize Claude client
        if self.claude_api_key:
            try:
                self.claude_client = Anthropic(api_key=self.claude_api_key)
                logger.info("Claude client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Claude client: {str(e)}")
                self.claude_client = None

        # Try to initialize OpenAI client
        if self.openai_api_key:
            try:
                self.openai_client = OpenAI(api_key=self.openai_api_key)
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {str(e)}")
                self.openai_client = None

    def _call_claude(self, messages: list, max_tokens: int = 8000) -> str:
        """
        Call Claude API

        Args:
            messages: List of message dicts with 'role' and 'content'
            max_tokens: Maximum tokens in response

        Returns:
            str: Response text
        """
        if not self.claude_client:
            raise Exception("Claude client not initialized. Check API key.")

        try:
            logger.info(f"Calling Claude API with model: {self.model}")

            # Convert messages format if needed (Claude expects specific format)
            # For Claude, we need to extract system messages separately
            system_message = ""
            user_messages = []

            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    user_messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })

            # If no user messages, just use the first message
            if not user_messages:
                user_messages = [{"role": "user", "content": messages[0]["content"]}]

            # Call Claude API
            kwargs = {
                "model": self.model,
                "max_tokens": max_tokens,
                "messages": user_messages
            }

            if system_message:
                kwargs["system"] = system_message

            response = self.claude_client.messages.create(**kwargs)

            result = response.content[0].text
            logger.info(f"Claude API call successful. Response length: {len(result)} chars")
            return result

        except Exception as e:
            logger.error(f"Claude API call failed: {str(e)}")
            raise

    def _call_openai(self, messages: list, max_tokens: int = 8000) -> str:
        """
        Call OpenAI API

        Args:
            messages: List of message dicts with 'role' and 'content'
            max_tokens: Maximum tokens in response

        Returns:
            str: Response text
        """
        if not self.openai_client:
            raise Exception("OpenAI client not initialized. Check API key.")

        try:
            logger.info(f"Calling OpenAI API with model: {self.model}")

            # For o1 models, use max_completion_tokens instead of max_tokens
            if self.model.startswith("o1"):
                response = self.openai_client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_completion_tokens=max_tokens
                )
            else:
                response = self.openai_client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=max_tokens
                )

            result = response.choices[0].message.content.strip()
            logger.info(f"OpenAI API call successful. Response length: {len(result)} chars")
            return result

        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}")
            raise

    def generate(
        self,
        prompt: str,
        max_tokens: int = None,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate response using the configured LLM with automatic fallback
        Reads current settings dynamically to support runtime configuration changes

        Args:
            prompt: User prompt
            max_tokens: Maximum tokens in response (defaults to settings.MAX_TOKENS)
            system_prompt: Optional system prompt

        Returns:
            str: Generated response
        """
        if max_tokens is None:
            max_tokens = settings.MAX_TOKENS

        # Read current settings dynamically (supports runtime config changes)
        current_provider = (settings.DEFAULT_LLM_PROVIDER or self.llm_provider).lower()
        current_model = (
            settings.CLAUDE_MODEL if current_provider == "claude"
            else settings.OPENAI_MODEL
        )
        
        # Update provider and model if settings changed
        if current_provider != self.llm_provider or current_model != self.model:
            logger.info(
                f"LLM config changed: {self.llm_provider}/{self.model} -> "
                f"{current_provider}/{current_model}. Updating handler..."
            )
            self.llm_provider = current_provider
            self.model = current_model
            # Reinitialize clients with new settings
            self._initialize_clients()

        # Prepare messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Try primary provider
        try:
            if self.llm_provider == "claude":
                return self._call_claude(messages, max_tokens)
            else:
                return self._call_openai(messages, max_tokens)

        except Exception as e:
            logger.warning(f"Primary LLM provider ({self.llm_provider}) failed: {str(e)}")
            logger.info("Attempting fallback to alternate provider...")

            # Try fallback
            try:
                if self.llm_provider == "claude" and self.openai_client:
                    logger.info("Falling back to OpenAI")
                    # Temporarily switch to default OpenAI model
                    original_model = self.model
                    self.model = self.DEFAULT_OPENAI_MODEL
                    result = self._call_openai(messages, max_tokens)
                    self.model = original_model
                    return result

                elif self.llm_provider == "openai" and self.claude_client:
                    logger.info("Falling back to Claude")
                    # Temporarily switch to default Claude model
                    original_model = self.model
                    self.model = self.DEFAULT_CLAUDE_MODEL
                    result = self._call_claude(messages, max_tokens)
                    self.model = original_model
                    return result

                else:
                    raise Exception("No fallback provider available")

            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {str(fallback_error)}")
                raise Exception(
                    f"Both primary and fallback LLM providers failed. "
                    f"Primary: {str(e)}, Fallback: {str(fallback_error)}"
                )


# Global instance
llm_handler = LLMHandler()
