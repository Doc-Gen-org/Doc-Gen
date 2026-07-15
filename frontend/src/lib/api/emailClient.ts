const BASE_URL = "http://localhost:8000";

export interface SendEmailRequest {
    document_id: number;
    trainer_id?: number;
    trainer_email?: string;
    subject?: string;
    message?: string;
}

export interface SendEmailResult {
    status: string;
    to: string;
    document_id: number;
}

export async function sendEmail(body: SendEmailRequest): Promise<SendEmailResult> {
    const response = await fetch(`${BASE_URL}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `Send failed: ${response.status}`);
    }

    return response.json();
}