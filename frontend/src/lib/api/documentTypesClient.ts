const BASE_URL = "http://localhost:8000";

export interface DocumentTypeField {
    name: string;
    label: string;
    type: "text" | "textarea" | "number" | "date" | "multidate";
    required: boolean;
    placeholder?: string;
    defaultToday?: boolean;
}

export interface DocumentTypeSchema {
    id: string;
    label: string;
    fields: DocumentTypeField[];
}

export async function fetchDocumentTypes(): Promise<DocumentTypeSchema[]> {
    const response = await fetch(`${BASE_URL}/document-types`);
    if (!response.ok) {
        throw new Error(`Failed to fetch document types: ${response.status}`);
    }
    const data = await response.json();
    return data.document_types;
}