import google.generativeai as genai

from app.core.config.config import settings

genai.configure(
    api_key=settings.GEMINI_API_KEY
)

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-exp",
)
