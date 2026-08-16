const BASE_URL = "http://localhost:8000";

export interface PasswordCategory {
    id: number;
    name: string;
    entry_count: number;
}

export interface PasswordEntry {
    id: number;
    category_id: number;
    title: string;
    username: string | null;
    password: string | null;
    url: string | null;
    notes: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface EntryInput {
    title: string;
    username?: string;
    password?: string;
    url?: string;
    notes?: string;
}

async function handleJson<T>(response: Response, failMessage: string): Promise<T> {
    if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail?.error || `${failMessage}: ${response.status}`);
    }
    return response.json();
}

export async function fetchCategories(): Promise<PasswordCategory[]> {
    const response = await fetch(`${BASE_URL}/password-categories`);
    const data = await handleJson<{ categories: PasswordCategory[] }>(response, "Failed to load categories");
    return data.categories;
}

export async function createCategory(name: string): Promise<PasswordCategory> {
    const response = await fetch(`${BASE_URL}/password-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    return handleJson(response, "Failed to create category");
}

export async function renameCategory(id: number, name: string): Promise<PasswordCategory> {
    const response = await fetch(`${BASE_URL}/password-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    return handleJson(response, "Failed to rename category");
}

export async function deleteCategory(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/password-categories/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`Failed to delete category: ${response.status}`);
}

export async function fetchEntries(categoryId: number): Promise<PasswordEntry[]> {
    const response = await fetch(`${BASE_URL}/password-entries?category_id=${categoryId}`);
    const data = await handleJson<{ entries: PasswordEntry[] }>(response, "Failed to load entries");
    return data.entries;
}

export async function createEntry(categoryId: number, input: EntryInput): Promise<PasswordEntry> {
    const response = await fetch(`${BASE_URL}/password-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, ...input }),
    });
    return handleJson(response, "Failed to create entry");
}

export async function updateEntry(id: number, input: Partial<EntryInput>): Promise<PasswordEntry> {
    const response = await fetch(`${BASE_URL}/password-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    return handleJson(response, "Failed to update entry");
}

export async function deleteEntry(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/password-entries/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`Failed to delete entry: ${response.status}`);
}