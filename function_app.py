import azure.functions as func
import logging,json,re
import httpx
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

app=func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)
KV="https://jarvis-kv-2026.vault.azure.net/"
_c=DefaultAzureCredential(); _kv=None
def kv():
    global _kv
    if _kv is None: _kv=SecretClient(vault_url=KV,credential=_c)
    return _kv

PH=re.compile(r"\b\d{3}[-.]?\s?\d{3}[-.]?\s?\d{4}\b")
EM=re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")
def scrub(t):
    t=PH.sub("[REDACTED_PHONE]",t)
    t=EM.sub("[REDACTED_EMAIL]",t)
    return t

@app.route(route="jarvis",methods=["POST"])
async def jarvis(req:func.HttpRequest)->func.HttpResponse:
    try:
        b=req.get_json()
        target=b.get("target","gemini")
        prompt=scrub(b.get("prompt",""))
        sys_msg=b.get("system","You are JARVIS, an elite AI assistant.")
        if target=="hofstra":
            key=kv().get_secret("HofstraKey").value
            ep="https://jarvis-openai-av2026.openai.azure.com/"
            dep=b.get("deployment","gpt-4o")
            url=f"{ep}openai/deployments/{dep}/chat/completions?api-version=2024-12-01-preview"
            hdrs={"api-key":key,"Content-Type":"application/json"}
            pl={"messages":[{"role":"system","content":sys_msg},{"role":"user","content":prompt}],"max_tokens":b.get("max_tokens",800),"temperature":b.get("temperature",0.7)}
            async with httpx.AsyncClient(timeout=28.0) as c:
                r=await c.post(url,headers=hdrs,json=pl)
        else:
            key=kv().get_secret("GeminiKey").value
            model=b.get("model","gemini-2.0-flash")
            url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            pl={"system_instruction":{"parts":[{"text":sys_msg}]},"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":b.get("max_tokens",800)}}
            async with httpx.AsyncClient(timeout=28.0) as c:
                r=await c.post(url,json=pl)
        return func.HttpResponse(r.text,status_code=r.status_code,mimetype="application/json")
    except Exception as e:
        logging.error(str(e))
        return func.HttpResponse(json.dumps({"error":str(e)}),status_code=500,mimetype="application/json")
