const BASE_URL = "http://localhost:8000";

export interface InternDocument {
    id: number;
    filename: string;
}

export interface Intern {
    id: number;
    intern_code: string;
    name: string;
    email: string;
    institution: string | null;
    phone: string | null;
    offer_sent_at: string | null;
    certificate_sent_at: string | null;
    offer_letter_document: InternDocument | null;
    certificate_document: InternDocument | null;
}

export interface InternCreateInput {
    name: string;
    email: string;
    institution?: string;
    phone?: string;
}

export interface InternUpdateInput {
    email?: string;
    institution?: string;
    phone?: string;
}

export interface GenerateOfferLetterInput {
    role: string;
    department: string;
    start_date: string;
    duration: string;
    work_mode: string;
    acceptance_deadline: string;
    internship_type?: string;
    letter_date?: string;
}

export interface GenerateCertificateInput {
    student_id: string;
    degree_year: string;
    institution_name: string;
    institution_location: string;
    start_date: string;
    duration: string;
    contribution_summary: string;
    certificate_date?: string;
}

async function handleJson<T>(response: Response, failMessage: string): Promise<T> {
    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `${failMessage}: ${response.status}`);
    }
    return response.json();
}

export async function fetchInterns(): Promise<Intern[]> {
    const response = await fetch(`${BASE_URL}/interns`);
    if (!response.ok) throw new Error(`Failed to fetch interns: ${response.status}`);
    const data = await response.json();
    return data.interns;
}

export async function createIntern(intern: InternCreateInput): Promise<Intern> {
    const response = await fetch(`${BASE_URL}/interns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intern),
    });
    return handleJson(response, "Failed to create intern");
}

export async function updateIntern(id: number, update: InternUpdateInput): Promise<Intern> {
    const response = await fetch(`${BASE_URL}/interns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
    });
    return handleJson(response, "Failed to update intern");
}

export async function deleteIntern(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/interns/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`Failed to delete intern: ${response.status}`);
}

export async function generateOfferLetter(internId: number, input: GenerateOfferLetterInput): Promise<InternDocument> {
    const response = await fetch(`${BASE_URL}/interns/${internId}/generate-offer-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    return handleJson(response, "Generation failed");
}

export async function generateCertificate(internId: number, input: GenerateCertificateInput): Promise<InternDocument> {
    const response = await fetch(`${BASE_URL}/interns/${internId}/generate-certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    return handleJson(response, "Generation failed");
}

export async function sendOfferLetter(internId: number): Promise<{ status: string; to: string }> {
    const response = await fetch(`${BASE_URL}/interns/${internId}/send-offer-letter`, { method: "POST" });
    return handleJson(response, "Send failed");
}

export async function sendCertificate(internId: number): Promise<{ status: string; to: string }> {
    const response = await fetch(`${BASE_URL}/interns/${internId}/send-certificate`, { method: "POST" });
    return handleJson(response, "Send failed");
}

export function getPreviewUrl(internId: number, documentId: number): string {
    return `${BASE_URL}/interns/${internId}/documents/${documentId}/preview`;
}