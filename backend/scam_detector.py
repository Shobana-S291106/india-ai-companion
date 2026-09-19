import re


SCAM_PATTERNS = {

    "pressure": [
        "pay immediately",
        "pay now",
        "urgent payment",
        "hurry",
        "act now",
        "last chance"
    ],

    "unexpected_payment": [
        "send money",
        "transfer money",
        "upi payment",
        "scan this qr",
        "pay extra",
        "additional charge"
    ],

    "credential_request": [
        "send otp",
        "share otp",
        "tell me your otp",
        "share password",
        "send password",
        "send card details"
    ],

    "identity_impersonation": [
        "police officer",
        "customs officer",
        "immigration officer",
        "government officer",
        "official representative"
    ],

    "too_good_to_be_true": [
        "free hotel",
        "free ticket",
        "free trip",
        "guaranteed refund",
        "guaranteed prize"
    ]
}


def detect_scam(text):

    text_lower = text.lower()

    detected = []

    for category, patterns in SCAM_PATTERNS.items():

        for pattern in patterns:

            if pattern in text_lower:

                detected.append({
                    "category": category,
                    "matched_text": pattern
                })

    categories = list({
        item["category"]
        for item in detected
    })

    # Indicator level, not a definitive scam verdict.
    if len(categories) == 0:
        level = "NO_CLEAR_WARNING"

    elif len(categories) == 1:
        level = "CAUTION"

    elif len(categories) == 2:
        level = "HIGH_CAUTION"

    else:
        level = "STRONG_WARNING"

    recommendations = [
        "Do not make a payment until the request is verified.",
        "Do not share OTPs, passwords or banking credentials.",
        "Verify claims using an official source.",
        "Keep screenshots, receipts or messages if the situation appears suspicious."
    ]

    return {
        "indicator_level": level,
        "detected_categories": categories,
        "warning_signs": detected,
        "recommended_actions": recommendations
    }