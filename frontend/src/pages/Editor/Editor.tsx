import { useState, useEffect } from "react";
import { usePdfSelection } from "./hooks/usePdfSelection";
import { useExtract } from "./hooks/useExtract";
import { useGenerate } from "./hooks/useGenerate";
import Dropzone from "./components/Dropzone/Dropzone";
import SubmitButton from "./components/SubmitButton/SubmitButton";
import ExtractedFields from "./components/ExtractedFields/ExtractedFields";
import "./Editor.css";

function Editor() {
    const { file, selectFile } = usePdfSelection();
    const { extract, status: extractStatus, result, error: extractError } = useExtract();
    const { generate, status: generateStatus, error: generateError } = useGenerate();

    const [editedFields, setEditedFields] =
        useState<Record<string, string | number | null>>({});

    // initialise edited fields whenever a new extraction result arrives
    useEffect(() => {
        if (result) {
            setEditedFields(result.extracted_fields);
        }
    }, [result]);

    const handleExtract = () => {
        if (!file) return;
        extract(file);
    };

    const handleGenerate = () => {
        if (!result) return;
        generate({
            document_type: result.suggested_output_type || "po",
            company_id: result.suggested_company_id || "",
            output_format: "pdf",
            fields: editedFields,
        });
    };

    const isExtracting = extractStatus === "loading";
    const isGenerating = generateStatus === "loading";
    const hasResult = extractStatus === "success" && result !== null;

    return (
        <div className="editor">
            <h1>Upload Document</h1>
            <p>Upload a PDF or DOCX to extract and edit its fields.</p>

            <Dropzone file={file} onFileSelected={selectFile} />

            {file && (
                <SubmitButton
                    onClick={handleExtract}
                    disabled={isExtracting}
                    label={isExtracting ? "Extracting..." : "Extract Fields"}
                />
            )}

            {extractStatus === "error" && extractError && (
                <p className="error-text">{extractError}</p>
            )}

            {hasResult && (
                <>
                    <h3>Extracted Fields</h3>
                    <p>Review and correct the fields below, then generate your document.</p>

                    <ExtractedFields
                        fields={result.extracted_fields}
                        warnings={result.confidence_warnings}
                        onChange={setEditedFields}
                    />

                    <SubmitButton
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        label={isGenerating ? "Generating..." : "Generate Document"}
                    />

                    {generateStatus === "error" && generateError && (
                        <p className="error-text">{generateError}</p>
                    )}

                    {generateStatus === "success" && (
                        <p className="success-text">Document downloaded successfully.</p>
                    )}
                </>
            )}
        </div>
    );
}

export default Editor;