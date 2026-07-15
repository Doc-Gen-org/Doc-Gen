import { useState, useEffect } from "react";
import { fetchTrainers } from "../../../../lib/api/trainersClient";
import type { Trainer } from "../../../../lib/api/trainersClient";
import { useSendEmail } from "../../hooks/useSendEmail";
import { useToast } from "../../../../contexts/ToastContext";
import "./SendEmailPanel.css";

interface SendEmailPanelProps {
    documentId: string;
}

function SendEmailPanel({ documentId }: SendEmailPanelProps) {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
    const [manualEmail, setManualEmail] = useState("");
    const { send, status, error } = useSendEmail();
    const { showToast } = useToast();

    useEffect(() => {
        fetchTrainers().then(setTrainers).catch(() => setTrainers([]));
    }, []);

    useEffect(() => {
        if (status === "success") showToast("Email sent");
        if (status === "error" && error) showToast(error, "error");
    }, [status, error, showToast]);

    const handleSend = () => {
        const body = manualEmail.trim()
            ? { document_id: Number(documentId), trainer_email: manualEmail.trim() }
            : { document_id: Number(documentId), trainer_id: Number(selectedTrainerId) };

        send(body);
    };

    const canSend = manualEmail.trim() !== "" || selectedTrainerId !== "";

    return (
        <div className="send-email-panel">
            <h3>Send this document</h3>

            <label className="field-label">Select trainer</label>
            <select
                className="field-input"
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                disabled={manualEmail.trim() !== ""}
            >
                <option value="">-- choose a trainer --</option>
                {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                    </option>
                ))}
            </select>

            <p className="or-divider">or enter an email manually</p>

            <input
                className="field-input"
                type="email"
                placeholder="trainer@example.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
            />

            <button
                type="button"
                className="submit-button"
                onClick={handleSend}
                disabled={!canSend || status === "loading"}
            >
                {status === "loading" ? "Sending..." : "Send Email"}
            </button>

            {status === "error" && error && <p className="error-text">{error}</p>}
            {status === "success" && <p className="success-text">Email sent successfully.</p>}
        </div>
    );
}

export default SendEmailPanel;