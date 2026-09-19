import os
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from context_engine import build_traveller_context


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY is missing. Please add it to backend/.env"
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(api_key=api_key)


# ============================================================
# GEMINI MODELS
# ============================================================

PRIMARY_MODEL = "gemini-3.6-flash"

FALLBACK_MODELS = [
    "gemini-3.5-flash",
    "gemini-2.5-flash",
]


# ============================================================
# INDIA COMPANION SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are India Companion, an AI-powered personal travel companion
for foreign travellers travelling independently in India.

Your purpose is to help travellers:

- Understand Indian culture and customs
- Understand Indian food
- Navigate unfamiliar situations
- Make safer decisions
- Understand signs, bills and travel documents
- Communicate respectfully with local people
- Understand transportation
- Make personalized travel decisions
- Feel confident travelling independently

IMPORTANT BEHAVIOUR:

1. Be friendly, calm and practical.

2. Explain Indian culture without stereotypes.

3. Customs can differ across Indian regions, religions,
   communities and families.

4. Never assume every Indian person follows the same custom.

5. For safety, identify warning signs rather than making
   unsupported accusations.

6. Do not create unnecessary fear.

7. Give concise answers first.

8. Use simple English suitable for a foreign traveller.

9. Remember traveller preferences when they are provided.

10. Ask a clarifying question when important information is missing.

11. Never invent exact prices, addresses, opening hours,
    train details or other facts.

12. Clearly say when information is uncertain.

13. Use traveller memory only when it is relevant to the
    current request.

14. Do not unnecessarily reveal or repeat stored personal
    information.

15. Give practical actions whenever possible.
"""


# ============================================================
# ERROR HELPERS
# ============================================================

def is_quota_error(error_text: str) -> bool:
    return (
        "429" in error_text
        or "resource_exhausted" in error_text
        or "quota" in error_text
        or "rate limit" in error_text
    )


def is_temporary_error(error_text: str) -> bool:
    return (
        "503" in error_text
        or "unavailable" in error_text
        or "high demand" in error_text
        or "temporarily" in error_text
        or "overloaded" in error_text
    )


# ============================================================
# TEXT GENERATION
# ============================================================

def generate_text(prompt: str) -> str:
    """
    Generate text using Gemini.

    Model strategy:

    1. Try gemini-3.6-flash
    2. Retry temporary failures
    3. Try gemini-3.5-flash
    4. Try gemini-2.5-flash
    5. Handle quota errors separately
    """

    full_prompt = f"""
{SYSTEM_PROMPT}

{prompt}
"""

    models = [PRIMARY_MODEL] + FALLBACK_MODELS

    for model_index, model_name in enumerate(models):

        max_retries = 2

        for attempt in range(max_retries):

            try:

                print(
                    f"Gemini request using {model_name} "
                    f"(attempt {attempt + 1}/{max_retries})"
                )

                response = client.models.generate_content(
                    model=model_name,
                    contents=full_prompt
                )

                if not response or not response.text:

                    return (
                        "I couldn't generate a response. "
                        "Please try again."
                    )

                print(
                    f"Gemini response successful using {model_name}"
                )

                return response.text.strip()

            except Exception as error:

                error_text = str(error).lower()

                print(
                    f"GEMINI ERROR - {model_name} "
                    f"(attempt {attempt + 1}/{max_retries}):",
                    error
                )

                # ------------------------------------------------
                # QUOTA ERROR
                # ------------------------------------------------

                if is_quota_error(error_text):

                    print(
                        f"Quota limit reached for {model_name}."
                    )

                    return (
                        "The free AI request limit has temporarily "
                        "been reached. Please wait a little and "
                        "try again."
                    )

                # ------------------------------------------------
                # TEMPORARY 503 ERROR
                # ------------------------------------------------

                if is_temporary_error(error_text):

                    if attempt < max_retries - 1:

                        wait_time = 2 ** attempt

                        print(
                            f"{model_name} is temporarily busy. "
                            f"Retrying in {wait_time} seconds..."
                        )

                        time.sleep(wait_time)

                        continue

                    print(
                        f"{model_name} unavailable after retries."
                    )

                    break

                # ------------------------------------------------
                # OTHER ERROR
                # ------------------------------------------------

                print(
                    f"Unexpected Gemini error from {model_name}."
                )

                break

        # --------------------------------------------------------
        # MOVE TO NEXT FALLBACK MODEL
        # --------------------------------------------------------

        if model_index < len(models) - 1:

            next_model = models[model_index + 1]

            print(
                f"Trying fallback Gemini model: {next_model}"
            )

    # ========================================================
    # ALL MODELS FAILED
    # ========================================================

    return (
        "The AI companion is temporarily busy. "
        "Please try again in a few seconds."
    )


# ============================================================
# NORMAL CHAT
# ============================================================

def ask_companion(
    user_message: str,
    menu_context: str = ""
) -> str:

    # ========================================================
    # GET PERSISTENT TRAVELLER CONTEXT
    # ========================================================

    try:

        traveller_context = build_traveller_context()

    except Exception as error:

        print(
            "MEMORY CONTEXT ERROR:",
            error
        )

        traveller_context = (
            "Traveller memory is currently unavailable."
        )

    # ========================================================
    # IMAGE CONTEXT
    # ========================================================

    context_text = ""

    if menu_context:

        context_text = f"""
The traveller previously analyzed an image.

Relevant image information:

{menu_context}
"""

    # ========================================================
    # PERSONALIZED PROMPT
    # ========================================================

    prompt = f"""
The traveller is using India Companion.

You have access to the traveller's saved context below.

============================================================
TRAVELLER CONTEXT
============================================================

{traveller_context}

============================================================
CURRENT IMAGE CONTEXT
============================================================

{context_text}

============================================================
TRAVELLER'S CURRENT MESSAGE
============================================================

{user_message}

============================================================
INSTRUCTIONS
============================================================

Answer as the traveller's personal India travel companion.

Use the traveller context when it is relevant.

Examples:

- If the traveller prefers vegetarian food,
  consider vegetarian options.

- If the traveller prefers mild food,
  avoid recommending very spicy dishes unless appropriate.

- If the traveller is travelling on a budget,
  consider budget-friendly options.

- If the traveller is interested in culture,
  explain cultural experiences in useful detail.

- If the traveller is travelling solo,
  include practical solo-travel considerations when relevant.

- If previous travel memories are relevant,
  use them naturally.

Do NOT force personalization into every answer.

Do NOT mention stored memories unnecessarily.

If important information is missing,
ask a short clarifying question.

If the question is about safety,
prioritize safe practical actions.

If it is about culture,
explain the context respectfully and avoid stereotypes.

If it is about food,
explain ingredients and vegetarian/non-vegetarian
possibilities carefully.

If it is about travel planning,
consider the traveller's preferences when available.

Never invent exact prices, addresses, opening hours,
transport details or other uncertain facts.

Return a clear answer in simple English.
"""

    return generate_text(prompt)


# ============================================================
# FEATURE REQUEST
# ============================================================

def ask_feature(prompt: str) -> str:
    """
    Used by Safety, Culture, Bill, Transport,
    Location, Emergency and other companion features.

    Traveller context is automatically included.
    """

    try:

        traveller_context = build_traveller_context()

    except Exception as error:

        print(
            "FEATURE MEMORY CONTEXT ERROR:",
            error
        )

        traveller_context = (
            "Traveller memory is currently unavailable."
        )

    enhanced_prompt = f"""
You are responding as India Companion.

============================================================
TRAVELLER CONTEXT
============================================================

{traveller_context}

============================================================
FEATURE REQUEST
============================================================

{prompt}

============================================================
PERSONALIZATION RULE
============================================================

Use traveller context only when it is relevant.

Do not unnecessarily reveal stored personal information.

Give practical, clear and concise advice.

If safety is involved, prioritize safer actions.

Do not make unsupported accusations.

If information is uncertain, clearly say so.
"""

    return generate_text(enhanced_prompt)


# ============================================================
# GENERIC VISION AI
# ============================================================

def analyze_vision(
    image_bytes: bytes,
    mime_type: str,
    mode: str = "general"
) -> str:

    mode_instructions = {

        # ====================================================
        # MENU
        # ====================================================

        "menu": """
Analyze this food menu for a foreign traveller.

Scan the ENTIRE visible image.

Identify, where readable:

- Food name
- Cuisine/type
- Exact visible price
- Vegetarian / non-vegetarian status
- Main ingredients
- Simple explanation
- Spice level if reasonably inferable
- Common accompaniments
- Useful traveller tips

Also provide:

1. A short menu summary
2. Clearly vegetarian options
3. Potentially spicy options
4. 3 to 5 approachable choices for a first-time
   foreign traveller
5. Items the traveller should ask the restaurant about

IMPORTANT:

- Do not invent food items.
- Do not invent prices.
- Preserve the exact visible names.
- If text is unclear, say "unclear".
- Analyze every visible section of the menu.
""",

        # ====================================================
        # BILL
        # ====================================================

        "bill": """
Analyze this bill, receipt or price document.

Identify, where readable:

- Business/restaurant name
- Items
- Quantities
- Individual prices
- Subtotal
- Taxes
- GST if visible
- Service charge if visible
- Discounts if visible
- Other charges
- Final total

Then explain the bill in simple English
for a foreign traveller.

Also identify anything that deserves clarification.

IMPORTANT:

- Never accuse the business of fraud.
- Never invent missing numbers.
- Preserve visible prices exactly.
- Mark unreadable information as unclear.
""",

        # ====================================================
        # TRANSPORT
        # ====================================================

        "transport": """
Analyze this Indian transport ticket, reservation,
boarding pass, railway ticket, bus ticket or travel document.

Identify, where readable:

- Train/bus/flight number
- Origin
- Destination
- Date
- Departure time
- Arrival time
- Platform
- Coach
- Seat
- Berth
- Class
- Passenger information if visible
- Ticket type
- Important instructions

Then explain the journey step-by-step
in simple English.

IMPORTANT:

- Do not invent missing details.
- Clearly mark information that cannot be read.
- Preserve numbers exactly.
""",

        # ====================================================
        # SIGN
        # ====================================================

        "sign": """
Analyze this sign, notice, board or written information.

Provide:

1. Exact readable text
2. English meaning
3. What the sign means for a foreign traveller
4. Any warning or instruction
5. Useful cultural or practical context

If the language is Tamil, Hindi or another Indian language,
identify it when reasonably clear.

Do not invent unreadable text.
""",

        # ====================================================
        # GENERAL
        # ====================================================

        "general": """
Understand this image as a general travel companion.

Identify what is visible.

Explain:

1. What the traveller is looking at
2. Important visible information
3. What it means
4. What the traveller may want to do next
5. Any relevant safety, cultural or travel consideration

Do not invent information that cannot be seen.

Clearly mark uncertain observations.
"""
    }

    instructions = mode_instructions.get(
        mode,
        mode_instructions["general"]
    )

    # ========================================================
    # GET TRAVELLER CONTEXT
    # ========================================================

    try:

        traveller_context = build_traveller_context()

    except Exception as error:

        print(
            "VISION MEMORY CONTEXT ERROR:",
            error
        )

        traveller_context = (
            "Traveller memory is currently unavailable."
        )

    # ========================================================
    # VISION PROMPT
    # ========================================================

    prompt = f"""
You are the Vision AI module of India Companion.

The traveller is a foreign visitor travelling independently
in India.

============================================================
TRAVELLER CONTEXT
============================================================

{traveller_context}

============================================================
IMAGE ANALYSIS TASK
============================================================

{instructions}

============================================================
PERSONALIZATION
============================================================

Use traveller preferences when recommending food or
explaining travel-related choices.

For example:

- Vegetarian traveller → highlight vegetarian choices.
- Mild-food preference → mention potentially spicy dishes.
- Budget traveller → explain visible prices when available.

Do not assume preferences that are not present in the context.

============================================================
ACCURACY RULES
============================================================

- Analyze the whole visible image.
- Do not make up text.
- Do not make up prices.
- Do not make up names.
- Do not make unsupported assumptions.
- If something cannot be read, say so.
- Focus on information useful to a traveller.
- Preserve exact visible information.
"""

    # ========================================================
    # VISION MODEL FALLBACK
    # ========================================================

    models = [PRIMARY_MODEL] + FALLBACK_MODELS

    for model_index, model_name in enumerate(models):

        max_retries = 2

        for attempt in range(max_retries):

            try:

                print(
                    f"Vision AI using {model_name} "
                    f"(attempt {attempt + 1}/{max_retries})"
                )

                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type
                        ),
                        prompt
                    ]
                )

                if not response or not response.text:

                    return (
                        "I couldn't understand this image. "
                        "Please try a clearer photo."
                    )

                print(
                    f"Vision AI successful using {model_name}"
                )

                return response.text.strip()

            except Exception as error:

                error_text = str(error).lower()

                print(
                    f"VISION AI ERROR - {model_name} "
                    f"(attempt {attempt + 1}/{max_retries}):",
                    error
                )

                # ------------------------------------------------
                # QUOTA
                # ------------------------------------------------

                if is_quota_error(error_text):

                    print(
                        f"Vision quota reached for {model_name}."
                    )

                    return (
                        "The free Vision AI request limit has "
                        "temporarily been reached. "
                        "Please wait a little and try again."
                    )

                # ------------------------------------------------
                # TEMPORARY 503
                # ------------------------------------------------

                if is_temporary_error(error_text):

                    if attempt < max_retries - 1:

                        wait_time = 2 ** attempt

                        print(
                            f"Gemini Vision is temporarily busy. "
                            f"Retrying in {wait_time} seconds..."
                        )

                        time.sleep(wait_time)

                        continue

                    print(
                        f"Vision model {model_name} "
                        f"unavailable after retries."
                    )

                    break

                # ------------------------------------------------
                # OTHER ERROR
                # ------------------------------------------------

                print(
                    f"Unexpected Vision AI error "
                    f"from {model_name}."
                )

                break

        # --------------------------------------------------------
        # NEXT FALLBACK
        # --------------------------------------------------------

        if model_index < len(models) - 1:

            next_model = models[model_index + 1]

            print(
                f"Trying fallback Vision model: {next_model}"
            )

    # ========================================================
    # ALL VISION MODELS FAILED
    # ========================================================

    return (
        "The Vision AI service is temporarily busy. "
        "Please try again in a few seconds."
    )


# ============================================================
# MENU COMPATIBILITY FUNCTION
# ============================================================

def analyze_menu(
    image_bytes: bytes,
    mime_type: str
) -> str:

    return analyze_vision(
        image_bytes,
        mime_type,
        "menu"
    )