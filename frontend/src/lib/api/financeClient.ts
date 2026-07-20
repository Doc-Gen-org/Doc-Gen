const BASE_URL = "http://localhost:8000";

export type FinanceEntryType = "received" | "paid";

export interface FinanceRecord {
    id: number;
    entry_type: FinanceEntryType;
    amount: number;
    date: string;
    notes: string | null;
    created_at: string | null;
}

export interface FinanceRecordInput {
    entry_type: FinanceEntryType;
    amount: number;
    date: string;
    notes?: string;
}

export interface PeriodBreakdown {
    date?: string;
    month?: string;
    received: number;
    paid: number;
    profit: number;
}

export interface FinanceSummary {
    total_received: number;
    total_paid: number;
    net_profit: number;
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