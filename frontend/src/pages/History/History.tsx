import { useState } from "react";
import { useHistory } from "./hooks/useHistory";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import "./History.css";

const DOC_TYPE_LABELS: Record<string, string> = {
    po: "Purchase Order",
    mou: "Memorandum of Understanding",
    invoice: "Invoice",
    certificate: "Certificate",
};

function formatDocType(type: string): string {
    return DOC_TYPE_LABELS[type] || type;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
}

function History() {
    const { records, loading, error, download, remove } = useHistory();
    const { showToast } = useToast();
    const confirm = useConfirm();
    const [search, setSearch] = useState("");

    const filteredRecords = records.filter((r) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            r.filename.toLowerCase().includes(q) ||
            formatDocType(r.document_type).toLowerCase().includes(q)
        );
    });

    const handleDownload = async (record: Parameters<typeof download>[0]) => {
        try {
            await download(record);
            showToast("Download started");
        } catch {
            showToast("Download failed", "error");
        }
    };

    const handleDelete = async (id: number, filename: string) => {
        const confirmed = await confirm(`Delete "${filename}"? This cannot be undone.`, "Delete Document");
        if (confirmed) {
            remove(id);
            showToast("Document deleted");
        }
    };

    return (
        <div className="history">
            <h1>History</h1>
            <p className="history-subtitle">All previously generated documents.</p>

            <input
                type="text"
                className="search-input"
                placeholder="Search by filename or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {loading && <p>Loading...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && records.length === 0 && <p className="empty-text">No documents generated yet.</p>}
            {!loading && records.length > 0 && filteredRecords.length === 0 && (
                <p className="empty-text">No documents match "{search}".</p>
            )}

            {!loading && filteredRecords.length > 0 && (
                <div className="card table-card">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Filename</th>
                                <th>Format</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((r) => (
                                <tr key={r.id}>
                                    <td>{formatDocType(r.document_type)}</td>
                                    <td><span className="ref-code">{r.filename}</span></td>
                                    <td>{r.output_format.toUpperCase()}</td>
                                    <td>{formatDate(r.created_at)}</td>
                                    <td className="actions-cell">
                                        <button type="button" className="btn-compact btn-secondary" onClick={() => handleDownload(r)}>
                                            Download
                                        </button>
                                        <button type="button" className="btn-compact btn-danger" onClick={() => handleDelete(r.id, r.filename)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default History;