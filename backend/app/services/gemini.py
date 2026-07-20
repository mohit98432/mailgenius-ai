"""Thin wrapper around the Gemini API using plain HTTPS requests
(avoids pinning to a specific SDK version)."""
import requests

from app.config import settings

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3.5-flash:generateContent"
)

def _call_gemini(prompt: str) -> str:
    resp = requests.post(
        f"{GEMINI_URL}?key={settings.gemini_api_key}",
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=30,
    )
    if not resp.ok:
     print("=" * 80)
     print("Gemini Status:", resp.status_code)
     print("Gemini Response:")
     print(resp.text)
     print("=" * 80)
    resp.raise_for_status()
    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected Gemini response: {data}") from exc


def generate_email(
    purpose: str,
    recipient_name: str = "",
    recipient_company: str = "",
    tone: str = "Professional",
    length: str = "Medium",
    language: str = "English",
    extra_instructions: str = "",
) -> str:
    prompt = f"""Write an email body only (no subject line, no markdown, no preamble).
Recipient name: {recipient_name or 'the recipient'}
Recipient company: {recipient_company or 'N/A'}
Purpose: {purpose}
Tone: {tone}
Length: {length}
Language: {language}
Extra instructions: {extra_instructions or 'none'}"""
    return _call_gemini(prompt)


REWRITE_INSTRUCTIONS = {
    "shorter": "Make this email significantly shorter while keeping the core message.",
    "longer": "Expand this email with more detail and context, keeping it natural.",
    "professional": "Rewrite this email to sound more professional and polished.",
    "friendly": "Rewrite this email to sound warmer and more friendly.",
    "grammar": "Fix all grammar and spelling errors in this email. Keep the meaning identical.",
}


def rewrite_email(body: str, action: str, language: str = "English") -> str:
    if action == "translate":
        instruction = f"Translate this email into {language}. Keep the tone and formatting."
    else:
        instruction = REWRITE_INSTRUCTIONS.get(action)
        if instruction is None:
            raise ValueError(f"Unknown rewrite action: {action}")
    prompt = f"{instruction}\n\nOutput only the revised email body, no preamble, no markdown.\n\nEmail:\n{body}"
    return _call_gemini(prompt)


def generate_subjects(body: str) -> list[str]:
    prompt = (
        "Suggest 5 short, distinct subject lines for this email. "
        "Output only a numbered list, nothing else.\n\nEmail:\n" + body
    )
    raw = _call_gemini(prompt)
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        # strip leading "1. " / "1) " numbering
        for sep in (". ", ") "):
            if sep in line[:4]:
                line = line.split(sep, 1)[1]
                break
        lines.append(line.strip())
    return lines[:5]
