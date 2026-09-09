import { useState, useEffect, useRef } from "react";
import {
    fetchEmailSettings, saveEmailSettings, sendTestEmail, exportBackup, importBackup,
    fetchCompanyAccounts, createCompanyAccount, updateCompanyAccount, deleteCompanyAccount,
} from "../../lib/api/settingsClient";
import type { CompanyAccount, CompanyAccountInput } from "../../lib/api/settingsClient";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import "./Settings.css";

function Settings() {
    const { showToast } = useToast();
    const confirm = useConfirm();
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    // Company accounts
    const BLANK_ACCOUNT: CompanyAccountInput = { label: "", account_holder_name: "", bank_name: "", account_number: "", ifsc_code: "", pan_number: "", mode_of_payment: "" };
    const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
    const [editingAccount, setEditingAccount] = useState<CompanyAccount | null>(null);
    const [newAccount, setNewAccount] = useState<CompanyAccountInput>(BLANK_ACCOUNT);
    const [showAddForm, setShowAddForm] = useState(false);
    const [accountSaving, setAccountSaving] = useState(false);

    const loadAccounts = () => fetchCompanyAccounts().then(setAccounts).catch(() => {});

    useEffect(() => { loadAccounts(); }, []);

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

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportBackup();
            showToast("Backup downloaded");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Backup export failed.", "error");
        } finally {
            setExporting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        const confirmed = await confirm(
            "Restoring this backup will replace ALL current data (trainers, documents, passwords, everything) with what's in this file. This can't be undone. Continue?",
            "Restore Backup"
        );
        if (!confirmed) return;

        setImporting(true);
        try {
            await importBackup(file);
            showToast("Backup restored — reloading the app");
            setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Backup import failed.", "error");
        } finally {
            setImporting(false);
        }
    };

    if (loading) return <div className="settings"><p>Loading...</p></div>;

    return (
        <div className="settings">
            <h1>Settings</h1>
            <p className="settings-subtitle">Configure the email account DocGen sends from.</p>

            <div className="settings-columns">
            <div className="settings-column">
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

            <div className="settings-column">
            <div className="card settings-card">
                <h2>Backup &amp; Restore</h2>
                <p className="settings-subtitle" style={{ margin: "0 0 4px 0" }}>
                    Save a full snapshot of everything — trainers, documents, passwords, all of it — to a file
                    you keep somewhere safe. Useful before updating the app, moving to a new machine, or just
                    as a safety copy.
                </p>

                <div className="backup-actions">
                    <button type="button" onClick={handleExport} disabled={exporting}>
                        {exporting ? "Preparing..." : "Export Backup"}
                    </button>
                    <button type="button" className="backup-restore-button" onClick={handleImportClick} disabled={importing}>
                        {importing ? "Restoring..." : "Restore from Backup"}
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    style={{ display: "none" }}
                    onChange={handleFileSelected}
                />

                <p className="settings-subtitle" style={{ marginTop: 4 }}>
                    Restoring replaces everything currently in the app with what's in the backup file — it can't
                    be undone, so double check you're picking the right file.
                </p>
            </div>
            </div>

            <div className="settings-column" style={{ gridColumn: "1 / -1" }}>
            <div className="card settings-card">
                <h2>Company Bank Accounts</h2>
                <p className="settings-subtitle" style={{ margin: "0 0 12px 0" }}>
                    Save 2–3 accounts here. When generating an ACA invoice from a received trainer invoice, choose which account to pre-fill.
                </p>

                {accounts.map((acc) => (
                    editingAccount?.id === acc.id ? (
                        <div key={acc.id} className="company-account-form">
                            {(["label","account_holder_name","bank_name","account_number","ifsc_code","pan_number","mode_of_payment"] as (keyof CompanyAccountInput)[]).map((field) => (
                                <div className="form-field" key={field}>
                                    <label>{field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</label>
                                    <input type="text" value={editingAccount[field] as string}
                                        onChange={(e) => setEditingAccount({ ...editingAccount, [field]: e.target.value })} />
                                </div>
                            ))}
                            <div style={{ display: "flex", gap: 8 }}>
                                <button type="button" disabled={accountSaving} onClick={async () => {
                                    setAccountSaving(true);
                                    try {
                                        await updateCompanyAccount(acc.id, editingAccount);
                                        await loadAccounts();
                                        setEditingAccount(null);
                                        showToast("Account updated");
                                    } catch { showToast("Failed to update", "error"); }
                                    finally { setAccountSaving(false); }
                                }}>{accountSaving ? "Saving..." : "Save"}</button>
                                <button type="button" className="btn-secondary" onClick={() => setEditingAccount(null)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div key={acc.id} className="company-account-row">
                            <div className="company-account-info">
                                <strong>{acc.label}</strong>
                                <span>{acc.account_holder_name} · {acc.bank_name}</span>
                                <span>{acc.account_number} · IFSC: {acc.ifsc_code}</span>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button type="button" className="btn-compact btn-secondary" onClick={() => setEditingAccount(acc)}>Edit</button>
                                <button type="button" className="btn-compact btn-danger" onClick={async () => {
                                    if (!window.confirm(`Delete account "${acc.label}"?`)) return;
                                    await deleteCompanyAccount(acc.id);
                                    await loadAccounts();
                                    showToast("Account deleted");
                                }}>Delete</button>
                            </div>
                        </div>
                    )
                ))}

                {showAddForm ? (
                    <div className="company-account-form" style={{ marginTop: 12 }}>
                        <strong style={{ fontSize: "0.9rem" }}>New Account</strong>
                        {(["label","account_holder_name","bank_name","account_number","ifsc_code","pan_number","mode_of_payment"] as (keyof CompanyAccountInput)[]).map((field) => (
                            <div className="form-field" key={field}>
                                <label>{field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</label>
                                <input type="text" value={newAccount[field] as string}
                                    placeholder={field === "label" ? "e.g. AU Small Finance" : ""}
                                    onChange={(e) => setNewAccount({ ...newAccount, [field]: e.target.value })} />
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" disabled={accountSaving} onClick={async () => {
                                if (!newAccount.label.trim() || !newAccount.account_number.trim()) {
                                    showToast("Label and Account Number are required", "error"); return;
                                }
                                setAccountSaving(true);
                                try {
                                    await createCompanyAccount(newAccount);
                                    await loadAccounts();
                                    setNewAccount(BLANK_ACCOUNT);
                                    setShowAddForm(false);
                                    showToast("Account added");
                                } catch { showToast("Failed to add account", "error"); }
                                finally { setAccountSaving(false); }
                            }}>{accountSaving ? "Saving..." : "Add Account"}</button>
                            <button type="button" className="btn-secondary" onClick={() => { setShowAddForm(false); setNewAccount(BLANK_ACCOUNT); }}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button type="button" className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setShowAddForm(true)}>+ Add Bank Account</button>
                )}
            </div>
            </div>

            </div>
        </div>
    );
}

export default Settings;