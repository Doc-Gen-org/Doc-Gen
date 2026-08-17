const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

let backendProcess = null;
let ollamaProcess = null;
let mainWindow = null;

const isDev = !app.isPackaged;

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
const PLAYWRIGHT_BROWSERS_PATH = path.join(RESOURCES_DIR, "playwright-browsers");

const BACKEND_PORT = 8000;
const OLLAMA_PORT = 11434;

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

    const env = {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH,
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
        show: false,
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
        createWindow();
        return;
    }

    try {
        await Promise.all([startBackend(), startOllama()]);
    } catch (err) {
        console.error("Failed to start required services:", err);
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