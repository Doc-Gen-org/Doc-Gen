const BASE_URL = "http://localhost:8000";

export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${BASE_URL}/health`);
        return response.ok;
    } catch {
        return false; // backend not up yet, swallow the error
    }
}