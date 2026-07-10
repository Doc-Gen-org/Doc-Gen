import { useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import "./Dropzone.css";

interface DropzoneProps {
    file: File | null;
    onFileSelected: (file: File | undefined) => void;
}

function Dropzone({ file, onFileSelected }: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        onFileSelected(e.dataTransfer.files?.[0]);
    };

    const handleBrowseChange = (e: ChangeEvent<HTMLInputElement>) => {
        onFileSelected(e.target.files?.[0]);
    };

    return (
        <div
            className={isDragging ? "dropzone dragging" : "dropzone"}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleBrowseChange}
            />
            {file ? (
                <p className="file-name">{file.name}</p>
            ) : (
                <>
                    <p>Drag and drop a PDF here</p>
                    <p className="dropzone-or">or</p>
                    <button type="button" className="browse-button">
                        Browse files
                    </button>
                </>
            )}
        </div>
    );
}

export default Dropzone;