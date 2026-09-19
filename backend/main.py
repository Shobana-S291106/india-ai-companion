from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form
import httpx

from ai_service import (
    ask_companion,
    ask_feature,
    analyze_menu,
    analyze_vision
)

from memory_db import (
    init_database,
    save_profile,
    get_profile,
    add_memory,
    get_memories,
    add_travel_event,
    get_travel_events
)

from safety_engine import analyze_safety
from scam_detector import detect_scam


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="India AI Companion",
    version="2.0.0"
)

# Initialize SQLite database
init_database()


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class ChatRequest(BaseModel):
    message: str
    menu_context: str | None = None


class OrderRequest(BaseModel):
    order: str


class VoiceTranslateRequest(BaseModel):
    text: str
    source_language: str = "English"
    target_language: str = "Tamil"


class FeatureRequest(BaseModel):
    prompt: str


# ============================================================
# TRAVELLER MEMORY MODELS
# ============================================================

class TravellerProfileRequest(BaseModel):
    name: str | None = None
    nationality: str | None = None
    food_preference: str | None = None
    spice_preference: str | None = None
    budget: str | None = None
    interests: str | None = None
    travel_style: str | None = None
    current_city: str | None = None


class MemoryRequest(BaseModel):
    memory_type: str
    memory: str


class TravelEventRequest(BaseModel):
    event_type: str
    location: str
    description: str


# ============================================================
# SAFETY MODELS
# ============================================================

class SafetyRequest(BaseModel):
    situation: str
    location: str | None = None
    price: str | None = None
    transport_type: str | None = None


class ScamRequest(BaseModel):
    text: str


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "status": "running",
        "message": "India AI Companion Backend is running",
        "version": "2.0.0"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "UP",
        "message": "India AI Companion Backend is healthy"
    }


# ============================================================
# NORMAL CHAT
# ============================================================

@app.post("/chat")
def chat(request: ChatRequest):

    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    response = ask_companion(
        request.message,
        request.menu_context or ""
    )

    return {
        "response": response
    }


# ============================================================
# FEATURE AI
# ============================================================

@app.post("/feature")
def feature(request: FeatureRequest):

    if not request.prompt.strip():
        raise HTTPException(
            status_code=400,
            detail="Feature prompt cannot be empty."
        )

    response = ask_feature(
        request.prompt
    )

    return {
        "response": response
    }


# ============================================================
# TRAVELLER PROFILE
# ============================================================

@app.post("/memory/profile")
def update_traveller_profile(
    request: TravellerProfileRequest
):

    profile = save_profile(
        name=request.name,
        nationality=request.nationality,
        food_preference=request.food_preference,
        spice_preference=request.spice_preference,
        budget=request.budget,
        interests=request.interests,
        travel_style=request.travel_style,
        current_city=request.current_city
    )

    return {
        "success": True,
        "profile": profile
    }


@app.get("/memory/profile")
def traveller_profile():

    return {
        "success": True,
        "profile": get_profile()
    }


# ============================================================
# TRAVEL MEMORIES
# ============================================================

@app.post("/memory")
def create_memory(
    request: MemoryRequest
):

    if not request.memory.strip():
        raise HTTPException(
            status_code=400,
            detail="Memory cannot be empty."
        )

    add_memory(
        request.memory_type,
        request.memory
    )

    return {
        "success": True,
        "message": "Travel memory saved."
    }


@app.get("/memory")
def memories():

    return {
        "success": True,
        "memories": get_memories()
    }


# ============================================================
# TRAVEL EVENTS
# ============================================================

@app.post("/travel-event")
def create_travel_event(
    request: TravelEventRequest
):

    if not request.description.strip():
        raise HTTPException(
            status_code=400,
            detail="Travel event description cannot be empty."
        )

    add_travel_event(
        request.event_type,
        request.location,
        request.description
    )

    return {
        "success": True,
        "message": "Travel event saved."
    }


@app.get("/travel-events")
def travel_events():

    return {
        "success": True,
        "events": get_travel_events()
    }


# ============================================================
# SAFETY INTELLIGENCE
# ============================================================

@app.post("/safety-check")
def safety_check(
    request: SafetyRequest
):

    if not request.situation.strip():
        raise HTTPException(
            status_code=400,
            detail="Situation cannot be empty."
        )

    result = analyze_safety(
        situation=request.situation,
        location=request.location,
        price=request.price,
        transport_type=request.transport_type
    )

    return {
        "success": True,
        "result": result
    }


# ============================================================
# SCAM DETECTION
# ============================================================

@app.post("/scam-check")
def scam_check(
    request: ScamRequest
):

    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    result = detect_scam(
        request.text
    )

    return {
        "success": True,
        "result": result
    }


# ============================================================
# MENU ANALYSIS
# ============================================================

@app.post("/analyze-menu")
async def analyze_menu_endpoint(
    file: UploadFile = File(...)
):

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Invalid image."
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG or WEBP image."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    response = analyze_menu(
        image_bytes,
        file.content_type
    )

    return {
        "response": response
    }


# ============================================================
# GENERIC VISION AI
# ============================================================

@app.post("/analyze-vision")
async def analyze_vision_endpoint(
    file: UploadFile = File(...),
    mode: str = "general"
):

    allowed_modes = {
        "menu",
        "bill",
        "transport",
        "sign",
        "general"
    }

    if mode not in allowed_modes:
        mode = "general"

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Invalid image."
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG or WEBP image."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    response = analyze_vision(
        image_bytes,
        file.content_type,
        mode
    )

    return {
        "response": response,
        "mode": mode
    }


# ============================================================
# ENGLISH → TAMIL ORDER TRANSLATION
# ============================================================

@app.post("/translate-order")
def translate_order(
    request: OrderRequest
):

    if not request.order.strip():
        raise HTTPException(
            status_code=400,
            detail="Order cannot be empty."
        )

    prompt = f"""
Translate this foreign traveller's restaurant order
into NATURAL, POLITE, SPOKEN TAMIL.

The traveller will say the sentence directly to
a restaurant worker.

Use everyday conversational Tamil.

Do NOT use overly formal textbook Tamil.

Preserve:
- Food names
- Quantities
- Numbers
- Special requests
- Meaning

Examples:

I want two dosas.
→ எனக்கு ரெண்டு தோசை வேணும்.

Give me one idli.
→ எனக்கு ஒரு இட்லி கொடுங்க.

Make it less spicy.
→ கொஞ்சம் காரம் கம்மியா வைக்கவும்.

Where is the toilet?
→ டாய்லெட் எங்கே இருக்கு?

Return ONLY the Tamil sentence.

Traveller order:

{request.order}
"""

    response = ask_feature(prompt)

    return {
        "translated": response
    }


# ============================================================
# VOICE TRANSLATION
# ============================================================

@app.post("/translate-voice")
def translate_voice(
    request: VoiceTranslateRequest
):

    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    prompt = f"""
You are a real-time communication translator
for a foreign traveller speaking with local people in India.

Translate the following spoken sentence from
{request.source_language}
to
{request.target_language}.

The translation will be spoken aloud to a local person.

IMPORTANT RULES:

1. Keep the original meaning exactly.
2. Do NOT add information.
3. Do NOT remove important information.
4. Make the translation natural for spoken conversation.
5. Use everyday conversational Tamil when the target
   language is Tamil.
6. Prefer natural spoken Tamil instead of formal textbook Tamil.
7. Make it polite and easy for a local person to understand.
8. Preserve names, numbers and quantities.
9. Do not change the traveller's intention.
10. Do not make assumptions.
11. Do not explain the translation.
12. Do not provide pronunciation.
13. Do not provide English.
14. Return ONLY the translated sentence.

Traveller said:

{request.text}
"""

    response = ask_feature(prompt)

    return {
        "translated": response
    }
@app.get("/location/reverse")
async def reverse_location(lat: float, lon: float):
    """
    Convert GPS coordinates into a human-readable location.
    Uses OpenStreetMap Nominatim.
    """

    try:
        url = "https://nominatim.openstreetmap.org/reverse"

        params = {
            "lat": lat,
            "lon": lon,
            "format": "json",
            "zoom": 18,
            "addressdetails": 1
        }

        headers = {
            "User-Agent": "IndiaCompanion/1.0"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                params=params,
                headers=headers
            )

        if response.status_code != 200:
            return {
                "success": False,
                "message": "Unable to determine the location."
            }

        data = response.json()

        address = data.get("address", {})

        return {
            "success": True,
            "display_name": data.get("display_name", ""),
            "city": (
                address.get("city")
                or address.get("town")
                or address.get("municipality")
                or address.get("village")
                or ""
            ),
            "locality": (
                address.get("suburb")
                or address.get("neighbourhood")
                or address.get("quarter")
                or ""
            ),
            "state": address.get("state", ""),
            "country": address.get("country", ""),
            "postcode": address.get("postcode", ""),
            "latitude": lat,
            "longitude": lon
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }