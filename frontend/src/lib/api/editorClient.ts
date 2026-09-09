import type { ExtractResponse, ExtractionStatus } from "../../types/api";

const BASE_URL = "http://localhost:8000";

export async function extractPdf(
    file: File,
    documentType: string = "po"
): Promise<ExtractResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);

    const response = await fetch(`${BASE_URL}/extract`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Extraction failed: ${response.status}`);
    }

    return response.json();
}

export async function getExtractionStatus(
    jobId: string
): Promise<ExtractionStatus> {
    const response = await fetch(`${BASE_URL}/extract/status/${jobId}`);

    if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
    }

    return response.json();
}