"""
Prompt 1: The Analyst
Analyzes CV and generates comprehensive report with ceiling/floor/delta mapping
"""
import json
import logging
import re
import time
from typing import Dict, Any
from app.services.llm_handler import llm_handler
from app.agents.prompts.prompt_loader import prompt_loader
from app.config import settings

logger = logging.getLogger(__name__)


def extract_json_from_response(response: str) -> str:
    """
    Extract JSON from LLM response that may contain markdown or other text.

    Args:
        response: Raw LLM response

    Returns:
        str: Extracted JSON string
    """
    if not response:
        return ""

    response = response.strip()

    # Method 1: Try to find JSON in markdown code block
    json_block_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response)
    if json_block_match:
        return json_block_match.group(1).strip()

    # Method 2: Find the first { and last } for object
    first_brace = response.find('{')
    last_brace = response.rfind('}')

    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return response[first_brace:last_brace + 1]

    # Method 3: Find the first [ and last ] for array
    first_bracket = response.find('[')
    last_bracket = response.rfind(']')

    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        return response[first_bracket:last_bracket + 1]

    # Fallback: return stripped response
    return response


def repair_truncated_json(json_str: str) -> str:
    """
    Attempt to repair truncated JSON by closing open brackets/braces.

    Args:
        json_str: Potentially truncated JSON string

    Returns:
        str: Repaired JSON string
    """
    if not json_str:
        return json_str

    # Count open brackets/braces
    open_braces = json_str.count('{') - json_str.count('}')
    open_brackets = json_str.count('[') - json_str.count(']')

    # If balanced, return as-is
    if open_braces == 0 and open_brackets == 0:
        return json_str

    logger.warning(f"Attempting to repair truncated JSON (open braces: {open_braces}, open brackets: {open_brackets})")

    # Find the last complete item by looking for last complete structure
    # Remove any trailing incomplete string/value
    repaired = json_str.rstrip()

    # Remove trailing incomplete string (unclosed quote)
    if repaired.count('"') % 2 != 0:
        # Find last complete quoted string
        last_quote = repaired.rfind('"')
        if last_quote > 0:
            # Check if this quote is escaped
            prev_char = repaired[last_quote - 1] if last_quote > 0 else ''
            if prev_char != '\\':
                repaired = repaired[:last_quote] + '"'

    # Remove trailing comma if present
    repaired = repaired.rstrip().rstrip(',')

    # Close open brackets and braces
    repaired += ']' * open_brackets
    repaired += '}' * open_braces

    return repaired


class AnalystAgent:
    """
    The Analyst - Prompt 1
    Performs comprehensive CV analysis and identifies improvement areas
    """

    def __init__(self, llm_handler_instance=None):
        """
        Initialize Analyst Agent

        Args:
            llm_handler_instance: Optional LLM handler (uses global if None)
        """
        self.llm_handler = llm_handler_instance or llm_handler
        self.prompt_template = None

    def _load_prompt_template(self) -> str:
        """Load The Analyst prompt template"""
        if not self.prompt_template:
            self.prompt_template = prompt_loader.load_analyst_prompt()
        return self.prompt_template

    def _format_prompt(self, cv_text: str) -> str:
        """
        Format the analysis prompt with CV text

        Args:
            cv_text: Extracted CV text

        Returns:
            str: Formatted prompt
        """
        template = self._load_prompt_template()

        # Replace the placeholder in the prompt template
        prompt = template.replace("{cv_content}", cv_text)

        return prompt

    def _parse_analysis_response(self, response: str) -> Dict[str, Any]:
        """
        Parse LLM response into structured analysis

        Args:
            response: Raw LLM response

        Returns:
            Dict: Parsed analysis data

        Raises:
            ValueError: If parsing fails
        """
        json_str = ""
        try:
            # Debug: Log raw response
            logger.info(f"Raw LLM response length: {len(response)} chars")
            logger.debug(f"Raw LLM response preview: {response[:1000]}...")

            # Extract JSON from response (handles markdown, preamble text, etc.)
            json_str = extract_json_from_response(response)

            # Debug: Log extracted JSON
            logger.info(f"Extracted JSON length: {len(json_str)} chars")
            logger.debug(f"Extracted JSON preview: {json_str[:1000]}...")

            # Try to parse JSON
            try:
                analysis_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                # Try to repair truncated JSON
                logger.warning(f"Initial JSON parse failed: {e}, attempting repair...")
                repaired_json = repair_truncated_json(json_str)
                analysis_data = json.loads(repaired_json)
                logger.info("Successfully parsed repaired JSON")

            # Validate structure
            required_keys = ["issues", "metadata"]
            for key in required_keys:
                if key not in analysis_data:
                    logger.warning(f"Missing key in analysis: {key}")

            return analysis_data

        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse failed after repair attempt: {e}")
            logger.debug(f"Extracted JSON preview: {json_str[:500] if json_str else 'Empty'}...")

            # Return a minimal structure - this is not a critical error
            # The system can still proceed with questions based on original CV
            return {
                "issues": [],
                "metadata": {
                    "parse_note": "Analysis response was truncated, proceeding with available data",
                    "response_length": len(json_str) if json_str else 0
                },
                "statistics": {},
                "total_issues": 0
            }

    def analyze_cv(
        self,
        cv_text: str,
        max_tokens: int = None
    ) -> Dict[str, Any]:
        """
        Analyze CV and generate comprehensive report

        Args:
            cv_text: Extracted CV text
            max_tokens: Maximum tokens for response (defaults to settings)

        Returns:
            Dict containing:
            - issues: List of identified issues
            - ceiling_floor_mapping: Ceiling/Floor/Delta for each issue
            - metadata: Analysis metadata
            - statistics: CV statistics
            - duration: Analysis duration in seconds

        Raises:
            Exception: If analysis fails
        """
        logger.info("Starting CV analysis with Prompt 1 (The Analyst)")
        start_time = time.time()

        try:
            # Format prompt
            prompt = self._format_prompt(cv_text)

            # Get max tokens
            if max_tokens is None:
                max_tokens = settings.MAX_TOKENS

            # Call LLM
            logger.info(f"Calling LLM for analysis (max_tokens={max_tokens})")
            response = self.llm_handler.generate(
                prompt=prompt,
                max_tokens=max_tokens
            )

            # Parse response
            analysis_data = self._parse_analysis_response(response)

            # Add duration
            duration = int(time.time() - start_time)
            analysis_data["duration"] = duration

            # Add metadata if not present
            if "metadata" not in analysis_data:
                analysis_data["metadata"] = {}

            analysis_data["metadata"]["analysis_timestamp"] = time.time()
            analysis_data["metadata"]["cv_length"] = len(cv_text)

            # Count issues
            total_issues = len(analysis_data.get("issues", []))
            analysis_data["total_issues"] = total_issues

            logger.info(
                f"Analysis complete: {total_issues} issues identified in {duration}s"
            )

            return analysis_data

        except Exception as e:
            duration = int(time.time() - start_time)
            logger.error(f"Analysis failed after {duration}s: {e}")
            raise


# Global instance
analyst_agent = AnalystAgent()
