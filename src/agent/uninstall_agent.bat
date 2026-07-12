@echo off
REM ============================================================
REM   LabGuard - Uninstaller Agent Latar Belakang (PC Siswa)
REM   Versi .EXE : tidak butuh Python.
REM   Menghentikan agent, menghapus Scheduled Task, dan
REM   membersihkan blokir dari file hosts.
REM ============================================================

REM --- Minta hak Administrator otomatis ---
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Meminta hak Administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set TASK_NAME=LabGuardAgent

echo.
echo ============================================================
echo   Menghapus LabGuard Agent dari PC ini
echo ============================================================

REM --- Hentikan & hapus Scheduled Task ---
schtasks /End /TN "%TASK_NAME%" >nul 2>&1
schtasks /Delete /TN "%TASK_NAME%" /F
echo [+] Scheduled Task dihapus.

REM --- Matikan proses agent yang masih jalan ---
taskkill /F /IM LabGuardAgent.exe >nul 2>&1

REM --- Bersihkan blok LabGuard dari file hosts (via PowerShell, tanpa Python) ---
powershell -NoProfile -Command "$h=\"$env:windir\System32\drivers\etc\hosts\"; if(Test-Path $h){$out=@();$in=$false;foreach($l in (Get-Content $h)){if($l -match 'LABGUARD START'){$in=$true;continue};if($l -match 'LABGUARD END'){$in=$false;continue};if(-not $in){$out+=$l}};Set-Content -Path $h -Value $out -Encoding ASCII;ipconfig /flushdns | Out-Null; Write-Host '[+] Blok hosts dibersihkan.'}"

echo.
echo [+] SELESAI. Agent telah dihapus dari PC ini.
pause
