import { useState, useEffect, useCallback } from "react";
import { fetchTrainerStatus } from "../../../lib/api/receivedDocumentsClient";
import type { TrainerStatus } from "../../../lib/api/receivedDocumentsClient";

export function useTrainerStatus(trainerIds: number[]) {
    const [statusMap, setStatusMap] = useState<Record<number, TrainerStatus>>({});

    const load = useCallback(() => {
        trainerIds.forEach((id) => {
            fetchTrainerStatus(id)
                .then((status) => setStatusMap((prev) => ({ ...prev, [id]: status })))
                .catch(() => {});
        });
    }, [trainerIds]);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trainerIds.join(",")]);

    return { statusMap, reload: load };
}