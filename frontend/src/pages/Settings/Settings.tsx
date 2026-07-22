import { useState, useEffect } from "react";
import { fetchEmailSettings, saveEmailSettings, sendTestEmail } from "../../lib/api/settingsClient";
import { useToast } from "../../contexts/ToastContext";
import "./Settings.css";

function Settings() {
    const { showToast } = useToast();
    const [smtpHost, setSmtpHost] = useState("");
    const [smtpPort, setSmtpPort] = useState("587");
    const [smtpUser, setSmtpUser] = useState("");
    const [smtpPassword, setSmtpPassword] = useState("");
    const [fromName, setFromName] = useState("ACA Technologies");
    const [configured, setConfigured] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveError, setSaveError] = useState<string | null>(null);

    const [testEmail, setTestEmail] = useState("");
    const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [testError, setTestError] = useState<string | null>(null);

    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        fetchEmailSettings()
            .then((settings) => {
                setSmtpHost(settings.smtp_host || "");
                setSmtpPort(String(settings.smtp_port || 587));
                setSmtpUser(settings.smtp_user || "");
                setFromName(settings.from_name || "ACA Technologies");
                setConfigured(settings.configured);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaveStatus("saving");
        setSaveError(null);
        try {
            await saveEmailSettings({
                smtp_host: smtpHost.trim(),
                smtp_port: Number(smtpPort),
                smtp_user: smtpUser.trim(),
                smtp_password: smtpPassword,
                from_name: fromName.trim(),
            });
            setSaveStatus("saved");
            setConfigured(true);
            setSmtpPassword("");
            showToast("Settings saved");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save settings.";
            setSaveError(message);
            setSaveStatus("error");
            showToast(message, "error");
        }
    };

    const handleTestSend = async () => {
        if (!testEmail.trim()) return;
        setTestStatus("sending");
        setTestError(null);
        try {
            await sendTestEmail(testEmail.trim());
            setTestStatus("sent");
            showToast("Test email sent — check the inbox");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Test email failed.";
            setTestError(message);
            setTestStatus("error");
            showToast(message, "error");
        }
    };

    if (loading) return <div className="settings"><p>Loading...</p></div>;

    return (
        <div className="settings">
            <h1>Settings</h1>
            <p className="settings-subtitle">Configure the email account DocGen sends from.</p>

            <div className="card settings-card">
                <div className="status-line">
                    <span className={configured ? "status-pill success" : "status-pill warning"}>
                        {configured ? "Configured" : "Not configured"}
                    </span>
                    <button
                        type="button"
                        className="help-toggle-button"
                        onClick={() => setShowHelp((v) => !v)}
                    >
                        {showHelp ? "Hide instructions" : "? How do I get these?"}
                    </button>
                </div>

                {showHelp && (
                    <div className="help-panel">
                        <p className="help-panel-title">Setting up Hostinger custom domain email</p>
                        <ol>
                            <li>SMTP Host: <code>smtp.hostinger.com</code></li>
                            <li>SMTP Port: <code>587</code></li>
                            <li>SMTP Username: the full mailbox address, e.g. <code>hr@yourcompany.com</code></li>
                            <li>SMTP Password: try the regular password for that mailbox first — the same one used to log into <code>mail.hostinger.com</code> or webmail.</li>
                        </ol>
                        <p className="help-panel-note">
                            If sending fails with an authentication error, that mailbox likely has two-factor
                            authentication turned on — in that case, use a Hostinger App Password instead of
                            the regular one: in hPanel, go to Emails → your domain → Mailboxes → the ⋮ menu
                            next to the mailbox → App passwords → Generate. Use that generated code as the
                            SMTP Password instead.
                        </p>
                        <p className="help-panel-note">
                            Always use <strong>Send Test Email</strong> below after saving to confirm it
                            actually works before relying on it.
                        </p>
                    </div>
                )}

                <div className="form-field">
                    <label>SMTP Host</label>
                    <input
                        type="text"
                        placeholder="smtp.hostinger.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                    />
                </div>

                <div className="form-field">
                    <label>SMTP Port</label>
                    <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                    />
                </div>

                <div className="form-field">
                    <label>SMTP Username / Email</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                    />
                </div>

                <div className="form-field">
                    <label>SMTP Password / App Password</label>
                    <input
                        type="password"
                        placeholder={configured ? "•••••••••••••• (leave blank to keep current)" : "Enter password"}
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                    />
                </div>

                <div className="form-field">
                    <label>From Name</label>
                    <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                    />
                </div>

                <button type="button" onClick={handleSave} disabled={saveStatus === "saving"}>
                    {saveStatus === "saving" ? "Saving..." : "Save Settings"}
                </button>

                {saveStatus === "error" && saveError && <p className="error-text">{saveError}</p>}
                {saveStatus === "saved" && <p className="success-text">Settings saved.</p>}
            </div>

            <div className="card settings-card">
                <h2>Send Test Email</h2>
                <div className="form-field">
                    <label>Send a test to</label>
                    <input
                        type="email"
                        placeholder="your-email@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                    />
                </div>

                <button type="button" onClick={handleTestSend} disabled={testStatus === "sending"}>
                    {testStatus === "sending" ? "Sending..." : "Send Test Email"}
                </button>

                {testStatus === "error" && testError && <p className="error-text">{testError}</p>}
                {testStatus === "sent" && <p className="success-text">Test email sent — check the inbox.</p>}
            </div>
        </div>
    );
}

export default Settings;