const BASE_URL = "http://localhost:8000";

export interface TrainerDocument {
    id: number;
    po_number: string;
    filename: string;
    output_format: string;
    created_at: string | null;
}

export interface Trainer {
    id: number;
    trainer_code: string;
    name: string;
    email: string;
    phone: string | null;
    pan: string | null;
    aadhaar: string | null;
    payment_status: string;
    paid_date: string | null;
    documents: TrainerDocument[];
}

export interface TrainerCreateInput {
    name: string;
    email: string;
    phone?: string;
    pan?: string;
    aadhaar?: string;
}

export interface TrainerUpdateInput {
    email?: string;
    pan?: string;
    aadhaar?: string;
    payment_status?: string;
    paid_date?: string;
}

export interface PickerDocument {
    id: number;
    filename: string;
    output_format: string;
    created_at: string | null;
}

export async function fetchTrainers(): Promise<Trainer[]> {
    const response = await fetch(`${BASE_URL}/trainers`);
    if (!response.ok) {
        throw new Error(`Failed to fetch trainers: ${response.status}`);
    }
    const data = await response.json();
    return data.trainers;
}

export async function createTrainer(trainer: TrainerCreateInput): Promise<Trainer> {
    const response = await fetch(`${BASE_URL}/trainers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trainer),
    });
    if (!response.ok) {
        throw new Error(`Failed to create trainer: ${response.status}`);
    }
    return response.json();
}

export async function updateTrainer(id: number, update: TrainerUpdateInput): Promise<Trainer> {
    const response = await fetch(`${BASE_URL}/trainers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
    });
    if (!response.ok) {
        throw new Error(`Failed to update trainer: ${response.status}`);
    }
    return response.json();
}

export async function deleteTrainer(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/trainers/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(`Failed to delete trainer: ${response.status}`);
    }
}

export async function fetchTrainerDocuments(
    trainerId: number,
    docType: "po" | "invoice"
): Promise<PickerDocument[]> {
    const response = await fetch(`${BASE_URL}/trainers/${trainerId}/documents/${docType}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
    }
    const data = await response.json();
    return data.documents;
}

export function getPreviewUrl(trainerId: number, docType: "po" | "invoice", documentId: number): string {
    return `${BASE_URL}/trainers/${trainerId}/documents/${docType}/${documentId}/preview`;
}

export async function generateInvoiceFromPO(
    trainerId: number,
    attendedDates: string[]
): Promise<PickerDocument> {
    const response = await fetch(`${BASE_URL}/trainers/${trainerId}/generate-invoice-from-po`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended_dates: attendedDates }),
    });
    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `Generation failed: ${response.status}`);
    }
    return response.json();
}

export async function sendDocumentById(
    trainerId: number,
    documentId: number
): Promise<{ status: string; to: string }> {
    const response = await fetch(
        `${BASE_URL}/trainers/${trainerId}/send-document-by-id?document_id=${documentId}`,
        { method: "POST" }
    );
    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `Send failed: ${response.status}`);
    }
    return response.json();
}

export async function sendDocumentToTrainer(
    trainerId: number,
    docType: "po" | "invoice",
    file: File
): Promise<{ status: string; to: string }> {
    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/trainers/${trainerId}/send-document`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `Send failed: ${response.status}`);
    }

    return response.json();
}