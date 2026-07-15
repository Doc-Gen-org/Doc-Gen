import { useState } from "react";
import { sendEmail } from "../../../lib/api/emailClient";
import type { SendEmailRequest } from "../../../lib/api/emailClient";

type SendEmailStatus = "idle" | "loading" | "success" | "error";

export function useSendEmail() {
    const [status, setStatus] = useState<SendEmailStatus>("idle");
    const [error, setError] = useState<string | null>(null);

    const send = async (body: SendEmailRequest) => {
        setStatus("loading");
        setError(null);
        try {
            await sendEmail(body);
            setStatus("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send email.");
            setStatus("error");
        }
    };

    return { send, status, error };
}