import { useState, useEffect, useCallback } from "react";
import { fetchHistory, downloadHistoryFile, deleteHistoryRecord } from "../../../lib/api/historyClient";
import type { HistoryRecord } from "../../../lib/api/historyClient";

export function useHistory() {
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        fetchHistory()
            .then(setRecords)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const download = async (record: HistoryRecord) => {
        try {
            await downloadHistoryFile(record);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Download failed.");
        }
    };

    const remove = async (id: number) => {
        try {
            await deleteHistoryRecord(id);
            setRecords((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed.");
        }
    };

    return { records, loading, error, download, remove, reload: load };
}