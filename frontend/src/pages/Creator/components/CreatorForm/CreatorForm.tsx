import { useState } from "react";
import type { ChangeEvent } from "react";
import type { DocumentTypeField } from "../../../../lib/api/documentTypesClient";
import { refineContributionText } from "../../../../lib/api/aiClient";
import { useToast } from "../../../../contexts/ToastContext";
import MultiDatePicker from "./MultiDatePicker/MultiDatePicker";
import "./CreatorForm.css";

interface CreatorFormProps {
    fields: DocumentTypeField[];
    values: Record<string, unknown>;
    onChange: (updated: Record<string, unknown>) => void;
}

const AI_REFINABLE_FIELDS = ["contribution_summary"];

// Fields that, when both present in a schema, trigger auto-calculating
// "total" = qty * rate. Currently only PO has all three fields.
const QTY_FIELD = "qty";
const RATE_FIELD = "rate";
const TOTAL_FIELD = "total";

function parseNumeric(value: unknown): number {
    if (typeof value !== "string" && typeof value !== "number") return NaN;
    const cleaned = String(value).replace(/,/g, "").trim();
    return cleaned === "" ? NaN : Number(cleaned);
}

function CreatorForm({ fields, values, onChange }: CreatorFormProps) {
    const { showToast } = useToast();
    const [refiningField, setRefiningField] = useState<string | null>(null);

    const hasAutoTotalFields =
        fields.some((f) => f.name === QTY_FIELD) &&
        fields.some((f) => f.name === RATE_FIELD) &&
        fields.some((f) => f.name === TOTAL_FIELD);

    const handleChange = (name: string, value: unknown) => {
        const updated = { ...values, [name]: value };

        if (hasAutoTotalFields && (name === QTY_FIELD || name === RATE_FIELD)) {
            const qty = parseNumeric(name === QTY_FIELD ? value : updated[QTY_FIELD]);
            const rate = parseNumeric(name === RATE_FIELD ? value : updated[RATE_FIELD]);
            if (!isNaN(qty) && !isNaN(rate)) {
                updated[TOTAL_FIELD] = (qty * rate).toFixed(2);
            }
        }

        onChange(updated);
    };

    const handleRefine = async (fieldName: string) => {
        const currentText = (values[fieldName] as string) ?? "";
        if (!currentText.trim()) {
            showToast("Type a rough draft first, then click Refine.", "error");
            return;
        }

        setRefiningField(fieldName);
        try {
            const refined = await refineContributionText(currentText);
            handleChange(fieldName, refined);
            showToast("Text refined");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Refine failed.", "error");
        } finally {
            setRefiningField(null);
        }
    };

    return (
        <div className="creator-form">
            {fields.map((field) => (
                <div key={field.name} className="creator-field-row">
                    <div className="creator-field-label-row">
                        <label className="creator-field-label">
                            {field.label}
                            {field.required && <span className="required-star"> *</span>}
                            {field.name === TOTAL_FIELD && hasAutoTotalFields && (
                                <span className="auto-calc-hint"> (auto-calculated)</span>
                            )}
                        </label>
                        {AI_REFINABLE_FIELDS.includes(field.name) && (
                            <button
                                type="button"
                                className="ai-refine-button"
                                onClick={() => handleRefine(field.name)}
                                disabled={refiningField === field.name}
                            >
                                {refiningField === field.name ? "Refining..." : "✨ Refine with AI"}
                            </button>
                        )}
                    </div>

                    {field.type === "multidate" ? (
                        <MultiDatePicker
                            value={(values[field.name] as string[]) ?? []}
                            onChange={(dates) => handleChange(field.name, dates)}
                        />
                    ) : field.type === "textarea" ? (
                        <textarea
                            className="creator-field-input"
                            placeholder={field.placeholder}
                            value={(values[field.name] as string) ?? ""}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                handleChange(field.name, e.target.value)
                            }
                        />
                    ) : (
                        <input
                            className="creator-field-input"
                            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                            placeholder={field.placeholder}
                            value={(values[field.name] as string) ?? ""}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleChange(field.name, e.target.value)
                            }
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export default CreatorForm;