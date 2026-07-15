import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrainer } from "../../lib/api/trainersClient";
import "./AddTrainer.css";

function AddTrainer() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [pan, setPan] = useState("");
    const [aadhaar, setAadhaar] = useState("");
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
            await createTrainer({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
                pan: pan.trim() || undefined,
                aadhaar: aadhaar.trim() || undefined,
            });
            navigate("/trainers");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add trainer.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="add-trainer-page">
            <h1>Add Trainer</h1>

            <div className="form-card">
                <div className="form-grid">
                    <div className="form-field">
                        <label>Trainer Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Anil"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="e.g. anil@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                    <div className="form-field">
                        <label>PAN</label>
                        <input
                            type="text"
                            placeholder="e.g. ABCDE1234F"
                            value={pan}
                            onChange={(e) => setPan(e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>Aadhaar</label>
                        <input
                            type="text"
                            placeholder="e.g. 1234 5678 9012"
                            value={aadhaar}
                            onChange={(e) => setAadhaar(e.target.value)}
                        />
                    </div>
                </div>

                {error && <p className="error-text">{error}</p>}

                <div className="form-actions">
                    <button type="button" onClick={() => navigate("/trainers")}>
                        Cancel
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Saving..." : "Add Trainer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddTrainer;