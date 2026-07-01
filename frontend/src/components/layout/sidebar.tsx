import { NavLink } from "react-router-dom";
import { routes } from "../../routes";
import "./Sidebar.css";

function Sidebar() {
    return (
        <nav className="sidebar">
            <div className="sidebar-header">Doc-Gen</div>
            <ul className="sidebar-nav">
                {routes.map((route) => (
                    <li key={route.path}>
                        <NavLink
                            to={route.path}
                            className={({ isActive }) =>
                                isActive ? "sidebar-link active" : "sidebar-link"
                            }
                            end
                        >
                            {route.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default Sidebar;