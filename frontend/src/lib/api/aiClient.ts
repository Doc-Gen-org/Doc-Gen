const BASE_URL = "http://localhost:8000";

export async function refineContributionText(rawText: string): Promise<string> {
    const response = await fetch(`${BASE_URL}/ai/refine-contribution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: rawText }),
    });

    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `Refine failed: ${response.status}`);
    }

    const data = await response.json();
    return data.refined_text;
}