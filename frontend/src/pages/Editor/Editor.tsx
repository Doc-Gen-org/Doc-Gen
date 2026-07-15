import { useState, useEffect } from "react";
import { usePdfSelection } from "./hooks/usePdfSelection";
import { useExtract } from "./hooks/useExtract";
import { useGenerate } from "./hooks/useGenerate";
import Dropzone from "./components/Dropzone/Dropzone";
import SubmitButton from "./components/SubmitButton/SubmitButton";
import ExtractedFields from "./components/ExtractedFields/ExtractedFields";
import SendEmailPanel from "./components/SendEmailPanel/SendEmailPanel";
import { useToast } from "../../contexts/ToastContext";
import "./Editor.css";

function Editor() {
    const { file, selectFile } = usePdfSelection();
    const { extract, status: extractStatus, result, error: extractError } = useExtract();
    const { generate, status: generateStatus, error: generateError, documentId } = useGenerate();
    const { showToast } = useToast();

    const [editedFields, setEditedFields] =
        useState<Record<string, string | number | null>>({});

    useEffect(() => {
        if (result) {
            setEditedFields(result.extracted_fields);
        }
    }, [result]);

    useEffect(() => {
        if (extractStatus === "error" && extractError) showToast(extractError, "error");
    }, [extractStatus, extractError, showToast]);

    useEffect(() => {
        if (generateStatus === "success") showToast("Document generated and downloaded");
        if (generateStatus === "error" && generateError) showToast(generateError, "error");
    }, [generateStatus, generateError, showToast]);

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
            <p className="editor-subtitle">Upload a PDF or DOCX to extract and edit its fields.</p>

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
                    <h2 className="editor-section-title">Extracted Fields</h2>
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

                    {generateStatus === "success" && documentId && (
                        <SendEmailPanel documentId={documentId} />
                    )}
                </>
            )}
        </div>
    );
}

export default Editor;