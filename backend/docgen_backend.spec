# -*- mode: python ; coding: utf-8 -*-
#
# PyInstaller spec for the DocGen backend. Builds a single standalone
# executable that Electron's main.js spawns directly — no separate
# Python install required on the end user's machine.
#
# Build with (from the backend/ folder):
#     pyinstaller docgen_backend.spec
#
# Output: dist/docgen-backend/docgen-backend(.exe)
# That whole dist/docgen-backend/ folder is what gets copied into
# Electron's packaged resources/backend/ folder (see BUILD.md).

import sys
from PyInstaller.utils.hooks import collect_all, collect_submodules

block_cipher = None

hiddenimports = []
datas = []
binaries = []

# weasyprint, uvicorn, and pydantic all rely on dynamic/plugin-style
# imports that PyInstaller's static analysis can't see on its own —
# collect_all pulls in their submodules and any data files they need.
for pkg in ("weasyprint", "uvicorn", "pydantic", "fastapi", "docxtpl", "pdf2image", "pytesseract"):
    pkg_datas, pkg_binaries, pkg_hiddenimports = collect_all(pkg)
    datas += pkg_datas
    binaries += pkg_binaries
    hiddenimports += pkg_hiddenimports

# uvicorn's protocol/loop backends are selected dynamically at
# runtime and are frequently missed by static analysis specifically
hiddenimports += collect_submodules("uvicorn")
hiddenimports += [
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "multipart",
    "email_validator",
]

# Bundle the Jinja2 templates as read-only data — services/app_paths.py
# looks for these relative to sys._MEIPASS when frozen.
datas += [("templates", "templates")]

a = Analysis(
    ["main.py"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="docgen-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,  # keep a console window in early builds so errors are visible; set False once stable
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="docgen-backend",
)