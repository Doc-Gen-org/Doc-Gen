import httpx
import json


def extract_fields_from_text(raw_text: str) -> dict:
    """
    Sends raw PO text to tinyllama-po (Ollama) and returns extracted fields.
    Returns: {
        "issuing_company": ...,
        "vendor_name": ...,
        "trainer_name": ...,
        "technology": ...
    }
    """
    try:
        with httpx.Client() as client:
            response = client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "tinyllama-po",
                    "prompt": raw_text,
                    "stream": False,
                },
                timeout=60.0,
            )
            result = response.json()
            raw_output = result["response"].strip()

            json_start = raw_output.find("{")
            json_end = raw_output.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                json_str = raw_output[json_start:json_end]
                return json.loads(json_str)
            else:
                return {}

    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return {}
    except Exception as e:
        print(f"LLM extraction error: {e}")
        return {}