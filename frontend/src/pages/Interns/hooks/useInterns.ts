import { useState, useEffect, useCallback } from "react";
import { fetchInterns, deleteIntern } from "../../../lib/api/internsClient";
import type { Intern } from "../../../lib/api/internsClient";

export function useInterns() {
    const [interns, setInterns] = useState<Intern[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        fetchInterns()
            .then(setInterns)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load interns."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const removeIntern = async (id: number) => {
        setDeletingId(id);
        try {
            await deleteIntern(id);
            await load();
        } finally {
            setDeletingId(null);
        }
    };

    return { interns, loading, error, removeIntern, deletingId, reload: load };
}