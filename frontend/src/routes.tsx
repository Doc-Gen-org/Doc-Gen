import type {ReactElement} from "react";
import Editor from "./pages/Editor/Editor";

export interface AppRoute {
    path: string;
    label: string;
    element: ReactElement;
}

export const routes: AppRoute[] = [
    {
        path: "/",
        label: "Editor",
        element: <Editor/>,
    },
    // Future pages get added here — one line adds both the route and the nav link
];