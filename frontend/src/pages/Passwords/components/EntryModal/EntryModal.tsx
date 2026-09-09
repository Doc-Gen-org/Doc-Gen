import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createEntry, updateEntry } from "../../../../lib/api/passwordsClient";
import type { PasswordEntry } from "../../../../lib/api/passwordsClient";
import { generatePassword, estimatePasswordQuality } from "../../../../lib/passwordGenerator";
import "./EntryModal.css";

interface EntryModalProps {
    mode: "add" | "edit";
    categoryId: number;
    entry?: PasswordEntry;
    onClose: () => void;
    onSaved: () => void;
}

function EntryModal({ mode, categoryId, entry, onClose, onSaved }: EntryModalProps) {
    const [title, setTitle] = useState(entry?.title || "");
    const [username, setUsername] = useState(entry?.username || "");
    const [password, setPassword] = useState(entry?.password || "");
    const [repeatPassword, setRepeatPassword] = useState(entry?.password || "");
    const [url, setUrl] = useState(entry?.url || "");
    const [notes, setNotes] = useState(entry?.notes || "");
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const quality = estimatePasswordQuality(password);
    const passwordsMatch = password === repeatPassword;

    const handleGenerate = () => {
        const generated = generatePassword(16);
        setPassword(generated);
        setRepeatPassword(generated);
        setShowPassword(true);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError("Title is required.");
            return;
        }
        if (!passwordsMatch) {
            setError("Password and Repeat don't match.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const input = {
                title: title.trim(),
                username: username.trim() || undefined,
                password: password || undefined,
                url: url.trim() || undefined,
                notes: notes.trim() || undefined,
            };

            if (mode === "add") {
                await createEntry(categoryId, input);
            } else if (entry) {
                await updateEntry(entry.id, input);
            }

            onSaved();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save entry.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="entry-modal-overlay"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
            >
                <motion.div
                    className="entry-modal-panel card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 12 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    <div className="entry-modal-header">
                        <h3>{mode === "add" ? "New Entry" : "Edit Entry"}</h3>
                        <button type="button" className="entry-modal-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="entry-modal-form">
                        <div className="entry-modal-field">
                            <label>Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                        </div>

                        <div className="entry-modal-field">
                            <label>User name</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>

                        <div className="entry-modal-field">
                            <label>Password</label>
                            <div className="password-input-row">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? "Hide" : "Show"}
                                >
                                    {showPassword ? "🙈" : "👁"}
                                </button>
                                <button type="button" className="password-generate-button" onClick={handleGenerate}>
                                    Generate
                                </button>
                            </div>
                        </div>

                        <div className="entry-modal-field">
                            <label>Repeat</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={repeatPassword}
                                onChange={(e) => setRepeatPassword(e.target.value)}
                            />
                            {!passwordsMatch && repeatPassword.length > 0 && (
                                <span className="password-mismatch">Doesn't match</span>
                            )}
                        </div>

                        <div className="entry-modal-field">
                            <label>Quality</label>
                            <div className="quality-row">
                                <div className="quality-bar-track">
                                    <div
                                        className="quality-bar-fill"
                                        style={{ width: `${quality.percent}%`, background: quality.barColor }}
                                    />
                                </div>
                                <span className="quality-label">{quality.bits} bits, {quality.length} ch</span>
                            </div>
                        </div>

                        <div className="entry-modal-field">
                            <label>URL</label>
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
                        </div>

                        <div className="entry-modal-field">
                            <label>Notes</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
                        </div>
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <div className="entry-modal-actions">
                        <button type="button" className="entry-modal-cancel" onClick={onClose}>Cancel</button>
                        <button type="button" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "OK"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default EntryModal;