import { useState, useEffect, useCallback } from "react";
import {
    fetchFinanceCategories, fetchFinanceRecords, fetchFinanceSummary, createFinanceRecord, deleteFinanceRecord,
} from "../../../lib/api/financeClient";
import type { FinanceCategory, FinanceRecord, FinanceSummary, FinanceRecordInput } from "../../../lib/api/financeClient";

export function useFinance() {
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [records, setRecords] = useState<FinanceRecord[]>([]);
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSummary = useCallback(() => {
        return fetchFinanceSummary().then(setSummary);
    }, []);

    const loadCategories = useCallback(() => {
        return fetchFinanceCategories().then((cats) => {
            setCategories(cats);
            setSelectedCategoryId((current) => {
                if (current !== null && cats.some((c) => c.id === current)) return current;
                return cats.length > 0 ? cats[0].id : null;
            });
        });
    }, []);

    const loadRecords = useCallback((categoryId: number) => {
        setLoadingRecords(true);
        return fetchFinanceRecords(categoryId)
            .then(setRecords)
            .finally(() => setLoadingRecords(false));
    }, []);

    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([loadCategories(), loadSummary()])
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load finance data."))
            .finally(() => setLoading(false));
    }, [loadCategories, loadSummary]);

    useEffect(() => {
        if (selectedCategoryId !== null) {
            loadRecords(selectedCategoryId);
        } else {
            setRecords([]);
        }
    }, [selectedCategoryId, loadRecords]);

    const addRecord = async (record: FinanceRecordInput) => {
        await createFinanceRecord(record);
        await loadSummary();
        await loadCategories();
        if (selectedCategoryId !== null) await loadRecords(selectedCategoryId);
    };

    const removeRecord = async (id: number) => {
        await deleteFinanceRecord(id);
        await loadSummary();
        await loadCategories();
        if (selectedCategoryId !== null) await loadRecords(selectedCategoryId);
    };

    return {
        categories,
        selectedCategoryId,
        setSelectedCategoryId,
        records,
        summary,
        loading,
        loadingRecords,
        error,
        addRecord,
        removeRecord,
        reloadCategories: loadCategories,
    };
}