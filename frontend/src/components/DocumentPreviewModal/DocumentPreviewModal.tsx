import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { renderAsync } from "docx-preview";
import "./DocumentPreviewModal.css";

interface DocumentPreviewModalProps {
    url: string;
    format: string; // "pdf" | "docx" (or anything else, treated as unsupported)
    title: string;
    onClose: () => void;
}

function DocumentPreviewModal({ url, format, title, onClose }: DocumentPreviewModalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(format === "docx");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (format !== "docx") return;
        let cancelled = false;

        setLoading(true);
        setError(null);

        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load document: ${res.status}`);
                return res.blob();
            })
            .then((blob) => {
                if (cancelled || !containerRef.current) return;
                containerRef.current.innerHTML = "";
                return renderAsync(blob, containerRef.current);
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof Error ? err.message : "Failed to render document.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [url, format]);

    return (
        <AnimatePresence>
            <motion.div
                className="preview-overlay"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
            >
                <motion.div
                    className="preview-panel card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    <div className="preview-header">
                        <h3>{title}</h3>
                        <button type="button" className="picker-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="preview-body">
                        {format === "pdf" && (
                            <iframe src={url} title={title} className="preview-iframe" />
                        )}

                        {format === "docx" && (
                            <>
                                {loading && <p className="preview-status">Loading document...</p>}
                                {error && <p className="preview-status error-text">{error}</p>}
                                <div ref={containerRef} className="preview-docx-container" />
                            </>
                        )}

                        {format !== "pdf" && format !== "docx" && (
                            <p className="preview-status">Preview isn't available for this file type.</p>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default DocumentPreviewModal;
