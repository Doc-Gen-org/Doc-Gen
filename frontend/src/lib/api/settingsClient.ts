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

/**
 * Downloads a full backup (database + every generated/uploaded/received
 * document) as a zip file, triggering the browser's normal save dialog.
 */
export async function exportBackup(): Promise<void> {
    const response = await fetch(`${BASE_URL}/backup/export`);
    if (!response.ok) {
        throw new Error(`Backup export failed: ${response.status}`);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition") || "";
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `docgen-backup-${Date.now()}.zip`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Restores from a previously exported backup zip — replaces the
 * current database and every document folder. Destructive; the
 * caller is expected to confirm with the user first.
 */
export async function importBackup(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/backup/import`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `Backup import failed: ${response.status}`);
    }
}