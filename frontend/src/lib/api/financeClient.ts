const BASE_URL = "http://localhost:8000";

export interface FinanceRecord {
    id: number;
    company_name: string;
    amount_received: number;
    receiving_date: string;
    trainer_name: string;
    amount_sent: number;
    sending_date: string;
    profit: number;
    notes: string | null;
    created_at: string | null;
}

export interface FinanceRecordInput {
    company_name: string;
    amount_received: number;
    receiving_date: string;
    trainer_name: string;
    amount_sent: number;
    sending_date: string;
    notes?: string;
}

export interface CompanyBreakdown {
    company_name: string;
    received: number;
    sent: number;
    profit: number;
}

export interface PeriodBreakdown {
    date?: string;
    month?: string;
    received: number;
    sent: number;
    profit: number;
}

export interface FinanceSummary {
    total_received: number;
    total_sent: number;
    net_profit: number;
    by_company: CompanyBreakdown[];
    daily: PeriodBreakdown[];
    monthly: PeriodBreakdown[];
}

export async function fetchFinanceRecords(): Promise<FinanceRecord[]> {
    const response = await fetch(`${BASE_URL}/finance/records`);
    if (!response.ok) throw new Error(`Failed to fetch records: ${response.status}`);
    const data = await response.json();
    return data.records;
}

export async function createFinanceRecord(record: FinanceRecordInput): Promise<FinanceRecord> {
    const response = await fetch(`${BASE_URL}/finance/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
    });
    if (!response.ok) throw new Error(`Failed to add record: ${response.status}`);
    return response.json();
}

export async function deleteFinanceRecord(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/finance/records/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`Failed to delete record: ${response.status}`);
}

export async function fetchFinanceSummary(): Promise<FinanceSummary> {
    const response = await fetch(`${BASE_URL}/finance/summary`);
    if (!response.ok) throw new Error(`Failed to fetch summary: ${response.status}`);
    return response.json();
}

export function getExportUrl(): string {
    return `${BASE_URL}/finance/export`;
}