import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { routes } from "../../routes";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const visibleRoutes = routes.filter((route) => !route.hideFromNav);

    return (
        <nav className="sidebar">
            <div className="sidebar-header">
                <img src="/aca-logo.png" alt="ACA Technologies" className="sidebar-logo" />
                <div className="sidebar-title">
                    <span className="sidebar-title-main">DocGen</span>
                    <span className="sidebar-title-sub">ACA Technologies</span>
                </div>
            </div>
            <ul className="sidebar-nav">
                {visibleRoutes.map((route) => {
                    const isActive = location.pathname === route.path;
                    return (
                        <li key={route.path} className="sidebar-item">
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active-pill"
                                    className="sidebar-pill"
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                            )}
                            <NavLink
                                to={route.path}
                                className={isActive ? "sidebar-link active" : "sidebar-link"}
                                end
                            >
                                {route.label}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export default Sidebar;