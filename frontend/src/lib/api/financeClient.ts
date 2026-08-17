const BASE_URL = "http://localhost:8000";

export type FinanceEntryType = "received" | "paid";

export interface FinanceCategory {
    id: number;
    name: string;
    record_count: number;
    received: number;
    paid: number;
    profit: number;
}

export interface FinanceRecord {
    id: number;
    category_id: number | null;
    entry_type: FinanceEntryType;
    amount: number;
    date: string;
    notes: string | null;
    created_at: string | null;
}

export interface FinanceRecordInput {
    category_id: number;
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

export async function fetchFinanceCategories(): Promise<FinanceCategory[]> {
    const response = await fetch(`${BASE_URL}/finance-categories`);
    if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
    const data = await response.json();
    return data.categories;
}

export async function createFinanceCategory(name: string): Promise<FinanceCategory> {
    const response = await fetch(`${BASE_URL}/finance-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`Failed to create category: ${response.status}`);
    return response.json();
}

export async function renameFinanceCategory(id: number, name: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/finance-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`Failed to rename category: ${response.status}`);
}

export async function deleteFinanceCategory(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/finance-categories/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`Failed to delete category: ${response.status}`);
}

export async function fetchFinanceRecords(categoryId?: number): Promise<FinanceRecord[]> {
    const url = categoryId !== undefined
        ? `${BASE_URL}/finance/records?category_id=${categoryId}`
        : `${BASE_URL}/finance/records`;
    const response = await fetch(url);
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