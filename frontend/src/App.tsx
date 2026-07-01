import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/layout";
import { routes } from "./routes";

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route element={<Layout />}>
                    {routes.map((route) => (
                        <Route key={route.path} path={route.path} element={route.element} />
                    ))}
                </Route>
            </Routes>
        </HashRouter>
    );
}

export default App;