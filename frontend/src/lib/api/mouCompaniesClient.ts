const BASE_URL = "http://localhost:8000";

export interface MouCompanyDocument {
    id: number;
    filename: string;
    output_format: string;
    created_at: string | null;
}

export interface MouCompanyRecord {
    id: number;
    company_code: string;
    name: string;
    address: string | null;
    signatory_name: string | null;
    signatory_title: string | null;
    email: string | null;
    pan: string | null;
    trainer_contact: string | null;
    documents: MouCompanyDocument[];
}

export interface MouCompanyCreateInput {
    name: string;
    address?: string;
    signatory_name?: string;
    signatory_title?: string;
    email?: string;
    pan?: string;
    trainer_contact?: string;
}

export interface MouCompanyUpdateInput {
    address?: string;
    signatory_name?: string;
    signatory_title?: string;
    email?: string;
    pan?: string;
    trainer_contact?: string;
}

export async function fetchMouCompanies(): Promise<MouCompanyRecord[]> {
    const response = await fetch(`${BASE_URL}/mou-companies`);
    if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.status}`);
    }
    const data = await response.json();
    return data.companies;
}

export async function createMouCompany(company: MouCompanyCreateInput): Promise<MouCompanyRecord> {
    const response = await fetch(`${BASE_URL}/mou-companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
    });
    if (!response.ok) {
        throw new Error(`Failed to create company: ${response.status}`);
    }
    return response.json();
}

export async function updateMouCompany(id: number, update: MouCompanyUpdateInput): Promise<MouCompanyRecord> {
    const response = await fetch(`${BASE_URL}/mou-companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
    });
    if (!response.ok) {
        throw new Error(`Failed to update company: ${response.status}`);
    }
    return response.json();
}

export async function deleteMouCompany(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/mou-companies/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(`Failed to delete company: ${response.status}`);
    }
}

export function getMouPreviewUrl(companyId: number, documentId: number): string {
    return `${BASE_URL}/mou-companies/${companyId}/documents/${documentId}/preview`;
}