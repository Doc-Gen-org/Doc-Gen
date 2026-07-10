import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import "./ExtractedFields.css";

interface ExtractedFieldsProps {
    fields: Record<string, string | number | null>;
    warnings: string[];
    onChange: (updated: Record<string, string | number | null>) => void;
}

function ExtractedFields({ fields, warnings, onChange }: ExtractedFieldsProps) {
    const [editedFields, setEditedFields] = useState(fields);

    useEffect(() => {
        setEditedFields(fields);
    }, [fields]);

    const handleChange = (key: string, value: string) => {
        const updated = { ...editedFields, [key]: value };
        setEditedFields(updated);
        onChange(updated);
    };

    const formatLabel = (key: string) =>
        key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <div className="extracted-fields">
            {warnings.length > 0 && (
                <div className="warnings">
                    {warnings.map((w, i) => (
                        <p key={i} className="warning-item">⚠ {w}</p>
                    ))}
                </div>
            )}

            <div className="fields-grid">
                {Object.entries(editedFields).map(([key, value]) => (
                    <div key={key} className="field-row">
                        <label className="field-label">{formatLabel(key)}</label>
                        <input
                            className="field-input"
                            type="text"
                            value={value ?? ""}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(key, e.target.value)
                            }
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ExtractedFields;