import { useState } from "react";
import { Link } from "react-router-dom";
import { useTrainers } from "./hooks/useTrainers";
import { useTrainerStatus } from "./hooks/useTrainerStatus";
import { updateTrainer } from "../../lib/api/trainersClient";
import SendDocumentPicker from "./components/SendDocumentPicker/SendDocumentPicker";
import ReceivedDocsPanel from "./components/ReceivedDocsPanel/ReceivedDocsPanel";
import FinanceDetailsPanel from "./components/FinanceDetailsPanel/FinanceDetailsPanel";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import "./Trainers.css";

const PAYMENT_STATUS_OPTIONS = ["Pending", "Paid", "Processing", "On Hold"];

function statusSelectClass(status: string): string {
    switch (status) {
        case "Paid": return "status-select success";
        case "Pending": return "status-select warning";
        case "On Hold": return "status-select danger";
        default: return "status-select neutral";
    }
}

function Trainers() {
    const { trainers, loading, error, removeTrainer, deletingId, reload } = useTrainers();
    const { showToast } = useToast();
    const confirm = useConfirm();
    const trainerIds = trainers.map((t) => t.id);
    const { statusMap, reload: reloadStatus } = useTrainerStatus(trainerIds);

    const [pickerFor, setPickerFor] = useState<{ trainerId: number; docType: "po" | "invoice" } | null>(null);
    const [receivedPanelFor, setReceivedPanelFor] = useState<{ trainerId: number; trainerName: string } | null>(null);
    const [financePanelFor, setFinancePanelFor] = useState<{ trainerId: number; trainerName: string } | null>(null);
    const [pulsingField, setPulsingField] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const filteredTrainers = trainers.filter((t) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.trainer_code.toLowerCase().includes(q);
    });

    const handleFieldBlur = async (
        trainerId: number,
        field: "email" | "pan" | "aadhaar",
        currentValue: string,
        newValue: string
    ) => {
        if (newValue.trim() === (currentValue || "")) return;
        try {
            await updateTrainer(trainerId, { [field]: newValue.trim() });
            const pulseKey = `${trainerId}-${field}`;
            setPulsingField(pulseKey);
            setTimeout(() => setPulsingField(null), 700);
            reload();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to save.", "error");
        }
    };

    const handleStatusChange = async (trainerId: number, status: string) => {
        await updateTrainer(trainerId, { payment_status: status });
        showToast("Payment status updated");
        reload();
        reloadStatus();
    };

    const handlePaidDateChange = async (trainerId: number, date: string) => {
        await updateTrainer(trainerId, { paid_date: date });
        reload();
    };

    const handleDelete = async (trainerId: number, name: string) => {
        const confirmed = await confirm(
            `Delete trainer "${name}"? Their generated documents will stay in History, but will no longer be linked to this trainer.`,
            "Delete Trainer"
        );
        if (confirmed) {
            removeTrainer(trainerId);
            showToast("Trainer deleted");
        }
    };

    return (
        <div className="trainers">
            <div className="trainers-header">
                <div>
                    <h1>Trainers</h1>
                    <p className="trainers-subtitle">All trainers, their KYC details, and document/payment status.</p>
                </div>
                <Link to="/trainers/new">
                    <button type="button">+ Add Trainer</button>
                </Link>
            </div>
            <p className="hint-text">
                Trainers are also created automatically whenever a PO or Invoice is generated for a new name.
                Click into any field to edit it.
            </p>

            <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, or trainer ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {loading && <p>Loading...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && trainers.length === 0 && <p className="empty-text">No trainers yet.</p>}
            {!loading && trainers.length > 0 && filteredTrainers.length === 0 && (
                <p className="empty-text">No trainers match "{search}".</p>
            )}

            {!loading && filteredTrainers.length > 0 && (
                <div className="card table-card">
                    <table className="trainers-table">
                        <thead>
                            <tr>
                                <th>Trainer ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>PAN</th>
                                <th>Aadhaar</th>
                                <th>Payment Status</th>
                                <th>Paid Date</th>
                                <th>PO</th>
                                <th>Invoice</th>
                                <th>Finance</th>
                                <th>Process</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTrainers.map((t) => {
                                const status = statusMap[t.id];
                                return (
                                    <tr key={t.id}>
                                        <td><span className="ref-code">{t.trainer_code}</span></td>
                                        <td>{t.name}</td>
                                        <td>
                                            <input
                                                type="email"
                                                className={pulsingField === `${t.id}-email` ? "field-pulse" : ""}
                                                defaultValue={t.email}
                                                placeholder="No email on file"
                                                onBlur={(e) => handleFieldBlur(t.id, "email", t.email, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className={pulsingField === `${t.id}-pan` ? "field-pulse" : ""}
                                                defaultValue={t.pan ?? ""}
                                                placeholder="Add PAN"
                                                onBlur={(e) => handleFieldBlur(t.id, "pan", t.pan ?? "", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className={pulsingField === `${t.id}-aadhaar` ? "field-pulse" : ""}
                                                defaultValue={t.aadhaar ?? ""}
                                                placeholder="Add Aadhaar"
                                                onBlur={(e) => handleFieldBlur(t.id, "aadhaar", t.aadhaar ?? "", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                className={statusSelectClass(t.payment_status)}
                                                value={t.payment_status}
                                                onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                            >
                                                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="date"
                                                value={t.paid_date || ""}
                                                onChange={(e) => handlePaidDateChange(t.id, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className={status?.po_ready ? "status-dot dot-on" : "status-dot"}
                                                onClick={() => setPickerFor({ trainerId: t.id, docType: "po" })}
                                            >
                                                {status?.po_ready ? "✓ Ready" : "Not generated"}
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className={status?.invoice_received ? "status-dot dot-on" : "status-dot"}
                                                onClick={() => setReceivedPanelFor({ trainerId: t.id, trainerName: t.name })}
                                            >
                                                {status?.invoice_received ? "✓ Received" : "Not received"}
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="finance-button"
                                                onClick={() => setFinancePanelFor({ trainerId: t.id, trainerName: t.name })}
                                                title="View extracted finance details"
                                            >
                                                💰 View
                                            </button>
                                        </td>
                                        <td>
                                            <span className={status?.process_complete ? "status-pill success" : "status-pill neutral"}>
                                                {status?.process_complete ? "✓ Complete" : "In Progress"}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                type="button"
                                                className="btn-compact"
                                                onClick={() => setPickerFor({ trainerId: t.id, docType: "po" })}
                                            >
                                                Send PO
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-compact btn-secondary"
                                                onClick={() => setPickerFor({ trainerId: t.id, docType: "invoice" })}
                                            >
                                                Send Invoice
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-compact btn-danger"
                                                disabled={deletingId === t.id}
                                                onClick={() => handleDelete(t.id, t.name)}
                                            >
                                                {deletingId === t.id ? "Deleting..." : "Delete"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {pickerFor && (
                <SendDocumentPicker trainerId={pickerFor.trainerId} docType={pickerFor.docType} onClose={() => setPickerFor(null)} />
            )}

            {receivedPanelFor && (
                <ReceivedDocsPanel
                    trainerId={receivedPanelFor.trainerId}
                    trainerName={receivedPanelFor.trainerName}
                    onClose={() => setReceivedPanelFor(null)}
                    onChanged={reloadStatus}
                />
            )}

            {financePanelFor && (
                <FinanceDetailsPanel
                    trainerId={financePanelFor.trainerId}
                    trainerName={financePanelFor.trainerName}
                    onClose={() => setFinancePanelFor(null)}
                />
            )}
        </div>
    );
}

export default Trainers;