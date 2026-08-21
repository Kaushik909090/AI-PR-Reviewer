from openai import OpenAI
from dotenv import load_dotenv
import os


load_dotenv()


client = OpenAI(
    api_key=os.getenv(
        "OPENROUTER_API_KEY"
    ),
    base_url="https://openrouter.ai/api/v1",
)


response = client.chat.completions.create(
    model="openrouter/free",
    messages=[
        {
            "role": "user",
            "content": (
                "Explain this Python bug: "
                "return a / b when b is zero."
            ),
        }
    ],
)


print("\n==============================")
print("OPENROUTER RESPONSE")
print("==============================")
print(
    response.choices[0].message.content
)