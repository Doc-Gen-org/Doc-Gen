import "../SplashScreen/SplashScreen.css"

interface SplashScreenProps {
    status: "checking" | "ready" | "error";
}

function SplashScreen({status}: SplashScreenProps) {
    return (
        <div className="splash">
            <div className="splash-content">
                <h1 className="splash-title">Doc<span className="splash-accent">Gen</span></h1>
                <p className="splash-subtitle">Document Generation Suite</p>


                <div className="splash-status">
                    {status === "checking" && (
                        <>
                            <div className="splash-spinner" />
                            <p className="splash-message">Starting up...</p>
                        </>
                    )}

                    {status === "error" && (
                        <p className="splash-error">
                            Could not reach the backend. Make sure the server is running on port 8000.
                        </p>
                    )}
                </div>

            </div>

        </div>
    );
}

export default SplashScreen;