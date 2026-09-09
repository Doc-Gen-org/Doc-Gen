import { useState, useRef, useEffect } from "react";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useFinance } from "./hooks/useFinance";
import { getExportUrl } from "../../lib/api/financeClient";
import { createFinanceCategory, renameFinanceCategory, deleteFinanceCategory } from "../../lib/api/financeClient";
import type { FinanceEntryType, FinanceCategory, FinanceRecord } from "../../lib/api/financeClient";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import "./Finance.css";

function formatMoney(n: number): string {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Finance() {
    const {
        categories, selectedCategoryId, setSelectedCategoryId,
        records, summary, loading, loadingRecords, error,
        addRecord, removeRecord, updateRecord, reloadCategories,
    } = useFinance();
    const { showToast } = useToast();
    const confirm = useConfirm();

    const [entryType, setEntryType] = useState<FinanceEntryType>("received");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const [newCategoryName, setNewCategoryName] = useState("");
    const [addingCategory, setAddingCategory] = useState(false);
    const [renamingCategoryId, setRenamingCategoryId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const renameInputRef = useRef<HTMLInputElement>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ entry_type: FinanceEntryType; amount: string; date: string; notes: string }>({ entry_type: "received", amount: "", date: "", notes: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => { setCurrentPage(1); setEditingId(null); }, [selectedCategoryId]);

    const handleEdit = (r: FinanceRecord) => {
        setEditingId(r.id);
        setEditForm({ entry_type: r.entry_type, amount: String(r.amount), date: r.date, notes: r.notes ?? "" });
    };

    const handleSaveEdit = async (id: number) => {
        try {
            await updateRecord(id, { entry_type: editForm.entry_type, amount: Number(editForm.amount), date: editForm.date, notes: editForm.notes.trim() || null });
            setEditingId(null);
            showToast("Record updated");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update.", "error");
        }
    };

    const handleAdd = async () => {
        if (selectedCategoryId === null) {
            showToast("Pick or create a category first.", "error");
            return;
        }
        if (!amount || !date) {
            showToast("Amount and Date are required.", "error");
            return;
        }
        setSaving(true);
        try {
            await addRecord({
                category_id: selectedCategoryId,
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
        await removeRecord(id);
        showToast("Record deleted");
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const created = await createFinanceCategory(newCategoryName.trim());
            setNewCategoryName("");
            setAddingCategory(false);
            await reloadCategories();
            setSelectedCategoryId(created.id);
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create category.", "error");
        }
    };

    const handleRenameCategory = async (id: number) => {
        if (!renameValue.trim()) return;
        try {
            await renameFinanceCategory(id, renameValue.trim());
            setRenamingCategoryId(null);
            await reloadCategories();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to rename category.", "error");
        }
    };

    const handleDeleteCategory = async (category: FinanceCategory) => {
        const warning = category.record_count > 0
            ? `Delete "${category.name}" and all ${category.record_count} record${category.record_count === 1 ? "" : "s"} inside it? This can't be undone.`
            : `Delete "${category.name}"?`;
        const confirmed = await confirm(warning, "Delete Category");
        if (!confirmed) return;

        try {
            await deleteFinanceCategory(category.id);
            showToast("Category deleted");
            if (selectedCategoryId === category.id) setSelectedCategoryId(null);
            await reloadCategories();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete category.", "error");
        }
    };

    if (loading) return <div className="finance-page"><p>Loading...</p></div>;
    if (error) return <div className="finance-page"><p className="error-text">{error}</p></div>;
    if (!summary) return null;

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || null;

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

            <div className="finance-layout">
                <div className="category-sidebar card">
                    <div className="category-sidebar-title">Categories</div>

                    {categories.length === 0 && <p className="empty-text">No categories yet.</p>}

                    <div className="category-list">
                        {categories.map((cat) => (
                            <div key={cat.id} className={cat.id === selectedCategoryId ? "category-item active" : "category-item"}>
                                {renamingCategoryId === cat.id ? (
                                    <input
                                        ref={renameInputRef}
                                        type="text"
                                        className="category-rename-input"
                                        value={renameValue}
                                        autoFocus
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleRenameCategory(cat.id);
                                            if (e.key === "Escape") setRenamingCategoryId(null);
                                        }}
                                        onBlur={() => handleRenameCategory(cat.id)}
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        className="category-button"
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        onDoubleClick={() => {
                                            setRenamingCategoryId(cat.id);
                                            setRenameValue(cat.name);
                                        }}
                                    >
                                        <span className="category-name">{cat.name}</span>
                                        <span className="category-meta">
                                            <span className="category-count">{cat.record_count}</span>
                                            <span className={cat.profit >= 0 ? "category-profit positive" : "category-profit negative"}>{formatMoney(cat.profit)}</span>
                                        </span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="category-delete-button"
                                    onClick={() => handleDeleteCategory(cat)}
                                    title="Delete category"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {addingCategory ? (
                        <div className="category-add-row">
                            <input
                                type="text"
                                placeholder="Category name"
                                value={newCategoryName}
                                autoFocus
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddCategory();
                                    if (e.key === "Escape") setAddingCategory(false);
                                }}
                            />
                            <button type="button" className="btn-compact" onClick={handleAddCategory}>Add</button>
                        </div>
                    ) : (
                        <button type="button" className="category-add-button" onClick={() => setAddingCategory(true)}>
                            + New Category
                        </button>
                    )}
                </div>

                <div className="finance-main">
                    {!selectedCategory && (
                        <div className="card finance-panel">
                            <p className="empty-text">Select or create a category to add and view records.</p>
                        </div>
                    )}

                    {selectedCategory && (
                        <>
                            <div className="card finance-panel">
                                <h2>Add a Record — {selectedCategory.name}</h2>
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

                            <div className="card finance-panel">
                                <div className="records-panel-header">
                                    <h2>Records — {selectedCategory.name}</h2>
                                    <div className="category-stats-inline">
                                        <span className="profit-positive">↑ {formatMoney(selectedCategory.received)}</span>
                                        <span className="profit-negative">↓ {formatMoney(selectedCategory.paid)}</span>
                                        <span className={selectedCategory.profit >= 0 ? "profit-positive" : "profit-negative"}>Net {formatMoney(selectedCategory.profit)}</span>
                                    </div>
                                </div>
                                {loadingRecords && <p className="empty-text">Loading...</p>}
                                {!loadingRecords && records.length === 0 && (
                                    <p className="empty-text">No records in this category yet.</p>
                                )}
                                {!loadingRecords && records.length > 0 && (
                                    <>
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
                                                {records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((r) => (
                                                    editingId === r.id ? (
                                                        <tr key={r.id} className="editing-row">
                                                            <td>
                                                                <select className="edit-input" value={editForm.entry_type} onChange={(e) => setEditForm({ ...editForm, entry_type: e.target.value as FinanceEntryType })}>
                                                                    <option value="received">Received</option>
                                                                    <option value="paid">Paid</option>
                                                                </select>
                                                            </td>
                                                            <td><input type="number" className="edit-input" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} /></td>
                                                            <td><input type="date" className="edit-input" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} /></td>
                                                            <td><input type="text" className="edit-input" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" /></td>
                                                            <td className="edit-actions">
                                                                <button type="button" className="btn-compact" onClick={() => handleSaveEdit(r.id)}>Save</button>
                                                                <button type="button" className="btn-compact btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        <tr key={r.id}>
                                                            <td className={r.entry_type === "received" ? "profit-positive" : "profit-negative"}>
                                                                {r.entry_type === "received" ? "Received" : "Paid"}
                                                            </td>
                                                            <td>{formatMoney(r.amount)}</td>
                                                            <td>{new Date(r.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")}</td>
                                                            <td>{r.notes || "—"}</td>
                                                            <td className="edit-actions">
                                                                <button type="button" className="btn-compact" onClick={() => handleEdit(r)}>Edit</button>
                                                                <button type="button" className="btn-compact btn-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                                                            </td>
                                                        </tr>
                                                    )
                                                ))}
                                            </tbody>
                                        </table>
                                        {records.length > PAGE_SIZE && (
                                            <div className="pagination">
                                                <button type="button" className="btn-compact" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
                                                <span className="page-info">Page {currentPage} of {Math.ceil(records.length / PAGE_SIZE)}</span>
                                                <button type="button" className="btn-compact" disabled={currentPage >= Math.ceil(records.length / PAGE_SIZE)} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
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
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(m: string) => { const [y, mo] = m.split("-"); return new Date(Number(y), Number(mo) - 1).toLocaleString("en-IN", { month: "short", year: "numeric" }); }} />
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
                <h2>Financial Year Summary</h2>
                {summary.yearly.length === 0 ? (
                    <p className="empty-text">No records yet.</p>
                ) : (
                    <table className="finance-table fy-table">
                        <thead>
                            <tr>
                                <th>Financial Year</th>
                                <th className="fy-num">Received</th>
                                <th className="fy-num">Paid</th>
                                <th className="fy-num">Net Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.yearly.map((row) => (
                                <tr key={row.fy}>
                                    <td><strong>{row.fy}</strong></td>
                                    <td className="fy-num profit-positive">{formatMoney(row.received)}</td>
                                    <td className="fy-num profit-negative">{formatMoney(row.paid)}</td>
                                    <td className={`fy-num ${row.profit >= 0 ? "profit-positive" : "profit-negative"}`}><strong>{formatMoney(row.profit)}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="fy-total-row">
                                <td><strong>All Time</strong></td>
                                <td className="fy-num profit-positive"><strong>{formatMoney(summary.total_received)}</strong></td>
                                <td className="fy-num profit-negative"><strong>{formatMoney(summary.total_paid)}</strong></td>
                                <td className={`fy-num ${summary.net_profit >= 0 ? "profit-positive" : "profit-negative"}`}><strong>{formatMoney(summary.net_profit)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Finance;