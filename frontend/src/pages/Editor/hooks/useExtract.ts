import { useState } from "react";
import { extractPdf } from "../../../lib/api/editorClient";
import type { ExtractResponse } from "../../../types/api";

type ExtractStatus = "idle" | "loading" | "success" | "error";

export function useExtract() {
    const [status, setStatus] = useState<ExtractStatus>("idle");
    const [result, setResult] = useState<ExtractResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const extract = async (file: File, documentType: string = "po") => {
        setStatus("loading");
        setResult(null);
        setError(null);

        try {
            const data = await extractPdf(file, documentType);
            setResult(data);
            setStatus("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Extraction failed.");
            setStatus("error");
        }
    };

    return { extract, status, result, error };
}