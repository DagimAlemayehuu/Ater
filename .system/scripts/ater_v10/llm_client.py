import openai
import os

class LLMClient:
    def __init__(self, base_url="http://localhost:11434/v1", model="ater-v10"):
        self.client = openai.OpenAI(base_url=base_url, api_key="ollama")
        self.model = model

    def call(self, system_prompt, user_message):
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.2, # Lower temperature for consistency
                stream=False
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM API Error: {e}")
            return None
