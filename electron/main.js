const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

// ─────────────────────────────────────────────────────────────
// Child processes we own the lifecycle of. Both MUST be killed
// when the app quits — an orphaned backend or Ollama process left
// running after the window closes is a silent, permanent RAM leak
// for whatever's left running in the background.
// ─────────────────────────────────────────────────────────────
let backendProcess = null;
let ollamaProcess = null;
let mainWindow = null;

const isDev = !app.isPackaged;

// In dev, everything (backend, Ollama) is assumed to already be
// running manually, same as it has been throughout development —
// this file does not change that workflow. Only a packaged build
// spawns and manages these processes itself.
const RESOURCES_DIR = isDev
    ? path.join(__dirname, "..", "resources")
    : process.resourcesPath;

const BACKEND_EXE = path.join(
    RESOURCES_DIR, "backend", process.platform === "win32" ? "docgen-backend.exe" : "docgen-backend"
);
const OLLAMA_EXE = path.join(
    RESOURCES_DIR, "ollama", process.platform === "win32" ? "ollama.exe" : "ollama"
);
const OLLAMA_MODELS_DIR = path.join(RESOURCES_DIR, "ollama", "models");
const TESSERACT_PATH = path.join(RESOURCES_DIR, "tesseract", "tesseract.exe");
const POPPLER_PATH = path.join(RESOURCES_DIR, "poppler", "bin");
const GTK3_BIN_DIR = path.join(RESOURCES_DIR, "gtk3-runtime", "bin");

const BACKEND_PORT = 8000;
const OLLAMA_PORT = 11434;

// ─────────────────────────────────────────────────────────────
// Checks whether something is already listening on a port,
// without waiting/retrying (unlike waitForServer below, which
// polls until ready). Used to decide whether to spawn our own
// copy of a service at all — many machines already have Ollama
// running permanently in the background (its installer sets it
// up to auto-start), and trying to spawn a second copy on the
// same port just fails outright rather than doing anything useful.
// ─────────────────────────────────────────────────────────────
function isPortOpen(port) {
    return new Promise((resolve) => {
        const req = http.get({ host: "127.0.0.1", port, timeout: 1000 }, () => {
            resolve(true);
        });
        req.on("error", () => resolve(false));
        req.on("timeout", () => {
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

// ─────────────────────────────────────────────────────────────
// Wait for an HTTP server to actually respond before moving on —
// spawning a process doesn't mean it's ready to accept requests
// yet, especially Ollama on a slower machine.
// ─────────────────────────────────────────────────────────────
function waitForServer(port, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();

        const tryOnce = () => {
            const req = http.get({ host: "127.0.0.1", port, timeout: 1500 }, () => {
                resolve();
            });
            req.on("error", () => {
                if (Date.now() - start > timeoutMs) {
                    reject(new Error(`Timed out waiting for port ${port}`));
                } else {
                    setTimeout(tryOnce, 500);
                }
            });
            req.end();
        };

        tryOnce();
    });
}

async function startBackend() {
    if (await isPortOpen(BACKEND_PORT)) {
        console.log(`[backend] something is already listening on port ${BACKEND_PORT} — using it instead of spawning a second copy`);
        return;
    }

    // The GTK3 runtime (Pango/Cairo/GDK-PixBuf) that WeasyPrint needs
    // isn't a Python package — it's native DLLs. On Windows they're
    // located via PATH, so prepend the bundled GTK3 bin folder here
    // rather than requiring it to be installed system-wide.
    const env = {
        ...process.env,
        TESSERACT_PATH,
        POPPLER_PATH,
        PATH: `${GTK3_BIN_DIR}${path.delimiter}${process.env.PATH || ""}`,
    };

    backendProcess = spawn(BACKEND_EXE, [], { env });

    backendProcess.stdout.on("data", (data) => console.log(`[backend] ${data}`));
    backendProcess.stderr.on("data", (data) => console.error(`[backend] ${data}`));
    backendProcess.on("exit", (code) => {
        console.log(`[backend] exited with code ${code}`);
        backendProcess = null;
    });

    return waitForServer(BACKEND_PORT);
}

async function startOllama() {
    if (await isPortOpen(OLLAMA_PORT)) {
        console.log(`[ollama] something is already listening on port ${OLLAMA_PORT} — using it instead of spawning a second copy`);
        return;
    }

    // OLLAMA_MODELS points Ollama at the pre-baked model directory
    // shipped inside the app instead of the user's default
    // ~/.ollama — no internet access or `ollama pull` needed at
    // runtime. Both tinyllama-po and llama3.2:3b must already be
    // present there at build time (see BUILD.md).
    const env = {
        ...process.env,
        OLLAMA_MODELS: OLLAMA_MODELS_DIR,
    };

    ollamaProcess = spawn(OLLAMA_EXE, ["serve"], { env });

    ollamaProcess.stdout.on("data", (data) => console.log(`[ollama] ${data}`));
    ollamaProcess.stderr.on("data", (data) => console.error(`[ollama] ${data}`));
    ollamaProcess.on("exit", (code) => {
        console.log(`[ollama] exited with code ${code}`);
        ollamaProcess = null;
    });

    return waitForServer(OLLAMA_PORT);
}

function stopChildProcesses() {
    // Only kill processes we actually spawned ourselves — if a port
    // was already occupied by something we didn't start (e.g. a
    // pre-existing system-wide Ollama service), backendProcess /
    // ollamaProcess stays null and there's nothing to kill here.
    // Never touch a process this app didn't launch.
    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }
    if (ollamaProcess) {
        ollamaProcess.kill();
        ollamaProcess = null;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false, // avoid a flash of blank white before content is ready
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.once("ready-to-show", () => mainWindow.show());

    if (isDev) {
        mainWindow.loadURL("http://localhost:5173");
    } else {
        mainWindow.loadFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
    }
}

app.whenReady().then(async () => {
    if (isDev) {
        // Dev mode: backend and Ollama are already running manually,
        // same workflow as always — just open the window.
        createWindow();
        return;
    }

    try {
        await Promise.all([startBackend(), startOllama()]);
    } catch (err) {
        console.error("Failed to start required services:", err);
        // Still open the window — the UI can surface a clear
        // "backend not reachable" error rather than the app
        // silently never appearing at all.
    }

    createWindow();
});

app.on("window-all-closed", () => {
    stopChildProcesses();
    if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
    stopChildProcesses();
});