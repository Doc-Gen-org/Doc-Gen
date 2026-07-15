import { useState } from "react";
import type { ChangeEvent } from "react";
import type { DocumentTypeField } from "../../../../lib/api/documentTypesClient";
import { refineContributionText } from "../../../../lib/api/aiClient";
import { useToast } from "../../../../contexts/ToastContext";
import "./CreatorForm.css";

interface CreatorFormProps {
    fields: DocumentTypeField[];
    values: Record<string, unknown>;
    onChange: (updated: Record<string, unknown>) => void;
}

// Only this field gets the AI-refine button — it's the one field where
// "rough draft -> polished text" genuinely makes sense.
const AI_REFINABLE_FIELDS = ["contribution_summary"];

function CreatorForm({ fields, values, onChange }: CreatorFormProps) {
    const { showToast } = useToast();
    const [refiningField, setRefiningField] = useState<string | null>(null);

    const handleChange = (name: string, value: string) => {
        onChange({ ...values, [name]: value });
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

                    {field.type === "textarea" ? (
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