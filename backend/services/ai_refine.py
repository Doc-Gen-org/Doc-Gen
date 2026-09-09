import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2:3b"
KEEP_ALIVE = "2m"

REFINE_PROMPT_TEMPLATE = """You are completing this exact sentence for an internship certificate:

"During the internship, [Name] contributed significantly by ___."

Your job is to write ONLY the blank (___) part, based on the rough notes below. The blank must:
- Start with a verb ending in "-ing" (a gerund), or a noun phrase — for example: "developing", "building", "designing and implementing"
- NEVER start with "I", "he", "she", "they", or any pronoun
- NEVER be a complete sentence on its own — it must grammatically continue the sentence above
- Be 1-2 clauses long, professional, with correct grammar, spelling, and punctuation
- Wrap the single most important technology or achievement in TWO asterisks on each side, exactly like this: **AI-powered application** — NOT one asterisk, always two on each side
- Have NO period at the end
- Contain ONLY the blank text — no quotes, no preamble, no explanation

Examples of correct output:
Rough notes: "he make ai thing for masking pii from resume also do whatsapp classify"
Correct output: developing an **AI application to mask Personally Identifiable Information (PII)** from resumes, and classifying vendors and trainers through AI/ML based on WhatsApp chats

Rough notes: "i assisted in designing and implementing an innovative ai-generated document creator utilizing templates, which enabled efficient content creation and streamlined workflows, ultimately enhancing productivity"
Correct output: designing and implementing an innovative **AI-generated document creation system** using templates, streamlining workflows and enhancing productivity

Now write the blank for these rough notes:
"{raw_text}"

Output only the blank text, nothing else:"""


def _clean_output(text: str) -> str:
    text = text.strip().strip('"').strip("'").strip()

    # Defensive: strip a leading pronoun + verb the model may have added
    # despite instructions (e.g. "I assisted in designing..." -> "designing...")
    text = re.sub(r"^(I|He|She|They)\s+(assisted in|helped with|worked on)\s+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^(I|He|She|They)\s+", "", text, flags=re.IGNORECASE)

    # Defensive: normalize single-asterisk emphasis (*text*) into proper
    # double-asterisk bold (**text**) — mdbold only recognizes double
    # asterisks, so a single-asterisk pair would otherwise render as
    # plain text with literal asterisks still visible.
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"**\1**", text)

    # Defensive: strip any trailing period(s) the model added — the
    # certificate template supplies its own final period.
    text = text.rstrip(".").strip()

    return text


def refine_contribution_text(raw_text: str) -> str:
    if not raw_text or not raw_text.strip():
        raise ValueError("No text provided to refine.")

    prompt = REFINE_PROMPT_TEMPLATE.format(raw_text=raw_text.strip())

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "keep_alive": KEEP_ALIVE,
            },
            timeout=30,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Could not reach Ollama — is it running? ({str(e)})")

    data = response.json()
    raw_refined = data.get("response", "")
    refined = _clean_output(raw_refined)

    if not refined:
        raise RuntimeError("The model returned an empty response.")

    return refined