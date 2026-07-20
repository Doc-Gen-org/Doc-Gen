import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import "./ExtractedFields.css";

interface ExtractedFieldsProps {
    fields: Record<string, string | number | null>;
    warnings: string[];
    onChange: (updated: Record<string, string | number | null>) => void;
}

// Mirrors Creator's auto-total behavior: when both qty and rate are
// present in the field set (currently only true for PO), typing into
// either one recalculates total automatically.
const QTY_FIELD = "qty";
const RATE_FIELD = "rate";
const TOTAL_FIELD = "total";

function parseNumeric(value: string | number | null): number {
    if (typeof value !== "string" && typeof value !== "number") return NaN;
    const cleaned = String(value).replace(/,/g, "").trim();
    return cleaned === "" ? NaN : Number(cleaned);
}

function ExtractedFields({ fields, warnings, onChange }: ExtractedFieldsProps) {
    const [editedFields, setEditedFields] = useState(fields);

    useEffect(() => {
        setEditedFields(fields);
    }, [fields]);

    const hasAutoTotalFields =
        QTY_FIELD in editedFields && RATE_FIELD in editedFields && TOTAL_FIELD in editedFields;

    const handleChange = (key: string, value: string) => {
        const updated = { ...editedFields, [key]: value };

        if (hasAutoTotalFields && (key === QTY_FIELD || key === RATE_FIELD)) {
            const qty = parseNumeric(key === QTY_FIELD ? value : updated[QTY_FIELD]);
            const rate = parseNumeric(key === RATE_FIELD ? value : updated[RATE_FIELD]);
            if (!isNaN(qty) && !isNaN(rate)) {
                updated[TOTAL_FIELD] = (qty * rate).toFixed(2);
            }
        }

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
                        <label className="field-label">
                            {formatLabel(key)}
                            {key === TOTAL_FIELD && hasAutoTotalFields && (
                                <span className="auto-calc-hint"> (auto-calculated)</span>
                            )}
                        </label>
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