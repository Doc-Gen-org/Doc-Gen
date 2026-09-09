import { useState, useEffect } from "react";
import { fetchDocumentTypes } from "../../../lib/api/documentTypesClient";
import type { DocumentTypeSchema } from "../../../lib/api/documentTypesClient";

// Doc types that are actually form-based Creator documents.
// "email" exists in the schema but isn't a generatable document type.
const CREATOR_DOC_TYPES = ["po", "mou", "invoice"];

export function useDocumentTypes() {
    const [types, setTypes] = useState<DocumentTypeSchema[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDocumentTypes()
            .then((all) => setTypes(all.filter((t) => CREATOR_DOC_TYPES.includes(t.id))))
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load document types."))
            .finally(() => setLoading(false));
    }, []);

    return { types, loading, error };
}