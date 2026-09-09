import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    fetchReceivedDocuments,
    uploadReceivedInvoice,
    downloadReceivedDocument,
    deleteReceivedDocument,
    generateAcaInvoice,
    getAcaInvoiceDownloadUrl,
} from "../../../../lib/api/receivedDocumentsClient";
import type { ReceivedDoc } from "../../../../lib/api/receivedDocumentsClient";
import { fetchCompanyAccounts } from "../../../../lib/api/settingsClient";
import type { CompanyAccount } from "../../../../lib/api/settingsClient";
import { useToast } from "../../../../contexts/ToastContext";
import { useConfirm } from "../../../../contexts/ConfirmContext";
import { formatDate } from "../../../../lib/dateUtils";
import "./ReceivedDocsPanel.css";

interface ReceivedDocsPanelProps {
    trainerId: number;
    trainerName: string;
    onClose: () => void;
    onChanged: () => void;
}

function ReceivedDocsPanel({ trainerId, trainerName, onClose, onChanged }: ReceivedDocsPanelProps) {
    const { showToast } = useToast();
    const confirm = useConfirm();
    const [docs, setDocs] = useState<ReceivedDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
    // per-doc state: selected account id and generated invoice record id
    const [selectedAccount, setSelectedAccount] = useState<Record<number, number>>({});
    const [ratePerDay, setRatePerDay] = useState<Record<number, string>>({});
    const [generatedInvoice, setGeneratedInvoice] = useState<Record<number, { id: number; filename: string }>>({});
    const [generating, setGenerating] = useState<number | null>(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            fetchReceivedDocuments(trainerId),
            fetchCompanyAccounts(),
        ])
            .then(([docs, accs]) => {
                setDocs(docs);
                setAccounts(accs);
                if (accs.length > 0) {
                    const defaults: Record<number, number> = {};
                    docs.forEach((d) => { defaults[d.id] = accs[0].id; });
                    setSelectedAccount(defaults);
                }
            })
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trainerId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            await uploadReceivedInvoice(trainerId, file);
            showToast("Invoice received and saved");
            load();
            onChanged();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed.";
            setError(message);
            showToast(message, "error");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleDelete = async (documentId: number) => {
        const confirmed = await confirm("Remove this received invoice?", "Remove Document");
        if (!confirmed) return;
        try {
            await deleteReceivedDocument(trainerId, documentId);
            showToast("Received invoice removed");
            load();
            onChanged();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Delete failed.";
            setError(message);
            showToast(message, "error");
        }
    };

    const handleGenerate = async (docId: number) => {
        const accountId = selectedAccount[docId];
        if (!accountId) return;
        const rate = Number(ratePerDay[docId]);
        if (!rate || rate <= 0) {
            showToast("Enter a valid per-day rate first", "error");
            return;
        }
        setGenerating(docId);
        try {
            const result = await generateAcaInvoice(trainerId, docId, accountId, rate);
            setGeneratedInvoice((prev) => ({ ...prev, [docId]: result }));
            showToast("ACA invoice generated");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Generation failed.";
            showToast(message, "error");
        } finally {
            setGenerating(null);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="picker-overlay"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
            >
                <motion.div
                    className="picker-panel card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 12 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    <div className="picker-header">
                        <h3>Received Invoice — {trainerName}</h3>
                        <button type="button" className="picker-close" onClick={onClose}>✕</button>
                    </div>

                    {error && <p className="error-text">{error}</p>}
                    {loading && <p>Loading...</p>}

                    {!loading && (
                        <>
                            <div className="received-section-header">
                                <span>Filled invoices received from this trainer</span>
                                <label className="picker-upload-button">
                                    {uploading ? "Uploading..." : "Upload Invoice"}
                                    <input type="file" accept=".pdf,.docx" hidden disabled={uploading} onChange={handleUpload} />
                                </label>
                            </div>

                            {docs.length === 0 ? (
                                <p className="empty-text">Nothing received yet.</p>
                            ) : (
                                <ul className="picker-doc-list">
                                    {docs.map((doc) => (
                                        <li key={doc.id} className="picker-doc-row picker-doc-row--stacked">
                                            <div className="picker-doc-info">
                                                <span className="ref-code">{doc.original_filename}</span>
                                                <span className="picker-doc-date">{formatDate(doc.uploaded_at)}</span>
                                            </div>
                                            <div className="picker-doc-actions">
                                                <button type="button" className="btn-compact btn-secondary" onClick={() => downloadReceivedDocument(trainerId, doc)}>
                                                    Download
                                                </button>
                                                <button type="button" className="btn-compact btn-danger" onClick={() => handleDelete(doc.id)}>
                                                    Remove
                                                </button>
                                            </div>
                                            {accounts.length > 0 && (
                                                <div className="aca-invoice-row">
                                                    <select
                                                        className="aca-account-select"
                                                        value={selectedAccount[doc.id] ?? accounts[0].id}
                                                        onChange={(e) => setSelectedAccount((prev) => ({ ...prev, [doc.id]: Number(e.target.value) }))}
                                                    >
                                                        {accounts.map((a) => (
                                                            <option key={a.id} value={a.id}>{a.label} — {a.account_number}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        className="aca-rate-input"
                                                        placeholder="Rate / day"
                                                        value={ratePerDay[doc.id] ?? ""}
                                                        onChange={(e) => setRatePerDay((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-compact"
                                                        disabled={generating === doc.id}
                                                        onClick={() => handleGenerate(doc.id)}
                                                    >
                                                        {generating === doc.id ? "Generating..." : "Generate ACA Invoice"}
                                                    </button>
                                                    {generatedInvoice[doc.id] && (
                                                        <a
                                                            href={getAcaInvoiceDownloadUrl(trainerId, generatedInvoice[doc.id].id)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="picker-preview-link"
                                                        >
                                                            Download ACA Invoice
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {accounts.length === 0 && (
                                                <p className="aca-no-accounts">Add company bank accounts in Settings to generate ACA invoices.</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ReceivedDocsPanel;