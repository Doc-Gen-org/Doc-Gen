import { useState, useEffect } from "react";
import { fetchHistory } from "../../../lib/api/historyClient";
import { fetchTrainers } from "../../../lib/api/trainersClient";
import type { HistoryRecord } from "../../../lib/api/historyClient";
import type { Trainer } from "../../../lib/api/trainersClient";

export interface TrendPoint {
    date: string;
    label: string;
    count: number;
}

export interface DashboardData {
    totalTrainers: number;
    totalDocuments: number;
    documentsByType: Record<string, number>;
    paymentStatusCounts: Record<string, number>;
    recentDocuments: HistoryRecord[];
    trend: TrendPoint[];
    pendingTrainers: Trainer[];
}

function buildTrend(history: HistoryRecord[], days: number): TrendPoint[] {
    const points: TrendPoint[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        points.push({ date: dateKey, label, count: 0 });
    }

    const pointMap = new Map(points.map((p) => [p.date, p]));

    for (const record of history) {
        if (!record.created_at) continue;
        const dateKey = record.created_at.slice(0, 10);
        const point = pointMap.get(dateKey);
        if (point) point.count += 1;
    }

    return points;
}

function buildDashboard(history: HistoryRecord[], trainers: Trainer[]): DashboardData {
    const documentsByType: Record<string, number> = {};
    for (const record of history) {
        documentsByType[record.document_type] = (documentsByType[record.document_type] || 0) + 1;
    }

    const paymentStatusCounts: Record<string, number> = {};
    for (const trainer of trainers) {
        paymentStatusCounts[trainer.payment_status] = (paymentStatusCounts[trainer.payment_status] || 0) + 1;
    }

    const recentDocuments = [...history]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 5);

    const pendingTrainers = trainers.filter((t) => t.payment_status === "Pending");

    return {
        totalTrainers: trainers.length,
        totalDocuments: history.length,
        documentsByType,
        paymentStatusCounts,
        recentDocuments,
        trend: buildTrend(history, 14),
        pendingTrainers,
    };
}

export function useDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([fetchHistory(), fetchTrainers()])
            .then(([history, trainers]) => setData(buildDashboard(history, trainers)))
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard."))
            .finally(() => setLoading(false));
    }, []);

    return { data, loading, error };
}