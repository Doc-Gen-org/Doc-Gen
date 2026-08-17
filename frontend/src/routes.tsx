import type {ReactElement} from "react";
import Dashboard from "./pages/Dashboard/Dashboard";
import Creator from "./pages/Creator/Creator";
import Trainers from "./pages/Trainers/Trainers";
import AddTrainer from "./pages/Trainers/AddTrainer";
import MouCompanies from "./pages/MouCompanies/MouCompanies";
import AddMouCompany from "./pages/MouCompanies/AddMouCompany";
import Interns from "./pages/Interns/Interns";
import AddIntern from "./pages/Interns/AddIntern";
import Finance from "./pages/Finance/Finance";
import History from "./pages/History/History";
import Warnings from "./pages/Warnings/Warnings";
import Settings from "./pages/Settings/Settings";
import Passwords from "./pages/Passwords/Passwords";

export interface AppRoute {
    path: string;
    label: string;
    element: ReactElement;
    hideFromNav?: boolean;
}

export const routes: AppRoute[] = [
    { path: "/", label: "Dashboard", element: <Dashboard/> },
    { path: "/creator", label: "Creator", element: <Creator/> },
    { path: "/trainers", label: "Trainers", element: <Trainers/> },
    { path: "/trainers/new", label: "Add Trainer", element: <AddTrainer/>, hideFromNav: true },
    { path: "/mou-companies", label: "MOU Companies", element: <MouCompanies/> },
    { path: "/mou-companies/new", label: "Add MOU Company", element: <AddMouCompany/>, hideFromNav: true },
    { path: "/interns", label: "Interns", element: <Interns/> },
    { path: "/interns/new", label: "Add Intern", element: <AddIntern/>, hideFromNav: true },
    { path: "/finance", label: "Finance", element: <Finance/> },
    { path: "/passwords", label: "Passwords", element: <Passwords/> },
    { path: "/history", label: "History", element: <History/> },
    { path: "/warnings", label: "Warnings", element: <Warnings/> },
    { path: "/settings", label: "Settings", element: <Settings/> },
];