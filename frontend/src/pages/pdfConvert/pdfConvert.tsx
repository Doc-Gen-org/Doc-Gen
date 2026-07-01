import { usePdfSelection } from "./hooks/usePdfSelection.ts";
import Dropzone from "./components/Dropzone.tsx";
import SubmitButton from "./components/SubmitButton.tsx";
import "./pdfConvert.css";

function PdfConvert() {
    const { file, selectFile } = usePdfSelection();

    const handleSubmit = () => {
        // backend call goes here later
    };

    return (
        <div className="pdf-convert">
            <h1>Upload PDF</h1>
            <p>Select or drop a PDF to send it for processing.</p>

            <Dropzone file={file} onFileSelected={selectFile} />

            {file && <SubmitButton onClick={handleSubmit} />}

            <br/>
            <h1>Extracted Content </h1>
            <p>Extracted file contents.</p>


        </div>

    );
}

export default PdfConvert;