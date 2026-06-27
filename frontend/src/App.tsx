import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState<string>("checking backend...");

  useEffect(() => {
    fetch("http://localhost:8000/health")
        .then((res) => res.json())
        .then((data) => setStatus(`Backend says: ${data.status}`))
        .catch(() => setStatus("Backend not reachable"));
  }, []);

  return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">DocGen</h1>
          <p className="text-slate-400">{status}</p>
        </div>
      </div>
  );
}

export default App;