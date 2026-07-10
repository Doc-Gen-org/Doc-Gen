import { useState } from "react";

export function usePdfSelection() {
    const [file, setFile] = useState<File | null>(null);

    const selectFile = (selected: File | undefined) => {
        if (!selected) return;
        if (selected.type !== "application/pdf") {
            alert("Please select a PDF file.");
            return;
        }
        setFile(selected);
    };

    return { file, selectFile };
}