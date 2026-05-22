from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

API_KEY = os.environ.get("GEMINI_KEY")

@app.route("/api/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data     = request.get_json()
    messages = data.get("messages", [])
    system   = data.get("system", "")

    contents = []
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": msg["content"]}]
        })

    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={API_KEY}",
        json={
            "system_instruction": {"parts": [{"text": system}]},
            "contents": contents
        }
    )

    result = response.json()

    try:
        reply_text = result["candidates"][0]["content"]["parts"][0]["text"]
    except:
        reply_text = "Error: " + str(result)

    return jsonify({"content": [{"text": reply_text}]})
