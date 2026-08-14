"""
Prompt 2: The Gatherer
Generates 10-25 short conversational questions based on analysis report
"""
import json
import logging
import re
import time
from typing import Dict, Any, List
from app.services.llm_handler import llm_handler
from app.agents.prompts.prompt_loader import prompt_loader
from app.config import settings

logger = logging.getLogger(__name__)


def extract_json_from_response(response: str) -> str:
    """Extract JSON from LLM response that may contain markdown or other text."""
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

    logger.info(f"Repairing truncated JSON (open braces: {open_braces}, open brackets: {open_brackets})")

    # Remove any trailing incomplete string/value
    repaired = json_str.rstrip()

    # Remove trailing incomplete string (unclosed quote)
    if repaired.count('"') % 2 != 0:
        last_quote = repaired.rfind('"')
        if last_quote > 0:
            prev_char = repaired[last_quote - 1] if last_quote > 0 else ''
            if prev_char != '\\':
                repaired = repaired[:last_quote] + '"'

    # Remove trailing comma if present
    repaired = repaired.rstrip().rstrip(',')

    # Close open brackets and braces
    repaired += ']' * open_brackets
    repaired += '}' * open_braces

    return repaired


class GathererAgent:
    """
    The Gatherer - Prompt 2
    Generates targeted questions based on CV analysis
    """

    def __init__(self, llm_handler_instance=None):
        """
        Initialize Gatherer Agent

        Args:
            llm_handler_instance: Optional LLM handler (uses global if None)
        """
        self.llm_handler = llm_handler_instance or llm_handler
        self.prompt_template = None

    def _load_prompt_template(self) -> str:
        """Load The Gatherer prompt template"""
        if not self.prompt_template:
            self.prompt_template = prompt_loader.load_gatherer_prompt()
        return self.prompt_template

    def _format_prompt(
        self,
        cv_text: str,
        analysis_report: Dict[str, Any]
    ) -> str:
        """
        Format the question generation prompt

        Args:
            cv_text: Original CV text
            analysis_report: Output from Prompt 1

        Returns:
            str: Formatted prompt
        """
        template = self._load_prompt_template()

        # Format analysis report as JSON
        analysis_json = json.dumps(analysis_report, indent=2, ensure_ascii=False)

        prompt = f"{template}\n\n" \
                 f"---ORIGINAL CV---\n\n" \
                 f"{cv_text}\n\n" \
                 f"---END OF CV---\n\n" \
                 f"---ANALYSIS REPORT (FROM PROMPT 1)---\n\n" \
                 f"{analysis_json}\n\n" \
                 f"---END OF ANALYSIS---"

        return prompt

    def _parse_questions_response(self, response: str) -> Dict[str, Any]:
        """
        Parse LLM response into structured questions

        Args:
            response: Raw LLM response

        Returns:
            Dict: Parsed questions data

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
                questions_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                # Try to repair truncated JSON
                logger.info(f"Initial JSON parse failed: {e}, attempting repair...")
                repaired_json = repair_truncated_json(json_str)
                questions_data = json.loads(repaired_json)
                logger.info("Successfully parsed repaired JSON")

            # Validate structure
            if "questions" not in questions_data:
                logger.warning("Missing 'questions' key in response")
                questions_data = {"questions": []}

            # Ensure metadata
            if "metadata" not in questions_data:
                questions_data["metadata"] = {}

            questions_data["metadata"]["total_questions"] = len(
                questions_data["questions"]
            )

            return questions_data

        except json.JSONDecodeError as e:
            logger.info(f"JSON parse failed after repair attempt: {e}")
            logger.debug(f"Extracted JSON preview: {json_str[:500] if json_str else 'Empty'}...")

            # Return minimal structure - proceed gracefully
            return {
                "questions": [],
                "metadata": {
                    "parse_note": "Questions response was truncated, proceeding with available data",
                    "response_length": len(json_str) if json_str else 0
                }
            }

    def generate_questions(
        self,
        cv_text: str,
        analysis_report: Dict[str, Any],
        max_tokens: int = None
    ) -> Dict[str, Any]:
        """
        Generate questions based on CV analysis

        Args:
            cv_text: Original CV text
            analysis_report: Output from Prompt 1 (The Analyst)
            max_tokens: Maximum tokens for response

        Returns:
            Dict containing:
            - questions: List of question objects
            - metadata: Question metadata
            - duration: Generation duration in seconds

        Raises:
            Exception: If generation fails
        """
        logger.info("Starting question generation with Prompt 2 (The Gatherer)")
        start_time = time.time()

        try:
            # Format prompt
            prompt = self._format_prompt(cv_text, analysis_report)

            # Get max tokens
            if max_tokens is None:
                max_tokens = settings.MAX_TOKENS

            # Call LLM
            logger.info(f"Calling LLM for question generation (max_tokens={max_tokens})")
            response = self.llm_handler.generate(
                prompt=prompt,
                max_tokens=max_tokens
            )

            # Parse response
            questions_data = self._parse_questions_response(response)

            # Add duration
            duration = int(time.time() - start_time)
            questions_data["duration"] = duration

            # Add metadata
            if "metadata" not in questions_data:
                questions_data["metadata"] = {}

            questions_data["metadata"]["generation_timestamp"] = time.time()

            # Count questions
            total_questions = len(questions_data.get("questions", []))
            questions_data["total_questions"] = total_questions

            logger.info(
                f"Question generation complete: {total_questions} questions in {duration}s"
            )

            return questions_data

        except Exception as e:
            duration = int(time.time() - start_time)
            logger.error(f"Question generation failed after {duration}s: {e}")
            raise


# Global instance
gatherer_agent = GathererAgent()
