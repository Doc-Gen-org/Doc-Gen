import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMouCompany } from "../../lib/api/mouCompaniesClient";
import "./AddMouCompany.css";

function AddMouCompany() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [signatoryName, setSignatoryName] = useState("");
    const [signatoryTitle, setSignatoryTitle] = useState("");
    const [email, setEmail] = useState("");
    const [pan, setPan] = useState("");
    const [trainerContact, setTrainerContact] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError("Company name is required.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await createMouCompany({
                name: name.trim(),
                address: address.trim() || undefined,
                signatory_name: signatoryName.trim() || undefined,
                signatory_title: signatoryTitle.trim() || undefined,
                email: email.trim() || undefined,
                pan: pan.trim() || undefined,
                trainer_contact: trainerContact.trim() || undefined,
            });
            navigate("/mou-companies");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add company.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="add-mou-company-page">
            <h1>Add MOU Company</h1>

            <div className="form-card">
                <div className="form-grid">
                    <div className="form-field">
                        <label>Company Name</label>
                        <input type="text" placeholder="e.g. iamneo Edutech Private Limited" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Email</label>
                        <input type="email" placeholder="e.g. senthil@iamneo.ai" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Signatory Name</label>
                        <input type="text" placeholder="e.g. Senthil Kumar T P" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Signatory Title</label>
                        <input type="text" placeholder="e.g. President" value={signatoryTitle} onChange={(e) => setSignatoryTitle(e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>PAN</label>
                        <input type="text" placeholder="e.g. ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value)} />
                    </div>

                    <div className="form-field">
                        <label>Trainer Aadhaar / Phone</label>
                        <input type="text" placeholder="e.g. 9482 7475 6969" value={trainerContact} onChange={(e) => setTrainerContact(e.target.value)} />
                    </div>

                    <div className="form-field form-field-full">
                        <label>Address</label>
                        <input type="text" placeholder="e.g. 1202, 3rd Floor, SPA SRR Towers, Avinashi Road..." value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                </div>

                {error && <p className="error-text">{error}</p>}

                <div className="form-actions">
                    <button type="button" onClick={() => navigate("/mou-companies")}>Cancel</button>
                    <button type="button" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Saving..." : "Add Company"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddMouCompany;