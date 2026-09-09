const BASE_URL = "http://localhost:8000";

export interface HistoryRecord {
    id: number;
    document_type: string;
    company_id: string;
    output_format: string;
    filename: string;
    source_document_id: string | null;
    created_at: string | null;
}

export async function fetchHistory(): Promise<HistoryRecord[]> {
    const response = await fetch(`${BASE_URL}/history`);
    if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`);
    }
    const data = await response.json();
    return data.records;
}

export async function downloadHistoryFile(record: HistoryRecord): Promise<void> {
    const response = await fetch(`${BASE_URL}/history/${record.id}/download`);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = record.filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

export async function deleteHistoryRecord(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/history/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
    }
}