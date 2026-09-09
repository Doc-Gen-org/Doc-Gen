import { lazy } from "react";

export const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
export const Creator = lazy(() => import("./pages/Creator/Creator"));
export const Trainers = lazy(() => import("./pages/Trainers/Trainers"));
export const AddTrainer = lazy(() => import("./pages/Trainers/AddTrainer"));
export const MouCompanies = lazy(() => import("./pages/MouCompanies/MouCompanies"));
export const AddMouCompany = lazy(() => import("./pages/MouCompanies/AddMouCompany"));
export const Interns = lazy(() => import("./pages/Interns/Interns"));
export const AddIntern = lazy(() => import("./pages/Interns/AddIntern"));
export const Finance = lazy(() => import("./pages/Finance/Finance"));
export const History = lazy(() => import("./pages/History/History"));
export const Warnings = lazy(() => import("./pages/Warnings/Warnings"));
export const Settings = lazy(() => import("./pages/Settings/Settings"));
export const Passwords = lazy(() => import("./pages/Passwords/Passwords"));