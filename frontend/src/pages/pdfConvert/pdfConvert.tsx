import { usePdfSelection } from "./hooks/usePdfSelection.ts";
import { useExtract } from "./hooks/useExtract.ts";
import Dropzone from "./components/Dropzone.tsx";
import SubmitButton from "./components/SubmitButton.tsx";
import Extractedzone from "./components/Extractedzone.tsx";
import "./pdfConvert.css";

function PdfConvert() {
    const { file, selectFile } = usePdfSelection();
    const { extract, status, extractedInformation, error } = useExtract();

    const handleSubmit = () => {
        if (!file) return;
        extract(file)
    };


    return (
        <div className="pdf-convert">
            <h2>Upload PDF</h2>
            <p>Select or drop a PDF to send it for processing.</p>

            <Dropzone file={file} onFileSelected={selectFile} />

            {file && <SubmitButton
                onClick={handleSubmit}
            />}

            <br/>
            <br/>
            <h2>Extracted Content </h2>
            {status == "loading" && <p> processing...</p>}
            {status == "error" && <p className="error-text">{error}</p>}
            {status == "success" && extractedInformation && (
                <>
                    <p>Extracted file contents.</p>
                    <Extractedzone text = {extractedInformation.text}/>
                </>
            )}

            <br/>
            <br/>

        </div>

    );
}

export default PdfConvert;