const BASE_URL = "http://localhost:8000";

export interface ReceivedDoc {
    id: number;
    doc_type: "invoice";
    original_filename: string;
    uploaded_at: string | null;
}

export interface TrainerStatus {
    po_ready: boolean;
    invoice_received: boolean;
    process_complete: boolean;
}

export async function fetchReceivedDocuments(trainerId: number): Promise<ReceivedDoc[]> {
    const response = await fetch(`${BASE_URL}/trainers/${trainerId}/received`);
    if (!response.ok) {
        throw new Error(`Failed to fetch received documents: ${response.status}`);
    }
    const data = await response.json();
    return data.documents;
}

export async function fetchTrainerStatus(trainerId: number): Promise<TrainerStatus> {
    const response = await fetch(`${BASE_URL}/trainers/${trainerId}/status`);
    if (!response.ok) {
        throw new Error(`Failed to fetch trainer status: ${response.status}`);
    }
    return response.json();
}

export async function uploadReceivedInvoice(trainerId: number, file: File): Promise<ReceivedDoc> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/trainers/${trainerId}/received`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `Upload failed: ${response.status}`);
    }

    return response.json();
}

export async function downloadReceivedDocument(trainerId: number, doc: ReceivedDoc): Promise<void> {
    const response = await fetch(`${BASE_URL}/trainers/${trainerId}/received/${doc.id}/download`);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.original_filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

export async function deleteReceivedDocument(trainerId: number, documentId: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/trainers/${trainerId}/received/${documentId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
    }
}