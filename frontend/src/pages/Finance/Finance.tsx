import { useState } from "react";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useFinance } from "./hooks/useFinance";
import { getExportUrl, deleteFinanceRecord } from "../../lib/api/financeClient";
import type { FinanceEntryType } from "../../lib/api/financeClient";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import "./Finance.css";

function formatMoney(n: number): string {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Finance() {
    const { records, summary, loading, error, addRecord, reload } = useFinance();
    const { showToast } = useToast();
    const confirm = useConfirm();

    const [entryType, setEntryType] = useState<FinanceEntryType>("received");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        if (!amount || !date) {
            showToast("Amount and Date are required.", "error");
            return;
        }
        setSaving(true);
        try {
            await addRecord({
                entry_type: entryType,
                amount: Number(amount),
                date,
                notes: notes.trim() || undefined,
            });
            showToast("Record added");
            setAmount("");
            setNotes("");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to add record.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await confirm("Delete this finance record?", "Delete Record");
        if (!confirmed) return;
        await deleteFinanceRecord(id);
        showToast("Record deleted");
        reload();
    };

    if (loading) return <div className="finance-page"><p>Loading...</p></div>;
    if (error) return <div className="finance-page"><p className="error-text">{error}</p></div>;
    if (!summary) return null;

    return (
        <div className="finance-page">
            <div className="finance-header">
                <div>
                    <h1>Finance</h1>
                    <p className="finance-subtitle">Money received and paid, tracked as individual entries.</p>
                </div>
                <a href={getExportUrl()} className="export-link">
                    <button type="button" className="btn-secondary">⬇ Export CSV</button>
                </a>
            </div>

            <div className="stat-cards">
                <div className="card stat-card">
                    <div className="stat-number stat-success">{formatMoney(summary.total_received)}</div>
                    <div className="stat-label">Total Received</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-number stat-danger">{formatMoney(summary.total_paid)}</div>
                    <div className="stat-label">Total Paid</div>
                </div>
                <div className="card stat-card">
                    <div className={`stat-number ${summary.net_profit >= 0 ? "stat-success" : "stat-danger"}`}>
                        {formatMoney(summary.net_profit)}
                    </div>
                    <div className="stat-label">Net Profit</div>
                </div>
            </div>

            <div className="card finance-panel">
                <h2>Add a Record</h2>
                <div className="finance-form">
                    <select value={entryType} onChange={(e) => setEntryType(e.target.value as FinanceEntryType)}>
                        <option value="received">Received</option>
                        <option value="paid">Paid</option>
                    </select>
                    <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} title="Date" />
                    <input
                        type="text"
                        placeholder="Notes — e.g. company / trainer / what this was for (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="notes-input"
                    />
                    <button type="button" onClick={handleAdd} disabled={saving}>
                        {saving ? "Adding..." : "Add Record"}
                    </button>
                </div>
            </div>

            <div className="card finance-panel full-width">
                <h2>Monthly Received, Paid &amp; Profit</h2>
                {summary.monthly.length === 0 ? (
                    <p className="empty-text">No records yet.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={summary.monthly} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: any) => (v === undefined || v === null ? "" : formatMoney(Number(v)))} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="received" name="Received" fill="#2F855A" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="paid" name="Paid" fill="#C53030" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="Profit" fill="#F2C14E" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="card finance-panel full-width">
                <h2>All Records</h2>
                {records.length === 0 ? (
                    <p className="empty-text">No records yet.</p>
                ) : (
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Notes</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r) => (
                                <tr key={r.id}>
                                    <td className={r.entry_type === "received" ? "profit-positive" : "profit-negative"}>
                                        {r.entry_type === "received" ? "Received" : "Paid"}
                                    </td>
                                    <td>{formatMoney(r.amount)}</td>
                                    <td>{r.date}</td>
                                    <td>{r.notes || "—"}</td>
                                    <td>
                                        <button type="button" className="btn-compact btn-danger" onClick={() => handleDelete(r.id)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Finance;