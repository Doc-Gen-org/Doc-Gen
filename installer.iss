; Inno Setup script for DocGen.
;
; This does NOT rebuild the app — it packages whatever's already in
; release\win-unpacked\ (produced by `npm run dist`) into a proper
; single-file installer. Run `npm run dist` first, every time, before
; compiling this.
;
; Compile with the Inno Setup Compiler (ISCC.exe), either via the
; Inno Setup Studio GUI (Open this file -> Build -> Compile) or from
; the command line:
;     "C:\Program Files\Inno Setup 6\ISCC.exe" installer.iss
;
; Output lands in installer_output\DocGen-Setup-1.0.0.exe

#define MyAppName "DocGen"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "ACA Technologies"
#define MyAppExeName "DocGen.exe"
#define SourceDir "release\win-unpacked"

[Setup]
AppId={{A2D6507A-B878-5028-8C91-BC28F322E8AA}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=installer_output
OutputBaseFilename=DocGen-Setup-{#MyAppVersion}
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
; No code signing certificate yet — this installer will be unsigned.
; Windows SmartScreen will show a one-time warning on first run;
; "More info -> Run anyway" gets past it.

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Files]
; Recursively pulls in everything electron-builder already produced —
; the app itself, plus every bundled resource (backend, Ollama +
; models, Tesseract, Poppler, GTK3 runtime). Inno Setup has no
; equivalent to the 32-bit mmap ceiling that broke the NSIS build,
; so the multi-GB size here isn't a problem the way it was there.
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; The app writes its database and generated files to %APPDATA%\DocGen
; (see backend/services/app_paths.py) — deliberately NOT deleted on
; uninstall, so a user's documents and settings survive a reinstall
; or upgrade. Only the installed program files themselves are removed
; by Inno Setup's normal uninstaller behavior; nothing extra needed here.