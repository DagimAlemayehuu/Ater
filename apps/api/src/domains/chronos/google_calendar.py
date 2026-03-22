import json
from typing import List, Dict, Any, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import asyncio
from datetime import datetime, timezone

class GoogleCalendar:
    """
    Manages Google Calendar events.
    Expects google_calendar_token as a JSON string representing Credentials.
    """
    def __init__(self, token_json: Optional[str]):
        self.creds = None
        if token_json:
            try:
                info = json.loads(token_json)
                self.creds = Credentials.from_authorized_user_info(info)
            except Exception as e:
                print(f"Failed to load Google credentials: {e}")

    def is_connected(self) -> bool:
        return self.creds is not None and self.creds.valid

    async def get_all_events(self, time_min: str = None) -> List[Dict[str, Any]]:
        if not self.creds:
            return []
            
        if not time_min:
            time_min = datetime.now(timezone.utc).isoformat()
            
        # googleapiclient is not async, run in thread
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._fetch_events_sync, time_min)

    def _fetch_events_sync(self, time_min: str) -> List[Dict[str, Any]]:
        try:
            service = build('calendar', 'v3', credentials=self.creds)
            
            # List all calendars
            calendar_list = service.calendarList().list().execute()
            all_events = []
            
            for calendar in calendar_list.get('items', []):
                calendar_id = calendar['id']
                calendar_title = calendar.get('summary', 'Untitled Calendar')
                
                events_result = service.events().list(
                    calendarId=calendar_id,
                    timeMin=time_min,
                    maxResults=100,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
                
                events = events_result.get('items', [])
                for event in events:
                    start = event['start'].get('dateTime', event['start'].get('date'))
                    end = event['end'].get('dateTime', event['end'].get('date'))
                    all_events.append({
                        "id": event['id'],
                        "title": event.get('summary', 'Untitled'),
                        "start": start,
                        "end": end,
                        "source": f"Google: {calendar_title}",
                        "source_url": event.get('htmlLink'),
                        "type": "google"
                    })
            return all_events
        except Exception as e:
            print(f"Error fetching Google events: {e}")
            return []

    async def create_event(self, summary: str, start: str, end: str) -> Dict[str, Any]:
        """Creates a new event on the primary calendar."""
        if not self.creds:
            raise Exception("Google Calendar not connected")
            
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._create_event_sync, summary, start, end)

    def _create_event_sync(self, summary: str, start: str, end: str) -> Dict[str, Any]:
        service = build('calendar', 'v3', credentials=self.creds)
        event = {
            'summary': summary,
            'start': {'dateTime': start},
            'end': {'dateTime': end}
        }
        return service.events().insert(calendarId='primary', body=event).execute()
