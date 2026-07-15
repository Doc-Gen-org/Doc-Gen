import { useState, useEffect, useCallback } from "react";
import { fetchMouCompanies, deleteMouCompany } from "../../../lib/api/mouCompaniesClient";
import type { MouCompanyRecord } from "../../../lib/api/mouCompaniesClient";

export function useMouCompanies() {
    const [companies, setCompanies] = useState<MouCompanyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        fetchMouCompanies()
            .then(setCompanies)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load companies."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const removeCompany = async (id: number) => {
        setDeletingId(id);
        setError(null);
        try {
            await deleteMouCompany(id);
            setCompanies((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete company.");
        } finally {
            setDeletingId(null);
        }
    };

    return { companies, loading, error, removeCompany, deletingId, reload: load };
}