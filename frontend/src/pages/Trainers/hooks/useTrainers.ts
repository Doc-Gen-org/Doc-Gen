import { useState, useEffect, useCallback } from "react";
import { fetchTrainers, createTrainer, deleteTrainer } from "../../../lib/api/trainersClient";
import type { Trainer, TrainerCreateInput } from "../../../lib/api/trainersClient";

export function useTrainers() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        fetchTrainers()
            .then(setTrainers)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load trainers."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const addTrainer = async (trainer: TrainerCreateInput) => {
        try {
            await createTrainer(trainer);
            load();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add trainer.");
            return false;
        }
    };

    const removeTrainer = async (trainerId: number) => {
        setDeletingId(trainerId);
        setError(null);
        try {
            await deleteTrainer(trainerId);
            setTrainers((prev) => prev.filter((t) => t.id !== trainerId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete trainer.");
        } finally {
            setDeletingId(null);
        }
    };

    return { trainers, loading, error, addTrainer, removeTrainer, deletingId, reload: load };
}