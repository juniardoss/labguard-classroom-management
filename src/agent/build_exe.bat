@echo off
REM ============================================================
REM   LabGuard - Build Ulang Agent .EXE (untuk developer)
REM   Menghasilkan: dist\LabGuardAgent.exe
REM   Jalankan ini setelah mengubah labguard_agent.py
REM ============================================================

cd /d "%~dp0"

echo ============================================================
echo   Build LabGuardAgent.exe dengan PyInstaller
echo ============================================================

REM --- Pastikan Python tersedia ---
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo [-] Python tidak ditemukan di PATH. Install Python dari python.org dulu.
    pause
    exit /b 1
)

REM --- Pastikan PyInstaller terpasang ---
python -c "import PyInstaller" >nul 2>&1
if %errorLevel% neq 0 (
    echo [*] PyInstaller belum ada. Menginstal...
    python -m pip install pyinstaller
    if %errorLevel% neq 0 (
        echo [-] Gagal menginstal PyInstaller.
        pause
        exit /b 1
    )
)

echo [*] Membangun exe... mohon tunggu.
python -m PyInstaller --onefile --noconsole --uac-admin --name LabGuardAgent ^
    --distpath "dist" --workpath "build" --specpath "." ^
    "labguard_agent.py"

if %errorLevel% neq 0 (
    echo [-] Build GAGAL.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   BERHASIL. Hasil: %~dp0dist\LabGuardAgent.exe
echo   Copy exe ini bersama install_agent.bat ke PC siswa.
echo ============================================================
pause
