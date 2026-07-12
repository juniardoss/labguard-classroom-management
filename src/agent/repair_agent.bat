@echo off
setlocal EnableDelayedExpansion
REM ============================================================
REM  LabGuard - Repair Agent Reconnect
REM  Memperbaiki agent PC Siswa agar:
REM   1. Memakai NAMA KOMPUTER PC Guru (kebal ganti IP / DHCP)
REM   2. Membuat ulang Scheduled Task auto-start saat boot
REM
REM  WAJIB dijalankan sebagai ADMINISTRATOR (klik kanan > Run as administrator)
REM ============================================================

REM --- Pastikan hak Administrator ---
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Skrip ini WAJIB dijalankan sebagai Administrator.
    echo     Klik kanan file ini ^> "Run as administrator".
    pause
    exit /b 1
)

set "INSTALL_DIR=%PROGRAMDATA%\LabGuard"
set "INSTALL_EXE=%INSTALL_DIR%\LabGuardAgent.exe"
set "CONFIG=%INSTALL_DIR%\config.json"

if not exist "%INSTALL_EXE%" (
    echo [X] LabGuardAgent.exe belum terpasang di %INSTALL_DIR%
    echo     Jalankan dulu installer .exe utama satu kali, lalu ulangi skrip ini.
    pause
    exit /b 1
)

echo ============================================================
echo   LabGuard - Repair Agent Reconnect
echo ============================================================
echo.
echo Masukkan NAMA KOMPUTER PC Guru (BUKAN IP, agar kebal ganti IP).
echo Cari nama itu di PC Guru dengan perintah:  hostname
echo Boleh juga isi IP statis bila PC Guru memakai IP tetap.
echo.
set /p GURU="Nama/IP PC Guru: "
if "%GURU%"=="" (
    echo [X] Nama server tidak boleh kosong.
    pause
    exit /b 1
)

set /p PORT="Port server [default 3000]: "
if "%PORT%"=="" set "PORT=3000"

REM --- Tulis config.json (pakai PowerShell agar JSON rapi) ---
echo.
echo [*] Menulis konfigurasi ke %CONFIG% ...
powershell -NoProfile -Command ^
  "$c=[ordered]@{ server_url='http://%GURU%:%PORT%'; server_ip='%GURU%'; server_port='%PORT%'; heartbeat_interval_seconds=5 }; $c | ConvertTo-Json | Set-Content -Encoding UTF8 '%CONFIG%'"
if %errorlevel% neq 0 (
    echo [X] Gagal menulis config.json
    pause
    exit /b 1
)
echo [+] Server disetel ke: http://%GURU%:%PORT%

REM --- Buat ulang Scheduled Task ---
echo.
echo [*] Membuat ulang Scheduled Task "LabGuardAgent" ...
schtasks /Delete /TN "LabGuardAgent" /F >nul 2>&1
schtasks /Create /TN "LabGuardAgent" /TR "\"%INSTALL_EXE%\" --silent" /SC ONSTART /RU SYSTEM /RL HIGHEST /F
if %errorlevel% neq 0 (
    echo [X] Gagal membuat Scheduled Task.
    pause
    exit /b 1
)

REM --- Izinkan jalan saat pakai baterai (laptop) ---
powershell -NoProfile -Command ^
  "Set-ScheduledTask -TaskName 'LabGuardAgent' -Settings (New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries) | Out-Null"

REM --- Jalankan sekarang juga ---
echo [*] Menjalankan agent sekarang ...
schtasks /Run /TN "LabGuardAgent" >nul 2>&1

echo.
echo ============================================================
echo   [+] SELESAI.
echo   - Agent kini menunjuk ke: %GURU%:%PORT%
echo   - Auto-start saat PC dinyalakan: AKTIF (ONSTART/SYSTEM)
echo   - Cek log di: %INSTALL_DIR%\agent.log
echo ============================================================
pause
endlocal
