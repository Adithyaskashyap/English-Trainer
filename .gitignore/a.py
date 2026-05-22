import requests
 
API_KEY = "AIzaSyCQ9nuvY-UKxxu9asySCu3sqAiK-oISRac"  # paste your Gemini key here
 
response = requests.get(
    f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
)
 
models = response.json()
 
if "models" in models:
    print("\nAvailable Gemini models:\n")
    for model in models["models"]:
        print(" -", model["name"])
else:
    print("Error:", models)