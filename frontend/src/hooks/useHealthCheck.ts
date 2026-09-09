import { checkHealth } from "../lib/api/healthClient.ts";
import { useState, useEffect } from "react";

type healthStatus = "checking" | "error" | "ready";

export function useHealthCheck() {
    const [status, setStatus] = useState<healthStatus>("checking");

    useEffect(() => {
        let attempts = 0;
        let timeoutId: ReturnType<typeof setTimeout>;
        let cancelled = false;
        const MAX_ATTEMPTS = 30;

        const poll = async () => {
            attempts++;

            const healthy = await checkHealth();
            if (cancelled) return;

            if (healthy) {
                setStatus("ready");
                return;
            }

            if (attempts >= MAX_ATTEMPTS) {
                setStatus("error");
                return;
            }

            timeoutId = setTimeout(poll, 1000);
        };

        void poll();

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, []);
    return (status) ;
}

