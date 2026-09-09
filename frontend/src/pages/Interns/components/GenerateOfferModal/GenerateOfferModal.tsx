import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateOfferLetter } from "../../../../lib/api/internsClient";
import "./GenerateOfferModal.css";

interface GenerateOfferModalProps {
    internId: number;
    internName: string;
    onClose: () => void;
    onGenerated: () => void;
}

function GenerateOfferModal({ internId, internName, onClose, onGenerated }: GenerateOfferModalProps) {
    const [role, setRole] = useState("");
    const [department, setDepartment] = useState("");
    const [startDate, setStartDate] = useState("");
    const [duration, setDuration] = useState("");
    const [workMode, setWorkMode] = useState("Remote");
    const [acceptanceDeadline, setAcceptanceDeadline] = useState("Within 2 days of receiving this offer email");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!role.trim() || !department.trim() || !startDate.trim() || !duration.trim() || !workMode.trim() || !acceptanceDeadline.trim()) {
            setError("All fields are required.");
            return;
        }
        setGenerating(true);
        setError(null);
        try {
            await generateOfferLetter(internId, {
                role: role.trim(),
                department: department.trim(),
                start_date: startDate.trim(),
                duration: duration.trim(),
                work_mode: workMode.trim(),
                acceptance_deadline: acceptanceDeadline.trim(),
            });
            onGenerated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate offer letter.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="intern-modal-overlay"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
            >
                <motion.div
                    className="intern-modal-panel card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 12 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    <div className="intern-modal-header">
                        <h3>Generate Offer Letter — {internName}</h3>
                        <button type="button" className="intern-modal-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="intern-modal-form">
                        <div className="intern-modal-field">
                            <label>Role / Position</label>
                            <input type="text" placeholder="e.g. Software Development Intern" value={role} onChange={(e) => setRole(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <label>Department / Domain</label>
                            <input type="text" placeholder="e.g. AI/ML" value={department} onChange={(e) => setDepartment(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <label>Start Date</label>
                            <input type="text" placeholder="e.g. August 01, 2026" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <label>Duration</label>
                            <input type="text" placeholder="e.g. 3 months" value={duration} onChange={(e) => setDuration(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <label>Work Mode</label>
                            <select value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                                <option value="Remote">Remote</option>
                                <option value="On-site">On-site</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div className="intern-modal-field">
                            <label>Acceptance Deadline</label>
                            <input type="text" value={acceptanceDeadline} onChange={(e) => setAcceptanceDeadline(e.target.value)} />
                        </div>
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button type="button" className="intern-modal-submit-button" onClick={handleGenerate} disabled={generating}>
                        {generating ? "Generating..." : "Generate Offer Letter"}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default GenerateOfferModal;