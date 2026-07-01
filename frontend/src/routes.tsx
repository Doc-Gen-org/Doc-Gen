import type {ReactElement} from "react";
import PdfConvert from "./pages/pdfConvert/pdfConvert";

export interface AppRoute {
    path: string;
    label: string;
    element: ReactElement;
}

export const routes: AppRoute[] = [
    {
        path: "/",
        label: "Upload PDF",
        element: <PdfConvert />,
    },
    // Future pages get added here — one line adds both the route and the nav link
];