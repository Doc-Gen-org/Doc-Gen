import { useState, useEffect, useCallback } from "react";
import { fetchDefaultWarningMessage, fetchWarningLog, sendWarningEmails } from "../../../lib/api/warningsClient";
import type { WarningLogEntry, WarningRecipient, WarningSendResponse } from "../../../lib/api/warningsClient";

type SendStatus = "idle" | "loading" | "success" | "error";

export function useWarnings() {
    const [defaultMessage, setDefaultMessage] = useState("");
    const [log, setLog] = useState<WarningLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
    const [sendError, setSendError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<WarningSendResponse | null>(null);

    const loadLog = useCallback(() => {
        fetchWarningLog()
            .then(setLog)
            .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load warning log."));
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchDefaultWarningMessage(), fetchWarningLog()])
            .then(([msg, logs]) => {
                setDefaultMessage(msg);
                setLog(logs);
            })
            .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load data."))
            .finally(() => setLoading(false));
    }, []);

    const send = async (recipients: WarningRecipient[], message: string) => {
        setSendStatus("loading");
        setSendError(null);
        setLastResult(null);
        try {
            const result = await sendWarningEmails(recipients, message);
            setLastResult(result);
            setSendStatus(result.failed_count > 0 ? "error" : "success");
            if (result.failed_count > 0) {
                setSendError(`${result.failed_count} of ${recipients.length} email(s) failed to send.`);
            }
            loadLog();
        } catch (err) {
            setSendError(err instanceof Error ? err.message : "Failed to send warnings.");
            setSendStatus("error");
        }
    };

    return { defaultMessage, log, loading, loadError, send, sendStatus, sendError, lastResult };
}