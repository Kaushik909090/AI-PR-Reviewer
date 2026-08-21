import json

from openai import OpenAI
from django.conf import settings


# ============================================================
# OPENROUTER CLIENT
# ============================================================

def get_openrouter_client():
    """
    Create OpenRouter client using the API key
    stored in Django settings.
    """

    api_key = getattr(
        settings,
        "OPENROUTER_API_KEY",
        None,
    )

    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY is not configured."
        )

    return OpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "AI PR Reviewer",
        },
        timeout=60.0,
    )


# ============================================================
# BUILD CODE DIFF
# ============================================================

def build_code_diff(files):
    """
    Convert GitHub Pull Request files into a single
    text diff for AI analysis.
    """

    if not files:
        raise ValueError(
            "No files were provided for review."
        )

    code_sections = []

    for file in files:

        filename = file.get(
            "filename",
            "unknown",
        )

        status = file.get(
            "status",
            "unknown",
        )

        additions = file.get(
            "additions",
            0,
        )

        deletions = file.get(
            "deletions",
            0,
        )

        patch = file.get(
            "patch"
        )

        # ----------------------------------------------------
        # No patch
        # ----------------------------------------------------

        if not patch:

            code_sections.append(
                f"""
==================================================
FILE: {filename}
==================================================

Status: {status}
Additions: {additions}
Deletions: {deletions}

No text diff is available for this file.
"""
            )

            continue

        # ----------------------------------------------------
        # Patch available
        # ----------------------------------------------------

        code_sections.append(
            f"""
==================================================
FILE: {filename}
==================================================

Status: {status}
Additions: {additions}
Deletions: {deletions}

PATCH:

{patch}
"""
        )

    if not code_sections:

        raise ValueError(
            "No reviewable code changes were found."
        )

    return "\n".join(
        code_sections
    )


# ============================================================
# NORMALIZE REVIEW
# ============================================================

def normalize_review(content):
    """
    Convert AI response into a predictable
    structured dictionary.
    """

    # ========================================================
    # ALREADY DICTIONARY
    # ========================================================

    if isinstance(
        content,
        dict,
    ):

        data = content

    else:

        text = str(
            content
        ).strip()

        # ----------------------------------------------------
        # Remove markdown JSON fences
        # ----------------------------------------------------

        if text.startswith(
            "```json"
        ):

            text = text[7:]

        elif text.startswith(
            "```"
        ):

            text = text[3:]

        if text.endswith(
            "```"
        ):

            text = text[:-3]

        text = text.strip()

        # ----------------------------------------------------
        # Parse JSON
        # ----------------------------------------------------

        try:

            data = json.loads(
                text
            )

        except json.JSONDecodeError as e:

            print(
                "======================================"
            )

            print(
                "INVALID AI JSON"
            )

            print(
                text
            )

            print(
                "======================================"
            )

            raise ValueError(
                "OpenRouter returned invalid JSON."
            ) from e

    # ========================================================
    # RISK LEVEL
    # ========================================================

    risk_level = str(
        data.get(
            "risk_level",
            "LOW",
        )
    ).upper().strip()

    allowed_risks = {
        "CRITICAL",
        "HIGH",
        "MEDIUM",
        "LOW",
    }

    if risk_level not in allowed_risks:

        risk_level = "LOW"

    # ========================================================
    # ISSUES
    # ========================================================

    issues = data.get(
        "issues",
        [],
    )

    if not isinstance(
        issues,
        list,
    ):

        issues = []

    normalized_issues = []

    for issue in issues:

        if not isinstance(
            issue,
            dict,
        ):

            continue

        # ----------------------------------------------------
        # SEVERITY
        # ----------------------------------------------------

        severity = str(
            issue.get(
                "severity",
                "INFO",
            )
        ).upper().strip()

        allowed_severities = {
            "CRITICAL",
            "HIGH",
            "MEDIUM",
            "LOW",
            "INFO",
        }

        if severity not in allowed_severities:

            severity = "INFO"

        # ----------------------------------------------------
        # LINE
        # ----------------------------------------------------

        line = issue.get(
            "line",
            None,
        )

        try:

            if line is not None:
                line = int(line)

        except (
            ValueError,
            TypeError,
        ):

            line = None

        # ----------------------------------------------------
        # NORMALIZED ISSUE
        # ----------------------------------------------------

        normalized_issues.append(
            {
                "severity": severity,

                "file": str(
                    issue.get(
                        "file",
                        "unknown",
                    )
                ),

                "line": line,

                # NEW:
                # Relevant changed code
                "code": str(
                    issue.get(
                        "code",
                        "",
                    )
                ),

                "problem": str(
                    issue.get(
                        "problem",
                        "",
                    )
                ),

                "explanation": str(
                    issue.get(
                        "explanation",
                        "",
                    )
                ),

                "suggested_fix": str(
                    issue.get(
                        "suggested_fix",
                        "",
                    )
                ),
            }
        )

    # ========================================================
    # WHAT WAS DONE WELL
    # ========================================================

    what_was_done_well = data.get(
        "what_was_done_well",
        [],
    )

    if not isinstance(
        what_was_done_well,
        list,
    ):

        what_was_done_well = [
            str(
                what_was_done_well
            )
        ]

    # ========================================================
    # MAIN RECOMMENDATIONS
    # ========================================================

    main_recommendations = data.get(
        "main_recommendations",
        [],
    )

    if not isinstance(
        main_recommendations,
        list,
    ):

        main_recommendations = [
            str(
                main_recommendations
            )
        ]

    # ========================================================
    # FINAL STRUCTURE
    # ========================================================

    return {
        "risk_level": risk_level,

        "issues": normalized_issues,

        "overall_assessment": str(
            data.get(
                "overall_assessment",
                "No significant issues were found.",
            )
        ),

        "what_was_done_well":
            what_was_done_well,

        "main_recommendations":
            main_recommendations,
    }


# ============================================================
# AI CODE REVIEW
# ============================================================

def review_code(files):
    """
    Send GitHub Pull Request changes to OpenRouter
    and return a structured AI code review.
    """

    print(
        "======================================"
    )

    print(
        "BUILDING AI CODE REVIEW"
    )

    # ========================================================
    # BUILD DIFF
    # ========================================================

    code_diff = build_code_diff(
        files
    )

    # ========================================================
    # SYSTEM PROMPT
    # ========================================================

    system_prompt = """
You are a senior software engineer
performing a professional GitHub Pull Request review.

Analyze ONLY the changed code supplied in the PR patch.

Find REAL and meaningful problems.

Check for:

1. Bugs
2. Security vulnerabilities
3. Performance problems
4. Error handling problems
5. Edge cases
6. Maintainability problems
7. Code quality problems

DO NOT report:

- Formatting
- Blank lines
- Personal style preferences
- Missing docstrings
- Missing type hints
- Hypothetical problems
- Problems unrelated to changed code

Do not invent problems.


==================================================
RISK LEVEL
==================================================

Choose exactly ONE:

CRITICAL
HIGH
MEDIUM
LOW

CRITICAL:
Severe security issue, data loss,
remote code execution, authentication bypass,
or similarly severe problem.

HIGH:
Serious bug, security problem,
data corruption, or likely production failure.

MEDIUM:
Meaningful bug, important edge case,
incorrect behavior, or moderate reliability problem.

LOW:
Minor issue or no meaningful issue.

The risk MUST be based on the most severe
REAL issue found.

Use:

CRITICAL issue -> CRITICAL risk
HIGH issue -> HIGH risk
MEDIUM issue -> MEDIUM risk
Only LOW/INFO issues -> LOW risk
No issues -> LOW risk


==================================================
ISSUE FORMAT
==================================================

Every issue MUST contain:

severity
file
line
code
problem
explanation
suggested_fix

Severity must be exactly one of:

CRITICAL
HIGH
MEDIUM
LOW
INFO


==================================================
CODE CONTEXT
==================================================

For every issue:

1. Provide the exact changed filename.
2. Provide the approximate line number.
3. Provide the relevant changed code.
4. The "code" field must contain ONLY a short
   code fragment taken from the supplied PR patch.
5. NEVER invent code.
6. NEVER provide code that is not present
   in the supplied patch.

The code field should normally contain
one to three relevant lines.

Example:

{
    "severity": "MEDIUM",
    "file": "calculator.py",
    "line": 55,
    "code": "return (a / b) * 100",
    "problem": "Division by zero",
    "explanation": "The function can raise ZeroDivisionError when b is zero.",
    "suggested_fix": "Check whether b is zero before performing division."
}


==================================================
LINE NUMBER RULE
==================================================

Use the line number shown in the PR diff
when possible.

If the exact line number cannot be determined,
use the closest reasonable changed line.

Do not invent a line number for code that
does not appear in the patch.


==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

Do NOT return markdown.

Do NOT return ```json.

Do NOT explain your reasoning.

Do NOT write anything before the JSON.

Do NOT write anything after the JSON.

Use exactly this structure:

{
    "risk_level": "LOW",
    "issues": [],
    "overall_assessment": "No significant issues were found.",
    "what_was_done_well": [],
    "main_recommendations": []
}


If issues exist:

{
    "risk_level": "MEDIUM",
    "issues": [
        {
            "severity": "MEDIUM",
            "file": "calculator.py",
            "line": 55,
            "code": "return (a / b) * 100",
            "problem": "Division by zero",
            "explanation": "The function can raise ZeroDivisionError when b is zero.",
            "suggested_fix": "Check whether b is zero before performing division."
        }
    ],
    "overall_assessment": "Overall assessment",
    "what_was_done_well": [
        "Positive observation"
    ],
    "main_recommendations": [
        "Recommendation"
    ]
}
"""

    # ========================================================
    # USER PROMPT
    # ========================================================

    user_prompt = f"""
Review the following GitHub Pull Request.

IMPORTANT:

Analyze ONLY the changed code.

Do not analyze unrelated code.

Do not invent problems.

Every issue must reference code that actually
appears in the supplied patch.

Return ONLY the JSON object.

Do not provide reasoning.

Do not provide analysis.

Do not explain your thinking.

CHANGED CODE:

{code_diff}
"""

    # ========================================================
    # OPENROUTER CLIENT
    # ========================================================

    client = get_openrouter_client()

    # ========================================================
    # TRY TWICE
    # ========================================================

    for attempt in range(2):

        try:

            print(
                "--------------------------------------"
            )

            print(
                f"Sending PR changes to OpenRouter "
                f"(attempt {attempt + 1}/2)..."
            )

            # =================================================
            # OPENROUTER REQUEST
            # =================================================

            response = client.chat.completions.create(

                # Specific free model.
                model="openai/gpt-oss-20b:free",

                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_prompt,
                    },
                ],

                # More deterministic output.
                temperature=0,

                # Enough room for the structured review.
                max_tokens=4000,

                # OpenRouter-specific parameters.
                extra_body={
                    "reasoning": {
                        "effort": "low",
                        "exclude": True,
                    }
                },

                # Request JSON.
                response_format={
                    "type": "json_object"
                },
            )

            # =================================================
            # RESPONSE INFORMATION
            # =================================================

            print(
                "OpenRouter response received."
            )

            print(
                "Choices:",
                len(
                    response.choices
                )
                if response.choices
                else 0
            )

            # =================================================
            # NO CHOICES
            # =================================================

            if not response.choices:

                print(
                    "OpenRouter returned no choices."
                )

                continue

            # =================================================
            # GET CHOICE
            # =================================================

            choice = response.choices[0]

            print(
                "Finish reason:",
                getattr(
                    choice,
                    "finish_reason",
                    None,
                )
            )

            # =================================================
            # GET MESSAGE
            # =================================================

            message = getattr(
                choice,
                "message",
                None,
            )

            if not message:

                print(
                    "OpenRouter returned no message."
                )

                continue

            # =================================================
            # GET CONTENT
            # =================================================

            content = getattr(
                message,
                "content",
                None,
            )

            if not content:

                print(
                    "OpenRouter returned empty content."
                )

                print(
                    "Finish reason:",
                    getattr(
                        choice,
                        "finish_reason",
                        None,
                    )
                )

                continue

            content = str(
                content
            ).strip()

            if not content:

                print(
                    "OpenRouter returned blank content."
                )

                continue

            # =================================================
            # NORMALIZE
            # =================================================

            review = normalize_review(
                content
            )

            # =================================================
            # SUCCESS
            # =================================================

            print(
                "======================================"
            )

            print(
                "OpenRouter review completed successfully."
            )

            print(
                "Risk level:",
                review[
                    "risk_level"
                ]
            )

            print(
                "Issues found:",
                len(
                    review[
                        "issues"
                    ]
                )
            )

            print(
                "======================================"
            )

            return review

        # ====================================================
        # ERROR
        # ====================================================

        except Exception as e:

            print(
                "OPENROUTER ATTEMPT ERROR:"
            )

            print(
                str(e)
            )

            # ------------------------------------------------
            # Retry once
            # ------------------------------------------------

            if attempt == 0:

                print(
                    "Retrying OpenRouter..."
                )

                continue

            # ------------------------------------------------
            # Final error
            # ------------------------------------------------

            raise ValueError(
                "OpenRouter API request failed "
                "after 2 attempts: "
                + str(e)
            ) from e

    # ========================================================
    # BOTH ATTEMPTS FAILED
    # ========================================================

    raise ValueError(
        "OpenRouter did not return a usable review."
    )