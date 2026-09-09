import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createIntern } from "../../lib/api/internsClient";
import "./AddIntern.css";

function AddIntern() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [institution, setInstitution] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !email.trim()) {
            setError("Name and email are required.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await createIntern({
                name: name.trim(),
                email: email.trim(),
                institution: institution.trim() || undefined,
                phone: phone.trim() || undefined,
            });
            navigate("/interns");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add intern.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="add-intern-page">
            <h1>Add Intern</h1>

            <div className="form-card">
                <div className="form-grid">
                    <div className="form-field">
                        <label>Intern Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Abhinav Ghatak"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="e.g. abhinav@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>Institution</label>
                        <input
                            type="text"
                            placeholder="e.g. Sample College / University"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>Phone</label>
                        <input
                            type="text"
                            placeholder="e.g. 9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                </div>

                {error && <p className="error-text">{error}</p>}

                <div className="form-actions">
                    <button type="button" onClick={() => navigate("/interns")}>
                        Cancel
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Saving..." : "Add Intern"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddIntern;