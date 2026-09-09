import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { getMouPreviewUrl } from "../../../../lib/api/mouCompaniesClient";
import type { MouCompanyDocument } from "../../../../lib/api/mouCompaniesClient";
import DocumentPreviewModal from "../../../../components/DocumentPreviewModal/DocumentPreviewModal";
import { formatDate } from "../../../../lib/dateUtils";

interface MouPreviewPanelProps {
    companyId: number;
    companyName: string;
    documents: MouCompanyDocument[];
    onClose: () => void;
}

function MouPreviewPanel({ companyId, companyName, documents, onClose }: MouPreviewPanelProps) {
    const [previewDoc, setPreviewDoc] = useState<MouCompanyDocument | null>(null);

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
                        <h3>MOUs — {companyName}</h3>
                        <button type="button" className="picker-close" onClick={onClose}>✕</button>
                    </div>

                    {documents.length === 0 ? (
                        <p className="empty-text">No MOUs generated for this company yet.</p>
                    ) : (
                        <ul className="picker-doc-list">
                            {documents.map((doc) => (
                                <li key={doc.id} className="picker-doc-row">
                                    <div className="picker-doc-info">
                                        <span className="ref-code">{doc.filename}</span>
                                        <span className="picker-doc-date">{formatDate(doc.created_at)}</span>
                                    </div>

                                    <button
                                        type="button"
                                        className="picker-preview-link"
                                        onClick={() => setPreviewDoc(doc)}
                                    >
                                        Preview
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.div>
            </motion.div>

            {previewDoc && (
                <DocumentPreviewModal
                    url={getMouPreviewUrl(companyId, previewDoc.id)}
                    format={previewDoc.output_format}
                    title={previewDoc.filename}
                    onClose={() => setPreviewDoc(null)}
                />
            )}
        </AnimatePresence>
    );
}

export default MouPreviewPanel;