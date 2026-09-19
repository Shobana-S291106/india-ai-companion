import re


def analyze_safety(
    situation,
    location=None,
    price=None,
    transport_type=None
):

    situation_lower = situation.lower()

    warning_signs = []
    actions = []

    # Pressure / urgency
    urgency_words = [
        "urgent",
        "immediately",
        "right now",
        "hurry",
        "last chance",
        "don't tell anyone"
    ]

    for word in urgency_words:

        if word in situation_lower:
            warning_signs.append(
                "The situation involves pressure or urgency."
            )
            break

    # Payment
    payment_words = [
        "pay",
        "payment",
        "cash",
        "transfer",
        "upi",
        "qr",
        "money"
    ]

    if any(word in situation_lower for word in payment_words):

        warning_signs.append(
            "A payment or money request is involved."
        )

        actions.append(
            "Verify the price and payment recipient before paying."
        )

    # Documents
    if any(
        word in situation_lower
        for word in [
            "passport",
            "visa",
            "document",
            "id card"
        ]
    ):

        warning_signs.append(
            "Important personal documents may be involved."
        )

        actions.append(
            "Avoid handing over important documents unless required by an official authority."
        )

    # Taxi / transport
    if any(
        word in situation_lower
        for word in [
            "taxi",
            "cab",
            "auto",
            "driver",
            "rickshaw"
        ]
    ):

        warning_signs.append(
            "The situation involves local transport."
        )

        actions.append(
            "Confirm the fare and destination before starting the journey."
        )

    # Unknown person
    if any(
        word in situation_lower
        for word in [
            "stranger",
            "unknown person",
            "someone"
        ]
    ):

        warning_signs.append(
            "The situation involves an unfamiliar person."
        )

        actions.append(
            "Move to a public or well-populated place if you feel uncomfortable."
        )

    # Calculate a simple indicator level
    count = len(warning_signs)

    if count == 0:
        level = "LOW"

    elif count <= 2:
        level = "CAUTION"

    else:
        level = "HIGH_CAUTION"

    if not actions:

        actions.append(
            "Verify the situation using an official or trusted source."
        )

    return {
        "risk_level": level,
        "warning_signs": list(dict.fromkeys(warning_signs)),
        "recommended_actions": list(dict.fromkeys(actions)),
        "location": location,
        "transport_type": transport_type,
        "price": price
    }