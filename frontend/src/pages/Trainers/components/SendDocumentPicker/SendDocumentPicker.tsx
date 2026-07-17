import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    fetchTrainerDocuments,
    getPreviewUrl,
    generateInvoiceFromPO,
    sendDocumentById,
    sendDocumentToTrainer,
} from "../../../../lib/api/trainersClient";
import type { PickerDocument } from "../../../../lib/api/trainersClient";
import { useToast } from "../../../../contexts/ToastContext";
import MultiDatePicker from "../../../Creator/components/CreatorForm/MultiDatePicker/MultiDatePicker";
import "./SendDocumentPicker.css";

interface SendDocumentPickerProps {
    trainerId: number;
    docType: "po" | "invoice";
    onClose: () => void;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
}

function SendDocumentPicker({ trainerId, docType, onClose }: SendDocumentPickerProps) {
    const { showToast } = useToast();
    const [documents, setDocuments] = useState<PickerDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sendingId, setSendingId] = useState<number | null>(null);
    const [generating, setGenerating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [attendedDates, setAttendedDates] = useState<string[]>([]);

    const load = () => {
        setLoading(true);
        setError(null);
        fetchTrainerDocuments(trainerId, docType)
            .then(setDocuments)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trainerId, docType]);

    const handleSend = async (documentId: number) => {
        setSendingId(documentId);
        setError(null);
        try {
            await sendDocumentById(trainerId, documentId);
            showToast(`${docType === "po" ? "PO" : "Invoice"} sent successfully`);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to send.";
            setError(message);
            showToast(message, "error");
        } finally {
            setSendingId(null);
        }
    };

    const handleGenerateFromPO = async () => {
        setGenerating(true);
        setError(null);
        try {
            await generateInvoiceFromPO(trainerId, attendedDates);
            showToast("Invoice generated from PO");
            setAttendedDates([]);
            load();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to generate invoice.";
            setError(message);
            showToast(message, "error");
        } finally {
            setGenerating(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            await sendDocumentToTrainer(trainerId, docType, file);
            showToast("File uploaded and sent");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to upload and send.";
            setError(message);
            showToast(message, "error");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const docLabel = docType === "po" ? "Purchase Order" : "Invoice";

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
                        <h3>Send {docLabel}</h3>
                        <button type="button" className="picker-close" onClick={onClose}>✕</button>
                    </div>

                    {loading && <p>Loading...</p>}
                    {error && <p className="error-text">{error}</p>}

                    {!loading && documents.length === 0 && docType === "po" && (
                        <p className="empty-text">No POs have been generated for this trainer yet.</p>
                    )}

                    {!loading && documents.length === 0 && docType === "invoice" && (
                        <div className="picker-generate-prompt">
                            <p className="empty-text">No invoices generated yet.</p>
                            <label className="picker-field-label">Training days attended (optional)</label>
                            <MultiDatePicker value={attendedDates} onChange={setAttendedDates} />
                            <button
                                type="button"
                                className="picker-generate-button"
                                onClick={handleGenerateFromPO}
                                disabled={generating}
                            >
                                {generating ? "Generating..." : "Generate & Send Invoice from PO"}
                            </button>
                        </div>
                    )}

                    {!loading && documents.length > 0 && (
                        <ul className="picker-doc-list">
                            {documents.map((doc) => (
                                <li key={doc.id} className="picker-doc-row">
                                    <div className="picker-doc-info">
                                        <span className="ref-code">{doc.filename}</span>
                                        <span className="picker-doc-date">{formatDate(doc.created_at)}</span>
                                    </div>
                                    <div className="picker-doc-actions">
                                        <a
                                            href={getPreviewUrl(trainerId, docType, doc.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="picker-preview-link"
                                        >
                                            Preview
                                        </a>
                                        <button
                                            type="button"
                                            className="btn-compact"
                                            disabled={sendingId === doc.id}
                                            onClick={() => handleSend(doc.id)}
                                        >
                                            {sendingId === doc.id ? "Sending..." : "Send"}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {docType === "invoice" && documents.length > 0 && (
                        <div className="picker-generate-prompt">
                            <label className="picker-field-label">Training days attended (optional)</label>
                            <MultiDatePicker value={attendedDates} onChange={setAttendedDates} />
                            <button
                                type="button"
                                className="btn-secondary picker-regenerate"
                                onClick={handleGenerateFromPO}
                                disabled={generating}
                            >
                                {generating ? "Generating..." : "Generate a New Invoice from PO"}
                            </button>
                        </div>
                    )}

                    <div className="picker-upload-row">
                        <span className="picker-upload-label">Or upload a different file to send:</span>
                        <label className="picker-upload-button">
                            {uploading ? "Uploading..." : "Choose File"}
                            <input type="file" accept=".pdf,.docx" hidden onChange={handleUpload} disabled={uploading} />
                        </label>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default SendDocumentPicker;