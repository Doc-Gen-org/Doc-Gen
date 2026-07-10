import { useState } from "react";
import {extractPdf} from "../../../lib/api/editorClient.ts";
import type { ExtractResponse } from "../../../lib/api/editorClient.ts";

type Status = "idle" | "loading" | "success" | "error";

export function useExtract() {
    const [status, setStatus] = useState<Status>("idle");
    const [extractedInformation, setExtractInformation] = useState<ExtractResponse | null>(null);
    const [error, setError] = useState<String | null>(null);

    const extract = async (file: File) => {
        setStatus("loading");
        setExtractInformation(null);
        setError(null);

        try {

            const data = await extractPdf(file);
            setExtractInformation(data);
            setStatus("success");

        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setStatus("error");
        }
    };

    return {extract, status, extractedInformation, error};
}