from memory_db import (
    get_profile,
    get_memories,
    get_travel_events
)


def build_traveller_context():

    profile = get_profile()
    memories = get_memories()
    events = get_travel_events()

    context = []

    context.append("TRAVELLER PROFILE")

    if profile:

        fields = [
            ("Name", profile.get("name")),
            ("Nationality", profile.get("nationality")),
            ("Food preference", profile.get("food_preference")),
            ("Spice preference", profile.get("spice_preference")),
            ("Budget", profile.get("budget")),
            ("Interests", profile.get("interests")),
            ("Travel style", profile.get("travel_style")),
            ("Current city", profile.get("current_city")),
        ]

        for label, value in fields:

            if value:
                context.append(
                    f"- {label}: {value}"
                )

    else:
        context.append(
            "- No traveller profile has been created yet."
        )

    context.append("")
    context.append("TRAVEL MEMORIES")

    if memories:

        for memory in memories:
            context.append(
                f"- {memory['memory']}"
            )

    else:
        context.append(
            "- No previous memories."
        )

    context.append("")
    context.append("RECENT TRAVEL EVENTS")

    if events:

        for event in events:
            context.append(
                f"- {event['event_type']} "
                f"in {event['location']}: "
                f"{event['description']}"
            )

    else:
        context.append(
            "- No travel events recorded."
        )

    return "\n".join(context)