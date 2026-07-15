import { useState, useEffect } from "react";
import { useDocumentTypes } from "./hooks/useDocumentTypes";
import { useCreatorGenerate } from "./hooks/useCreatorGenerate";
import CreatorForm from "./components/CreatorForm/CreatorForm";
import SendEmailPanel from "../Editor/components/SendEmailPanel/SendEmailPanel";
import { useToast } from "../../contexts/ToastContext";
import "./Creator.css";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function Creator() {
    const { types, loading, error: typesError } = useDocumentTypes();
    const { generate, status, error: generateError, documentId } = useCreatorGenerate();
    const { showToast } = useToast();

    const [selectedTypeId, setSelectedTypeId] = useState<string>("");
    const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
    const [validationError, setValidationError] = useState<string | null>(null);

    const buildDefaults = (typeId: string, typeList = types): Record<string, unknown> => {
        const type = typeList.find((t) => t.id === typeId);
        if (!type) return {};
        const defaults: Record<string, unknown> = {};
        for (const field of type.fields) {
            if (field.defaultToday) {
                defaults[field.name] = todayISO();
            }
        }
        return defaults;
    };

    useEffect(() => {
        if (types.length > 0 && !selectedTypeId) {
            setSelectedTypeId(types[0].id);
            setFieldValues(buildDefaults(types[0].id, types));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [types, selectedTypeId]);

    useEffect(() => {
        if (status === "success") showToast("Document generated and downloaded");
        if (status === "error" && generateError) showToast(generateError, "error");
    }, [status, generateError, showToast]);

    const selectedType = types.find((t) => t.id === selectedTypeId);

    const handleTypeChange = (id: string) => {
        setSelectedTypeId(id);
        setFieldValues(buildDefaults(id));
        setValidationError(null);
    };

    const handleGenerate = () => {
        if (!selectedTypeId || !selectedType) return;

        const missing = selectedType.fields.filter((field) => {
            if (!field.required) return false;
            const value = fieldValues[field.name];
            return value === undefined || value === null || String(value).trim() === "";
        });

        if (missing.length > 0) {
            const message = `Please fill in the following required field${missing.length > 1 ? "s" : ""}: ${missing
                .map((f) => f.label)
                .join(", ")}`;
            setValidationError(message);
            showToast(message, "error");
            return;
        }

        setValidationError(null);
        generate(selectedTypeId, fieldValues);
    };

    const isGenerating = status === "loading";

    return (
        <div className="creator">
            <h1>Create Document</h1>
            <p className="creator-subtitle">Fill in the fields below to generate a document manually — no upload needed.</p>

            {loading && <p>Loading document types...</p>}
            {typesError && <p className="error-text">{typesError}</p>}

            {!loading && types.length > 0 && (
                <>
                    <label className="creator-type-label">Document Type</label>
                    <select
                        className="creator-type-select"
                        value={selectedTypeId}
                        onChange={(e) => handleTypeChange(e.target.value)}
                    >
                        {types.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.label}
                            </option>
                        ))}
                    </select>

                    {selectedType && (
                        <CreatorForm
                            fields={selectedType.fields}
                            values={fieldValues}
                            onChange={setFieldValues}
                        />
                    )}

                    <button type="button" onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? "Generating..." : "Generate Document"}
                    </button>

                    {validationError && <p className="error-text">{validationError}</p>}

                    {status === "error" && generateError && (
                        <p className="error-text">{generateError}</p>
                    )}

                    {status === "success" && (
                        <p className="success-text">Document downloaded successfully.</p>
                    )}

                    {status === "success" && documentId && (
                        <SendEmailPanel documentId={documentId} />
                    )}
                </>
            )}
        </div>
    );
}

export default Creator;