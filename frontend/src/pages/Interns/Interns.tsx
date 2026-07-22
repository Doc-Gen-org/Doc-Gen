import { useState } from "react";
import { Link } from "react-router-dom";
import { useInterns } from "./hooks/useInterns";
import { sendOfferLetter, sendCertificate, getPreviewUrl } from "../../lib/api/internsClient";
import GenerateOfferModal from "./components/GenerateOfferModal/GenerateOfferModal";
import GenerateCertificateModal from "./components/GenerateCertificateModal/GenerateCertificateModal";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";
import "./Interns.css";

function Interns() {
    const { interns, loading, error, removeIntern, deletingId, reload } = useInterns();
    const { showToast } = useToast();
    const confirm = useConfirm();

    const [offerModalFor, setOfferModalFor] = useState<{ id: number; name: string } | null>(null);
    const [certModalFor, setCertModalFor] = useState<{ id: number; name: string; institution: string | null } | null>(null);
    const [sendingOfferFor, setSendingOfferFor] = useState<number | null>(null);
    const [sendingCertFor, setSendingCertFor] = useState<number | null>(null);
    const [search, setSearch] = useState("");

    const filteredInterns = interns.filter((i) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            i.name.toLowerCase().includes(q) ||
            i.email.toLowerCase().includes(q) ||
            i.intern_code.toLowerCase().includes(q)
        );
    });

    const handleSendOffer = async (internId: number) => {
        setSendingOfferFor(internId);
        try {
            await sendOfferLetter(internId);
            showToast("Offer letter sent");
            reload();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to send offer letter.", "error");
        } finally {
            setSendingOfferFor(null);
        }
    };

    const handleSendCertificate = async (internId: number) => {
        setSendingCertFor(internId);
        try {
            await sendCertificate(internId);
            showToast("Certificate sent");
            reload();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to send certificate.", "error");
        } finally {
            setSendingCertFor(null);
        }
    };

    const handleDelete = async (internId: number, name: string) => {
        const confirmed = await confirm(`Delete intern "${name}"?`, "Delete Intern");
        if (confirmed) {
            removeIntern(internId);
            showToast("Intern deleted");
        }
    };

    return (
        <div className="interns">
            <div className="interns-header">
                <div>
                    <h1>Interns</h1>
                    <p className="interns-subtitle">Offer letters and completion certificates for interns.</p>
                </div>
                <Link to="/interns/new">
                    <button type="button">+ Add Intern</button>
                </Link>
            </div>
            <p className="hint-text">
                Generate the offer letter or certificate for an intern, preview it, then send it — all from this page.
            </p>

            <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, or intern ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {loading && <p>Loading...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && interns.length === 0 && <p className="empty-text">No interns yet.</p>}
            {!loading && interns.length > 0 && filteredInterns.length === 0 && (
                <p className="empty-text">No interns match "{search}".</p>
            )}

            {!loading && filteredInterns.length > 0 && (
                <div className="card table-card">
                    <table className="interns-table">
                        <thead>
                            <tr>
                                <th>Intern ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Institution</th>
                                <th>Offer Letter</th>
                                <th>Certificate</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInterns.map((i) => (
                                <tr key={i.id}>
                                    <td><span className="ref-code">{i.intern_code}</span></td>
                                    <td>{i.name}</td>
                                    <td>{i.email}</td>
                                    <td>{i.institution || "—"}</td>

                                    <td>
                                        <div className="doc-cell">
                                            <span className={i.offer_letter_document ? "status-dot dot-on" : "status-dot"}>
                                                {i.offer_letter_document ? "✓ Generated" : "Not generated"}
                                            </span>
                                            <div className="doc-cell-actions">
                                                <button
                                                    type="button"
                                                    className="btn-compact"
                                                    onClick={() => setOfferModalFor({ id: i.id, name: i.name })}
                                                >
                                                    {i.offer_letter_document ? "Regenerate" : "Generate"}
                                                </button>
                                                {i.offer_letter_document && (
                                                    <a
                                                        href={getPreviewUrl(i.id, i.offer_letter_document.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="doc-preview-link"
                                                    >
                                                        Preview
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        <div className="doc-cell">
                                            <span className={i.certificate_document ? "status-dot dot-on" : "status-dot"}>
                                                {i.certificate_document ? "✓ Generated" : "Not generated"}
                                            </span>
                                            <div className="doc-cell-actions">
                                                <button
                                                    type="button"
                                                    className="btn-compact"
                                                    onClick={() => setCertModalFor({ id: i.id, name: i.name, institution: i.institution })}
                                                >
                                                    {i.certificate_document ? "Regenerate" : "Generate"}
                                                </button>
                                                {i.certificate_document && (
                                                    <a
                                                        href={getPreviewUrl(i.id, i.certificate_document.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="doc-preview-link"
                                                    >
                                                        Preview
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="actions-cell">
                                        <button
                                            type="button"
                                            className="btn-compact btn-secondary"
                                            onClick={() => handleSendOffer(i.id)}
                                            disabled={!i.offer_letter_document || sendingOfferFor === i.id}
                                            title={!i.offer_letter_document ? "Generate the offer letter first" : "Send Offer Letter"}
                                        >
                                            {sendingOfferFor === i.id ? "Sending..." : "Send Offer Letter"}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-compact btn-secondary"
                                            onClick={() => handleSendCertificate(i.id)}
                                            disabled={!i.certificate_document || sendingCertFor === i.id}
                                            title={!i.certificate_document ? "Generate the certificate first" : "Send Certificate"}
                                        >
                                            {sendingCertFor === i.id ? "Sending..." : "Send Certificate"}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-compact btn-danger"
                                            onClick={() => handleDelete(i.id, i.name)}
                                            disabled={deletingId === i.id}
                                        >
                                            {deletingId === i.id ? "Deleting..." : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {offerModalFor && (
                <GenerateOfferModal
                    internId={offerModalFor.id}
                    internName={offerModalFor.name}
                    onClose={() => setOfferModalFor(null)}
                    onGenerated={() => {
                        showToast("Offer letter generated");
                        reload();
                    }}
                />
            )}

            {certModalFor && (
                <GenerateCertificateModal
                    internId={certModalFor.id}
                    internName={certModalFor.name}
                    internInstitution={certModalFor.institution}
                    onClose={() => setCertModalFor(null)}
                    onGenerated={() => {
                        showToast("Certificate generated");
                        reload();
                    }}
                />
            )}
        </div>
    );
}

export default Interns;