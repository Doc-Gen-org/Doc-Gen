import { checkHealth } from "../lib/api/healthClient.ts";
import { useState, useEffect } from "react";

type healthStatus = "checking" | "error" | "ready";

export function useHealthCheck() {
    const [status, setStatus] = useState<healthStatus>("checking");

    useEffect(() => {
        let attempts = 0;
        const MAX_ATTEMPTS = 30;

        const poll = setInterval(async ()=>{
            attempts++;

            const healthy = await checkHealth();

            if (healthy) {
                setStatus("ready");
                clearInterval(poll);
            }

            if (attempts >= MAX_ATTEMPTS) {
                setStatus("error");
                clearInterval(poll);
            }
        }, 1000);
        return () => clearInterval(poll);
    }, []);
    return (status) ;
}

