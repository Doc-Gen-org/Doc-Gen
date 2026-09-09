import type { GenerateRequest } from "../../types/api";

const BASE_URL = "http://localhost:8000";

export interface GenerateResult {
    blob: Blob;
    filename: string;
    documentId: string;
}

export async function generateDocument(
    body: GenerateRequest
): Promise<GenerateResult> {
    const response = await fetch(`${BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename =
        disposition.split("filename=")[1]?.replace(/"/g, "") || "document.pdf";
    const documentId = response.headers.get("X-Document-Id") ?? "";

    return { blob, filename, documentId };
}