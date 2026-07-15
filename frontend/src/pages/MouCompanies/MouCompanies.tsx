import { useState } from "react";
import { Link } from "react-router-dom";
import { useMouCompanies } from "./hooks/useMouCompanies";
import { updateMouCompany } from "../../lib/api/mouCompaniesClient";
import MouPreviewPanel from "./components/MouPreviewPanel/MouPreviewPanel";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import "./MouCompanies.css";

function MouCompanies() {
    const { companies, loading, error, removeCompany, deletingId, reload } = useMouCompanies();
    const { showToast } = useToast();
    const confirm = useConfirm();

    const [search, setSearch] = useState("");
    const [previewFor, setPreviewFor] = useState<number | null>(null);
    const [pulsingField, setPulsingField] = useState<string | null>(null);

    const filtered = companies.filter((c) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return c.name.toLowerCase().includes(q) || c.company_code.toLowerCase().includes(q);
    });

    const previewCompany = companies.find((c) => c.id === previewFor);

    const handleFieldBlur = async (
        companyId: number,
        field: "address" | "signatory_name" | "signatory_title" | "email" | "pan" | "trainer_contact",
        currentValue: string,
        newValue: string
    ) => {
        if (newValue.trim() === (currentValue || "")) return;
        try {
            await updateMouCompany(companyId, { [field]: newValue.trim() });
            const key = `${companyId}-${field}`;
            setPulsingField(key);
            setTimeout(() => setPulsingField(null), 700);
            reload();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to save.", "error");
        }
    };

    const handleDelete = async (companyId: number, name: string) => {
        const confirmed = await confirm(
            `Delete "${name}"? Their generated MOUs will stay in History, but will no longer be linked to this company.`,
            "Delete Company"
        );
        if (confirmed) {
            removeCompany(companyId);
            showToast("Company deleted");
        }
    };

    return (
        <div className="mou-companies">
            <div className="mou-companies-header">
                <div>
                    <h1>MOU Companies</h1>
                    <p className="mou-companies-subtitle">
                        Companies ACA Technologies has signed MOUs with, and every MOU generated for them.
                    </p>
                </div>
                <Link to="/mou-companies/new">
                    <button type="button">+ Add Company</button>
                </Link>
            </div>
            <p className="hint-text">
                Companies are also created automatically whenever an MOU is generated for a new name.
                Click into any field below to edit it — changes save when you click away.
            </p>

            <input
                type="text"
                className="search-input"
                placeholder="Search by company name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {loading && <p>Loading...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && companies.length === 0 && <p className="empty-text">No companies yet.</p>}
            {!loading && companies.length > 0 && filtered.length === 0 && (
                <p className="empty-text">No companies match "{search}".</p>
            )}

            {!loading && filtered.length > 0 && (
                <div className="card table-card">
                    <table className="mou-companies-table">
                        <thead>
                            <tr>
                                <th>Company ID</th>
                                <th>Name</th>
                                <th>Address</th>
                                <th>Signatory Name</th>
                                <th>Signatory Title</th>
                                <th>Email</th>
                                <th>PAN</th>
                                <th>MOUs</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id}>
                                    <td><span className="ref-code">{c.company_code}</span></td>
                                    <td>{c.name}</td>
                                    <td>
                                        <input
                                            type="text"
                                            className={pulsingField === `${c.id}-address` ? "field-pulse" : ""}
                                            defaultValue={c.address ?? ""}
                                            placeholder="Add address"
                                            onBlur={(e) => handleFieldBlur(c.id, "address", c.address ?? "", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className={pulsingField === `${c.id}-signatory_name` ? "field-pulse" : ""}
                                            defaultValue={c.signatory_name ?? ""}
                                            placeholder="Add name"
                                            onBlur={(e) => handleFieldBlur(c.id, "signatory_name", c.signatory_name ?? "", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className={pulsingField === `${c.id}-signatory_title` ? "field-pulse" : ""}
                                            defaultValue={c.signatory_title ?? ""}
                                            placeholder="Add title"
                                            onBlur={(e) => handleFieldBlur(c.id, "signatory_title", c.signatory_title ?? "", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="email"
                                            className={pulsingField === `${c.id}-email` ? "field-pulse" : ""}
                                            defaultValue={c.email ?? ""}
                                            placeholder="Add email"
                                            onBlur={(e) => handleFieldBlur(c.id, "email", c.email ?? "", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className={pulsingField === `${c.id}-pan` ? "field-pulse" : ""}
                                            defaultValue={c.pan ?? ""}
                                            placeholder="Add PAN"
                                            onBlur={(e) => handleFieldBlur(c.id, "pan", c.pan ?? "", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={c.documents.length > 0 ? "status-dot dot-on" : "status-dot"}
                                            onClick={() => setPreviewFor(c.id)}
                                        >
                                            {c.documents.length} {c.documents.length === 1 ? "MOU" : "MOUs"}
                                        </button>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            type="button"
                                            className="btn-compact btn-danger"
                                            disabled={deletingId === c.id}
                                            onClick={() => handleDelete(c.id, c.name)}
                                        >
                                            {deletingId === c.id ? "Deleting..." : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {previewCompany && (
                <MouPreviewPanel
                    companyId={previewCompany.id}
                    companyName={previewCompany.name}
                    documents={previewCompany.documents}
                    onClose={() => setPreviewFor(null)}
                />
            )}
        </div>
    );
}

export default MouCompanies;