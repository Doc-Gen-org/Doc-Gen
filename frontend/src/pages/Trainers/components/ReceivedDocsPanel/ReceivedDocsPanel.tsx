import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    fetchReceivedDocuments,
    uploadReceivedInvoice,
    downloadReceivedDocument,
    deleteReceivedDocument,
} from "../../../../lib/api/receivedDocumentsClient";
import type { ReceivedDoc } from "../../../../lib/api/receivedDocumentsClient";
import { useToast } from "../../../../contexts/ToastContext";
import { useConfirm } from "../../../../contexts/ConfirmContext";
import "./ReceivedDocsPanel.css";

interface ReceivedDocsPanelProps {
    trainerId: number;
    trainerName: string;
    onClose: () => void;
    onChanged: () => void;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
}

function ReceivedDocsPanel({ trainerId, trainerName, onClose, onChanged }: ReceivedDocsPanelProps) {
    const { showToast } = useToast();
    const confirm = useConfirm();
    const [docs, setDocs] = useState<ReceivedDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const load = () => {
        setLoading(true);
        fetchReceivedDocuments(trainerId)
            .then(setDocs)
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
                                        <li key={doc.id} className="picker-doc-row">
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