import azure.functions as func
import json, os, logging
import httpx

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="jarvis", methods=["GET", "POST", "OPTIONS"])
def jarvis(req: func.HttpRequest) -> func.HttpResponse:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }
    if req.method == "OPTIONS":
        return func.HttpResponse("", status_code=200, headers=cors)
    try:
        body = req.get_json()
        message = body.get("message", "")
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
        if not gemini_key:
            return func.HttpResponse(
                json.dumps({"error": "GEMINI_API_KEY not set"}),
                status_code=500, mimetype="application/json", headers=cors
            )
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
        payload = {"contents": [{"role": "user", "parts": [{"text": message}]}]}
        r = httpx.post(url, json=payload, timeout=30)
        data = r.json()
        if "candidates" not in data:
            return func.HttpResponse(
                json.dumps({"error": str(data)}),
                status_code=500, mimetype="application/json", headers=cors
            )
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return func.HttpResponse(
            json.dumps({"reply": text}),
            status_code=200, mimetype="application/json", headers=cors
        )
    except Exception as e:
        logging.error(f"JARVIS error: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500, mimetype="application/json", headers=cors
        )
