import { useState } from "react";
import { generateDocument } from "../../../lib/api/generatorClient";

type GenerateStatus = "idle" | "loading" | "success" | "error";

// Every doc type is PDF except Invoice, which is DOCX-only.
function resolveOutputFormat(documentType: string): "pdf" | "docx" {
    return documentType === "invoice" ? "docx" : "pdf";
}

export function useCreatorGenerate() {
    const [status, setStatus] = useState<GenerateStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [documentId, setDocumentId] = useState<string | null>(null);

    const generate = async (documentType: string, fields: Record<string, unknown>) => {
        setStatus("loading");
        setError(null);
        setDocumentId(null);

        try {
            const { blob, filename, documentId: id } = await generateDocument({
                document_type: documentType,
                company_id: "aca-technologies",
                output_format: resolveOutputFormat(documentType),
                fields,
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            setDocumentId(id);
            setStatus("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Generation failed.");
            setStatus("error");
        }
    };

    return { generate, status, error, documentId };
}