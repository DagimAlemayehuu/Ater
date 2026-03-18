from google import genai
from unittest.mock import MagicMock
client = genai.Client(api_key='abc')
chat = client.chats.create(model='gemini-2.5-flash')
try:
    chat.send_message(content="hello")
    print("Success")
except Exception as e:
    print(f"Error: {e.__class__.__name__}: {e}")
