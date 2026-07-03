import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/layout";

import SplashScreen from "./components/SplashScreen/SplashScreen.tsx";
import { useHealthCheck }  from "./hooks/useHealthCheck.ts"

import { routes } from "./routes";

function App() {
    const status = useHealthCheck();
    if (status !== "ready" ) {
        return <SplashScreen status={status}/>
    }

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