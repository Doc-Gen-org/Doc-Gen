import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateCertificate } from "../../../../lib/api/internsClient";
import { refineContributionText } from "../../../../lib/api/aiClient";
import { useToast } from "../../../../contexts/ToastContext";
import "../GenerateOfferModal/GenerateOfferModal.css";

interface GenerateCertificateModalProps {
    internId: number;
    internName: string;
    internInstitution: string | null;
    onClose: () => void;
    onGenerated: () => void;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function GenerateCertificateModal({ internId, internName, internInstitution, onClose, onGenerated }: GenerateCertificateModalProps) {
    const { showToast } = useToast();

    const [studentId, setStudentId] = useState("");
    const [degreeYear, setDegreeYear] = useState("");
    const [institutionName, setInstitutionName] = useState(internInstitution || "");
    const [institutionLocation, setInstitutionLocation] = useState("");
    const [startDate, setStartDate] = useState("");
    const [duration, setDuration] = useState("");
    const [contributionSummary, setContributionSummary] = useState("");
    const [certificateDate, setCertificateDate] = useState(todayISO());
    const [refining, setRefining] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRefine = async () => {
        if (!contributionSummary.trim()) {
            showToast("Type a rough draft first, then click Refine.", "error");
            return;
        }
        setRefining(true);
        try {
            const refined = await refineContributionText(contributionSummary);
            setContributionSummary(refined);
            showToast("Text refined");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Refine failed.", "error");
        } finally {
            setRefining(false);
        }
    };

    const handleGenerate = async () => {
        if (!studentId.trim() || !degreeYear.trim() || !institutionName.trim() || !institutionLocation.trim() || !startDate.trim() || !duration.trim() || !contributionSummary.trim()) {
            setError("All fields are required.");
            return;
        }
        setGenerating(true);
        setError(null);
        try {
            await generateCertificate(internId, {
                student_id: studentId.trim(),
                degree_year: degreeYear.trim(),
                institution_name: institutionName.trim(),
                institution_location: institutionLocation.trim(),
                start_date: startDate.trim(),
                duration: duration.trim(),
                contribution_summary: contributionSummary.trim(),
                certificate_date: certificateDate,
            });
            onGenerated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate certificate.");
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
                        <h3>Generate Certificate — {internName}</h3>
                        <button type="button" className="intern-modal-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="intern-modal-form">
                        <div className="intern-modal-field">
                            <label>Intern Name</label>
                            <div className="intern-modal-field-static">{internName}</div>
                        </div>
                        <div className="intern-modal-field">
                            <label>Student ID / Roll Number</label>
                            <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <label>Degree & Year</label>
                            <input type="text" placeholder="e.g. B.Tech CSE, 3rd Year" value={degreeYear} onChange={(e) => setDegreeYear(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <label>Institution Name</label>
                            <input type="text" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <label>Institution Location</label>
                            <input type="text" value={institutionLocation} onChange={(e) => setInstitutionLocation(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <label>Internship Start Date</label>
                            <input type="text" placeholder="e.g. August 01, 2026" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <label>Duration</label>
                            <input type="text" placeholder="e.g. 3 months" value={duration} onChange={(e) => setDuration(e.target.value)} />
                        </div>
                        <div className="intern-modal-field">
                            <div className="intern-modal-label-row">
                                <label>Contribution Summary</label>
                                <button
                                    type="button"
                                    className="intern-modal-refine-button"
                                    onClick={handleRefine}
                                    disabled={refining}
                                >
                                    {refining ? "Refining..." : "✨ Refine with AI"}
                                </button>
                            </div>
                            <textarea
                                placeholder="Wrap key phrases in **double asterisks** to make them bold."
                                value={contributionSummary}
                                onChange={(e) => setContributionSummary(e.target.value)}
                            />
                        </div>
                        <div className="intern-modal-field">
                            <label>Certificate Issue Date</label>
                            <input type="date" value={certificateDate} onChange={(e) => setCertificateDate(e.target.value)} />
                        </div>
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button type="button" className="intern-modal-submit-button" onClick={handleGenerate} disabled={generating}>
                        {generating ? "Generating..." : "Generate Certificate"}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default GenerateCertificateModal;