import { useState, useEffect } from "react";
import { useWarnings } from "./hooks/useWarnings";
import "./Warnings.css";

interface RecipientRow {
    id: number;
    name: string;
    email: string;
}

let nextRowId = 0;
function newRow(): RecipientRow {
    return { id: nextRowId++, name: "", email: "" };
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
}

function parseBulkEmails(text: string): { name: string; email: string }[] {
    return text
        .split(/[\n,]/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line.includes("@"))
        .map((email) => ({ name: email, email }));
}

function Warnings() {
    const { defaultMessage, log, loading, loadError, send, sendStatus, sendError, lastResult } = useWarnings();

    const [mode, setMode] = useState<"rows" | "bulk">("rows");
    const [recipients, setRecipients] = useState<RecipientRow[]>([newRow()]);
    const [bulkText, setBulkText] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (defaultMessage && !message) {
            setMessage(defaultMessage);
        }
    }, [defaultMessage, message]);

    const updateRow = (id: number, field: "name" | "email", value: string) => {
        setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const addRow = () => {
        setRecipients((prev) => [...prev, newRow()]);
    };

    const removeRow = (id: number) => {
        setRecipients((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    };

    const rowRecipients = recipients.filter((r) => r.name.trim() && r.email.trim());
    const bulkRecipients = parseBulkEmails(bulkText);
    const validRecipients = mode === "rows" ? rowRecipients : bulkRecipients;

    const canSend = validRecipients.length > 0 && message.trim() !== "";

    const handleSend = () => {
        if (!canSend) return;
        send(
            validRecipients.map((r) => ({ recipient_name: r.name.trim(), recipient_email: r.email.trim() })),
            message.trim()
        );
    };

    return (
        <div className="warnings-page">
            <h1>Send Warning Email</h1>
            <p className="warnings-subtitle">
                Notify one or more college/company-side contacts who have messaged a trainer directly,
                bypassing ACA Technologies as the engaged vendor.
            </p>

            <div className="card warning-form">
                <div className="mode-toggle">
                    <button
                        type="button"
                        className={mode === "rows" ? "mode-tab active" : "mode-tab"}
                        onClick={() => setMode("rows")}
                    >
                        Add one by one
                    </button>
                    <button
                        type="button"
                        className={mode === "bulk" ? "mode-tab active" : "mode-tab"}
                        onClick={() => setMode("bulk")}
                    >
                        Paste in bulk
                    </button>
                </div>

                {mode === "rows" ? (
                    <>
                        <label className="form-section-label">Recipients</label>
                        {recipients.map((row) => (
                            <div key={row.id} className="recipient-row">
                                <input
                                    type="text"
                                    placeholder="Recipient name"
                                    value={row.name}
                                    onChange={(e) => updateRow(row.id, "name", e.target.value)}
                                />
                                <input
                                    type="email"
                                    placeholder="Recipient email"
                                    value={row.email}
                                    onChange={(e) => updateRow(row.id, "email", e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn-compact btn-danger"
                                    onClick={() => removeRow(row.id)}
                                    disabled={recipients.length === 1}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button type="button" className="btn-secondary add-recipient-button" onClick={addRow}>
                            + Add Recipient
                        </button>
                    </>
                ) : (
                    <>
                        <label className="form-section-label">
                            Emails — one per line, or comma-separated
                        </label>
                        <textarea
                            className="bulk-textarea"
                            rows={6}
                            placeholder={"senthil@iamneo.ai\narjun@example.com\npriya@example.com"}
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                        />
                        <p className="bulk-count">
                            {bulkRecipients.length} valid email{bulkRecipients.length === 1 ? "" : "s"} detected
                        </p>
                    </>
                )}

                <div className="form-field">
                    <label>Message</label>
                    <textarea
                        rows={8}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <button type="button" onClick={handleSend} disabled={!canSend || sendStatus === "loading"}>
                    {sendStatus === "loading"
                        ? "Sending..."
                        : `Send Warning Email${validRecipients.length > 1 ? `s (${validRecipients.length})` : ""}`}
                </button>

                {sendStatus === "error" && sendError && <p className="error-text">{sendError}</p>}
                {sendStatus === "success" && <p className="success-text">All warning emails sent and logged.</p>}

                {lastResult && lastResult.results.length > 0 && (
                    <ul className="send-results">
                        {lastResult.results.map((r, i) => (
                            <li key={i} className={r.status === "sent" ? "result-ok" : "result-fail"}>
                                {r.recipient_name} ({r.recipient_email}) — {r.status === "sent" ? "Sent ✓" : `Failed: ${r.error}`}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <h2>Previously Sent Warnings</h2>

            {loading && <p>Loading...</p>}
            {loadError && <p className="error-text">{loadError}</p>}
            {!loading && log.length === 0 && <p className="empty-text">No warning emails sent yet.</p>}

            {!loading && log.length > 0 && (
                <table className="warnings-table">
                    <thead>
                        <tr>
                            <th>Recipient</th>
                            <th>Email</th>
                            <th>Sent At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {log.map((w) => (
                            <tr key={w.id}>
                                <td>{w.recipient_name}</td>
                                <td>{w.recipient_email}</td>
                                <td>{formatDate(w.sent_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Warnings;