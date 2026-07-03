const BASE_URL = "http://localhost:8000";

export interface ExtractResponse {
    text: string;
}

export async function extractPdf(file: File): Promise<ExtractResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/extract`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
    }

    return response.json();
}