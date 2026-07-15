import { useState } from "react";
import { generateDocument } from "../../../lib/api/generatorClient";
import type { GenerateRequest } from "../../../types/api";

type GenerateStatus = "idle" | "loading" | "success" | "error";

export function useGenerate() {
    const [status, setStatus] = useState<GenerateStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [documentId, setDocumentId] = useState<string | null>(null);

    const generate = async (body: GenerateRequest) => {
        setStatus("loading");
        setError(null);
        setDocumentId(null);

        try {
            const { blob, filename, documentId: id } = await generateDocument(body);

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