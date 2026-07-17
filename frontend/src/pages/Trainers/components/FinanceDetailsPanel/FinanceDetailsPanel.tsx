import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFinanceDetails } from "../../../../lib/api/receivedDocumentsClient";
import "./FinanceDetailsPanel.css";

interface FinanceDetailsPanelProps {
    trainerId: number;
    trainerName: string;
    onClose: () => void;
}

function FinanceDetailsPanel({ trainerId, trainerName, onClose }: FinanceDetailsPanelProps) {
    const [details, setDetails] = useState<Record<string, string> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetchFinanceDetails(trainerId)
            .then(setDetails)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load finance details."))
            .finally(() => setLoading(false));
    }, [trainerId]);

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
                        <h3>Finance Details — {trainerName}</h3>
                        <button type="button" className="picker-close" onClick={onClose}>✕</button>
                    </div>

                    {loading && <p>Loading...</p>}
                    {error && <p className="error-text">{error}</p>}

                    {!loading && !error && !details && (
                        <p className="empty-text">
                            No filled invoice has been received for this trainer yet, or the uploaded
                            file didn't contain any recognizable finance fields.
                        </p>
                    )}

                    {!loading && details && Object.keys(details).length === 0 && (
                        <p className="empty-text">
                            An invoice was received, but no finance details could be extracted from it.
                        </p>
                    )}

                    {!loading && details && Object.keys(details).length > 0 && (
                        <table className="finance-table">
                            <tbody>
                                {Object.entries(details).map(([label, value]) => (
                                    <tr key={label}>
                                        <td className="finance-label">{label}</td>
                                        <td className="finance-value">{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <p className="finance-disclaimer">
                        Extracted automatically from the most recently uploaded filled invoice.
                        Always double-check against the original file before processing payment.
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default FinanceDetailsPanel;