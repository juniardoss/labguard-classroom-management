@echo off
REM ============================================================
REM   LabGuard - Installer Agent Latar Belakang (PC Siswa)
REM   Versi .EXE : TIDAK perlu Python di PC siswa.
REM   Mendaftarkan agent sebagai Scheduled Task:
REM   - Jalan otomatis saat PC dinyalakan (startup)
REM   - Hak Administrator (SYSTEM) untuk edit file hosts
REM   - Tanpa jendela, tidak bisa ditutup siswa
REM ============================================================

REM --- Minta hak Administrator otomatis ---
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Meminta hak Administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

REM ====== KONFIGURASI ======
REM Nilai default (bisa langsung Enter). Ganti DEFAULT_IP jika perlu.
set "DEFAULT_IP=192.168.137.39"
set "DEFAULT_PORT=3000"

echo ============================================================
echo   KONFIGURASI ALAMAT PC GURU (SERVER)
echo ============================================================
echo   Masukkan IP LAN PC Guru. Lihat di dashboard: "SERVER ONLINE - IP: ..."
echo   Tekan ENTER saja untuk memakai nilai default.
echo.

set "SERVER_IP="
set /p "SERVER_IP=IP Server Guru [%DEFAULT_IP%]: "
if not defined SERVER_IP set "SERVER_IP=%DEFAULT_IP%"

set "SERVER_PORT="
set /p "SERVER_PORT=Port Server [%DEFAULT_PORT%]: "
if not defined SERVER_PORT set "SERVER_PORT=%DEFAULT_PORT%"
REM =========================

set SCRIPT_DIR=%~dp0
set TASK_NAME=LabGuardAgent

REM --- Cari LabGuardAgent.exe (di folder ini, atau di subfolder dist) ---
set "AGENT_EXE="
if exist "%SCRIPT_DIR%LabGuardAgent.exe" set "AGENT_EXE=%SCRIPT_DIR%LabGuardAgent.exe"
if not defined AGENT_EXE if exist "%SCRIPT_DIR%dist\LabGuardAgent.exe" set "AGENT_EXE=%SCRIPT_DIR%dist\LabGuardAgent.exe"

if not defined AGENT_EXE (
    echo [-] GAGAL: LabGuardAgent.exe tidak ditemukan.
    echo     Letakkan LabGuardAgent.exe di folder yang sama dengan file ini.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Menginstal LabGuard Agent sebagai layanan latar belakang
echo ============================================================
echo   Server Guru : %SERVER_IP%:%SERVER_PORT%
echo   Agent EXE   : %AGENT_EXE%
echo.

REM --- Buat Scheduled Task: jalan saat startup, hak tertinggi, tanpa jendela ---
schtasks /Create /TN "%TASK_NAME%" /TR "\"%AGENT_EXE%\" --silent --server %SERVER_IP% --port %SERVER_PORT%" /SC ONSTART /RU SYSTEM /RL HIGHEST /F

if %errorLevel% neq 0 (
    echo [-] Gagal membuat Scheduled Task.
    pause
    exit /b 1
)

echo [+] Scheduled Task "%TASK_NAME%" berhasil dibuat.

REM --- Langsung jalankan sekarang tanpa perlu restart ---
schtasks /Run /TN "%TASK_NAME%"
echo [+] Agent dijalankan di latar belakang.

echo.
echo ============================================================
echo   SELESAI. Agent kini berjalan diam-diam dan otomatis saat PC nyala.
echo   Log tersimpan di: C:\ProgramData\LabGuard\agent.log
echo   Untuk menghentikan: jalankan uninstall_agent.bat (sebagai admin)
echo ============================================================
pause
