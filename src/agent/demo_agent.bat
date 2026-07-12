@echo off
REM ============================================================
REM   LabGuard - Agent Mode DEMO (console terlihat)
REM   Untuk presentasi: jalankan agent interaktif, auto minta admin.
REM   Jangan tutup jendela ini selama demo agar PC tetap terbaca.
REM ============================================================

REM --- Minta hak Administrator otomatis (wajib untuk edit hosts) ---
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Meminta hak Administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ============================================================
echo            LABGUARD AGENT - MODE DEMO PRESENTASI
echo ============================================================
echo.
echo  PETUNJUK:
echo   - Saat diminta "IP Server Guru", tekan ENTER (pakai default localhost)
echo     ATAU ketik IP LAN PC Guru jika demo dari PC siswa terpisah.
echo   - Saat diminta "Port", tekan ENTER (default 3000).
echo   - Biarkan jendela ini TERBUKA selama presentasi.
echo   - Tekan Ctrl+C untuk berhenti (blokir otomatis dibersihkan).
echo.
echo ============================================================
echo.

python labguard_agent.py

echo.
echo [Agent berhenti]
pause
