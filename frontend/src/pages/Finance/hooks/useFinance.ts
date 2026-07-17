import { useState, useEffect, useCallback } from "react";
import { fetchFinanceRecords, fetchFinanceSummary, createFinanceRecord, deleteFinanceRecord } from "../../../lib/api/financeClient";
import type { FinanceRecord, FinanceSummary, FinanceRecordInput } from "../../../lib/api/financeClient";

export function useFinance() {
    const [records, setRecords] = useState<FinanceRecord[]>([]);
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        Promise.all([fetchFinanceRecords(), fetchFinanceSummary()])
            .then(([r, s]) => {
                setRecords(r);
                setSummary(s);
            })
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load finance data."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const addRecord = async (record: FinanceRecordInput) => {
        await createFinanceRecord(record);
        load();
    };

    const removeRecord = async (id: number) => {
        await deleteFinanceRecord(id);
        load();
    };

    return { records, summary, loading, error, addRecord, removeRecord, reload: load };
}