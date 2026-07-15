const BASE_URL = "http://localhost:8000";

export interface EmailSettings {
    smtp_host: string | null;
    smtp_port: number | null;
    smtp_user: string | null;
    from_name: string | null;
    configured: boolean;
}

export interface EmailSettingsInput {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    from_name: string;
}

export async function fetchEmailSettings(): Promise<EmailSettings> {
    const response = await fetch(`${BASE_URL}/settings/email`);
    if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
    }
    return response.json();
}

export async function saveEmailSettings(settings: EmailSettingsInput): Promise<void> {
    const response = await fetch(`${BASE_URL}/settings/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
    });
    if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
    }
}

export async function sendTestEmail(toEmail: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/settings/email/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_email: toEmail }),
    });
    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `Test email failed: ${response.status}`);
    }
}