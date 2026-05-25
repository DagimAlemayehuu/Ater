"""
Navigation & UI control tools.
These tools emit SSE 'action' events that the frontend handles
to trigger real-time UI state changes — route navigation, tab switching,
note focusing, and toast notifications.
"""
import json
from typing import Optional
from pydantic import BaseModel, Field

# ── Input schemas ────────────────────────────────────────────────────────────

class NavigateToRouteInput(BaseModel):
    route: str = Field(
        description=(
            "The app route path to navigate to. "
            "Valid values: '/oracle', '/obsidian', '/academic', '/practice', '/agents', '/settings'. "
            "For /obsidian you may append ?path=<encoded_path> or ?search=<term>. "
            "For /academic you may append ?tab=courses|semesters|exams|assignments|planner|program."
        )
    )

class NavigateToNoteInput(BaseModel):
    note_path: str = Field(
        description="Relative path to the note inside the vault (e.g. 'Notes/My_Note.md' or just 'My_Note')."
    )

class SwitchAcademicTabInput(BaseModel):
    tab: str = Field(
        description="Academic dashboard tab to activate: 'courses', 'semesters', 'exams', 'assignments', 'planner', 'program'."
    )

class TriggerNotificationInput(BaseModel):
    variant: str = Field(
        description="Notification style: 'success', 'error', 'info', 'warning'."
    )
    message: str = Field(description="The message text to display in the notification.")

# ── Tool implementations ─────────────────────────────────────────────────────

# Navigation tools return structured JSON payloads that the assistant's
# run loop wraps in 'data: {"type": "action", ...}' SSE events.
# The React frontend watches for these events and calls the appropriate handler.

def navigate_to_route(route: str) -> str:
    """Emit a UI action to navigate the app to a specific route."""
    payload = json.dumps({"action": "navigate", "route": route})
    # The run loop intercepts strings starting with ACTION: and wraps them
    return f"ACTION:{payload}"

def navigate_to_note(note_path: str) -> str:
    """Open a specific note in the Obsidian vault view."""
    from urllib.parse import quote
    encoded = quote(note_path)
    payload = json.dumps({
        "action": "navigate",
        "route": f"/obsidian?path={encoded}"
    })
    return f"ACTION:{payload}"

def switch_academic_tab(tab: str) -> str:
    """Switch to a specific tab on the Academic Dashboard."""
    valid_tabs = {"courses", "semesters", "exams", "assignments", "planner", "program"}
    tab_lower = tab.lower()
    if tab_lower not in valid_tabs:
        return f"Error: '{tab}' is not a valid tab. Choose from: {', '.join(sorted(valid_tabs))}."
    payload = json.dumps({
        "action": "navigate",
        "route": f"/academic?tab={tab_lower}"
    })
    return f"ACTION:{payload}"

def trigger_notification(variant: str, message: str) -> str:
    """Show a toast notification in the app UI."""
    valid = {"success", "error", "info", "warning"}
    if variant not in valid:
        variant = "info"
    payload = json.dumps({
        "action": "toast",
        "variant": variant,
        "message": message
    })
    return f"ACTION:{payload}"
