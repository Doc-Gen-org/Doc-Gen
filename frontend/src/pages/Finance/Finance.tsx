import { useState } from "react";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useFinance } from "./hooks/useFinance";
import { useTrainers } from "../Trainers/hooks/useTrainers";
import { getExportUrl, deleteFinanceRecord } from "../../lib/api/financeClient";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import "./Finance.css";

function formatMoney(n: number): string {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Finance() {
    const { records, summary, loading, error, addRecord, reload } = useFinance();
    const { trainers } = useTrainers();
    const { showToast } = useToast();
    const confirm = useConfirm();

    const [companyName, setCompanyName] = useState("");
    const [amountReceived, setAmountReceived] = useState("");
    const [receivingDate, setReceivingDate] = useState(new Date().toISOString().slice(0, 10));
    const [trainerName, setTrainerName] = useState("");
    const [amountSent, setAmountSent] = useState("");
    const [sendingDate, setSendingDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        if (!companyName.trim() || !amountReceived || !receivingDate || !trainerName.trim() || !amountSent || !sendingDate) {
            showToast("All fields except Notes are required.", "error");
            return;
        }
        setSaving(true);
        try {
            await addRecord({
                company_name: companyName.trim(),
                amount_received: Number(amountReceived),
                receiving_date: receivingDate,
                trainer_name: trainerName.trim(),
                amount_sent: Number(amountSent),
                sending_date: sendingDate,
                notes: notes.trim() || undefined,
            });
            showToast("Record added");
            setCompanyName("");
            setAmountReceived("");
            setTrainerName("");
            setAmountSent("");
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
                    <p className="finance-subtitle">Revenue, expenses, and profit per company-trainer engagement.</p>
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
                    <div className="stat-number stat-danger">{formatMoney(summary.total_sent)}</div>
                    <div className="stat-label">Total Sent</div>
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
                    <input type="text" placeholder="Company (e.g. iamneo)" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    <input type="number" placeholder="Amount Received" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                    <input type="date" value={receivingDate} onChange={(e) => setReceivingDate(e.target.value)} title="Receiving Date" />

                    <input
                        type="text"
                        list="trainer-suggestions"
                        placeholder="Trainer name"
                        value={trainerName}
                        onChange={(e) => setTrainerName(e.target.value)}
                    />
                    <datalist id="trainer-suggestions">
                        {trainers.map((t) => (
                            <option key={t.id} value={t.name} />
                        ))}
                    </datalist>
                    <input type="number" placeholder="Amount Sent" value={amountSent} onChange={(e) => setAmountSent(e.target.value)} />
                    <input type="date" value={sendingDate} onChange={(e) => setSendingDate(e.target.value)} title="Sending Date" />

                    <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="notes-input"
                    />
                    <button type="button" onClick={handleAdd} disabled={saving}>
                        {saving ? "Adding..." : "Add Record"}
                    </button>
                </div>
            </div>

            <div className="finance-columns">
                <div className="card finance-panel">
                    <h2>Revenue by Company</h2>
                    {summary.by_company.length === 0 ? (
                        <p className="empty-text">No records yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={summary.by_company} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                <XAxis dataKey="company_name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v: any) => (v === undefined || v === null ? "" : formatMoney(Number(v)))} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="received" name="Received" fill="#2F855A" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="sent" name="Sent" fill="#C53030" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="card finance-panel">
                    <h2>Monthly Revenue &amp; Profit</h2>
                    {summary.monthly.length === 0 ? (
                        <p className="empty-text">No records yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={summary.monthly} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v: any) => (v === undefined || v === null ? "" : formatMoney(Number(v)))} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="profit" name="Profit" fill="#F2C14E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="card finance-panel full-width">
                <h2>All Records</h2>
                {records.length === 0 ? (
                    <p className="empty-text">No records yet.</p>
                ) : (
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Amount Received</th>
                                <th>Receiving Date</th>
                                <th>Trainer</th>
                                <th>Amount Sent</th>
                                <th>Sending Date</th>
                                <th>Profit</th>
                                <th>Notes</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r) => (
                                <tr key={r.id}>
                                    <td>{r.company_name}</td>
                                    <td>{formatMoney(r.amount_received)}</td>
                                    <td>{r.receiving_date}</td>
                                    <td>{r.trainer_name}</td>
                                    <td>{formatMoney(r.amount_sent)}</td>
                                    <td>{r.sending_date}</td>
                                    <td className={r.profit >= 0 ? "profit-positive" : "profit-negative"}>
                                        {formatMoney(r.profit)}
                                    </td>
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