"""
Prompt 3: The Craftsman
Generates optimized CV using analysis + questions + user answers
ZERO FABRICATION - Only uses provided information
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


class CraftsmanAgent:
    """
    The Craftsman - Prompt 3
    Creates optimized CV with ZERO FABRICATION rule
    """

    def __init__(self, llm_handler_instance=None):
        """
        Initialize Craftsman Agent

        Args:
            llm_handler_instance: Optional LLM handler (uses global if None)
        """
        self.llm_handler = llm_handler_instance or llm_handler
        self.prompt_template = None

    def _load_prompt_template(self) -> str:
        """Load The Craftsman prompt template"""
        if not self.prompt_template:
            self.prompt_template = prompt_loader.load_craftsman_prompt()
        return self.prompt_template

    def _format_prompt(
        self,
        cv_text: str,
        analysis_report: Dict[str, Any],
        questions: List[Dict[str, Any]],
        user_answers: List[Dict[str, Any]]
    ) -> str:
        """
        Format the optimization prompt

        Args:
            cv_text: Original CV text
            analysis_report: Output from Prompt 1
            questions: Questions from Prompt 2
            user_answers: User responses to questions

        Returns:
            str: Formatted prompt
        """
        template = self._load_prompt_template()

        # Format data as JSON
        analysis_json = json.dumps(analysis_report, indent=2, ensure_ascii=False)
        questions_json = json.dumps(questions, indent=2, ensure_ascii=False)
        answers_json = json.dumps(user_answers, indent=2, ensure_ascii=False)

        prompt = f"{template}\n\n" \
                 f"---ORIGINAL CV---\n\n" \
                 f"{cv_text}\n\n" \
                 f"---END OF CV---\n\n" \
                 f"---ANALYSIS REPORT (FROM PROMPT 1)---\n\n" \
                 f"{analysis_json}\n\n" \
                 f"---END OF ANALYSIS---\n\n" \
                 f"---QUESTIONS (FROM PROMPT 2)---\n\n" \
                 f"{questions_json}\n\n" \
                 f"---END OF QUESTIONS---\n\n" \
                 f"---USER ANSWERS---\n\n" \
                 f"{answers_json}\n\n" \
                 f"---END OF ANSWERS---"

        return prompt

    def _parse_optimization_response(self, response: str) -> Dict[str, Any]:
        """
        Parse LLM response into structured optimized CV

        Args:
            response: Raw LLM response

        Returns:
            Dict: Parsed optimized CV data

        Raises:
            ValueError: If parsing fails
        """
        try:
            # Extract JSON from response (handles markdown, preamble text, etc.)
            json_str = extract_json_from_response(response)

            # Parse JSON
            optimized_data = json.loads(json_str)

            # Validate structure
            if "optimized_cv" not in optimized_data:
                logger.warning("Missing 'optimized_cv' key in response")
                # Try to use the response as the CV text
                optimized_data = {
                    "optimized_cv": response,
                    "changes_summary": {},
                    "metadata": {}
                }

            # Log structured_data if present for debugging
            if "structured_data" in optimized_data:
                structured = optimized_data.get("structured_data", {})
                logger.info(f"Found structured_data with keys: {list(structured.keys())}")
                
                # Validate experience data
                if "experience" in structured:
                    exp_list = structured.get("experience", [])
                    logger.info(f"Found {len(exp_list)} experience entries")
                    for idx, exp in enumerate(exp_list):
                        title = exp.get("title", "")
                        company = exp.get("company", "")
                        location = exp.get("location", "")
                        logger.info(
                            f"Experience {idx}: title='{title}', company='{company}', location='{location}'"
                        )
                else:
                    logger.warning("structured_data found but no 'experience' key")

            return optimized_data

        except json.JSONDecodeError:
            # This is expected - the prompt instructs LLM to output plain CV text, not JSON
            # The raw markdown/text output is the optimized CV itself
            logger.info("Received plain text CV output (expected behavior)")

            cv_text = json_str if json_str else response

            # Check if response might be truncated (no clear ending)
            is_truncated = False
            if cv_text:
                # Simple heuristic: if response ends mid-word or mid-sentence
                cv_text = cv_text.strip()
                if cv_text and not cv_text[-1] in '.!?\n':
                    # Check if it ends mid-word
                    last_char = cv_text[-1]
                    if last_char.isalnum():
                        is_truncated = True
                        logger.info("CV output may be truncated, adding note to metadata")

            # Return the raw response as optimized text
            return {
                "optimized_cv": cv_text,
                "changes_summary": {
                    "format": "plain_text"
                },
                "metadata": {
                    "possibly_truncated": is_truncated
                }
            }

    def optimize_cv(
        self,
        cv_text: str,
        analysis_report: Dict[str, Any],
        questions: List[Dict[str, Any]],
        user_answers: List[Dict[str, Any]],
        max_tokens: int = None
    ) -> Dict[str, Any]:
        """
        Generate optimized CV

        Args:
            cv_text: Original CV text
            analysis_report: Output from Prompt 1
            questions: Questions from Prompt 2
            user_answers: User responses
            max_tokens: Maximum tokens for response

        Returns:
            Dict containing:
            - optimized_cv: Enhanced CV text
            - changes_summary: Summary of changes made
            - metadata: Optimization metadata
            - duration: Optimization duration in seconds

        Raises:
            Exception: If optimization fails
        """
        logger.info("Starting CV optimization with Prompt 3 (The Craftsman)")
        start_time = time.time()

        try:
            # Format prompt
            prompt = self._format_prompt(
                cv_text,
                analysis_report,
                questions,
                user_answers
            )

            # Get max tokens (optimization needs more tokens)
            if max_tokens is None:
                max_tokens = settings.MAX_TOKENS

            # Call LLM
            logger.info(f"Calling LLM for CV optimization (max_tokens={max_tokens})")
            response = self.llm_handler.generate(
                prompt=prompt,
                max_tokens=max_tokens
            )

            # Parse response
            optimized_data = self._parse_optimization_response(response)

            # Add duration
            duration = int(time.time() - start_time)
            optimized_data["duration"] = duration

            # Add metadata
            if "metadata" not in optimized_data:
                optimized_data["metadata"] = {}

            optimized_data["metadata"]["optimization_timestamp"] = time.time()
            optimized_data["metadata"]["original_cv_length"] = len(cv_text)
            optimized_data["metadata"]["optimized_cv_length"] = len(
                str(optimized_data.get("optimized_cv", ""))
            )

            # Calculate word counts
            original_words = len(cv_text.split())
            optimized_words = len(str(optimized_data.get("optimized_cv", "")).split())

            if "changes_summary" not in optimized_data:
                optimized_data["changes_summary"] = {}

            optimized_data["changes_summary"]["word_count_original"] = original_words
            optimized_data["changes_summary"]["word_count_optimized"] = optimized_words

            logger.info(
                f"Optimization complete: {original_words} → {optimized_words} words in {duration}s"
            )

            return optimized_data

        except Exception as e:
            duration = int(time.time() - start_time)
            logger.error(f"Optimization failed after {duration}s: {e}")
            raise


# Global instance
craftsman_agent = CraftsmanAgent()
