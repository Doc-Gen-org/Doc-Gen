const BASE_URL = "http://localhost:8000";

export interface WarningLogEntry {
    id: number;
    recipient_name: string;
    recipient_email: string;
    message: string;
    sent_at: string | null;
}

export interface WarningRecipient {
    recipient_name: string;
    recipient_email: string;
}

export interface WarningSendResult {
    recipient_name: string;
    recipient_email: string;
    status: "sent" | "failed";
    id?: number;
    error?: string;
}

export interface WarningSendResponse {
    sent_count: number;
    failed_count: number;
    results: WarningSendResult[];
}

export async function fetchDefaultWarningMessage(): Promise<string> {
    const response = await fetch(`${BASE_URL}/warnings/default-message`);
    if (!response.ok) {
        throw new Error(`Failed to fetch default message: ${response.status}`);
    }
    const data = await response.json();
    return data.message;
}

export async function fetchWarningLog(): Promise<WarningLogEntry[]> {
    const response = await fetch(`${BASE_URL}/warnings`);
    if (!response.ok) {
        throw new Error(`Failed to fetch warning log: ${response.status}`);
    }
    const data = await response.json();
    return data.warnings;
}

export async function sendWarningEmails(
    recipients: WarningRecipient[],
    message: string
): Promise<WarningSendResponse> {
    const response = await fetch(`${BASE_URL}/warnings/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, message }),
    });

    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `Send failed: ${response.status}`);
    }

    return response.json();
}