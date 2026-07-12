# -*- coding: utf-8 -*-
"""
LabGuard Student Agent
----------------------
Skrip ini berjalan di PC siswa untuk mendengarkan instruksi dari PC Guru (Server).
Secara otomatis memblokir situs web di daftar blacklist menggunakan edit file hosts.

HAK AKSES ADMINISTRATOR DIPERLUKAN UNTUK MENULIS KE FILE HOSTS.
"""

import os
import sys
import time
import socket
import json
import urllib.request
import urllib.error
import subprocess
import ctypes
import tempfile


def _get_arg(flag):
    """Ambil nilai argumen CLI, misal --server 192.168.1.100"""
    if flag in sys.argv:
        idx = sys.argv.index(flag)
        if idx + 1 < len(sys.argv):
            return sys.argv[idx + 1].strip()
    return None


def _boot_log(msg):
    """Log paling awal ke path absolut (independen dari env), untuk diagnosa startup."""
    try:
        os.makedirs(r"C:\ProgramData\LabGuard", exist_ok=True)
        with open(r"C:\ProgramData\LabGuard\boot.log", "a", encoding="utf-8", errors="ignore") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    except Exception:
        pass


def _setup_silent_logging():
    """Alihkan output ke file log saat berjalan di latar belakang (tanpa konsol)."""
    try:
        base = os.environ.get("PROGRAMDATA", tempfile.gettempdir())
        log_dir = os.path.join(base, "LabGuard")
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "agent.log")
        # buffering=1 => line-buffered agar log langsung tersimpan
        logf = open(log_path, "a", buffering=1, encoding="utf-8", errors="ignore")
        sys.stdout = logf
        sys.stderr = logf
    except Exception:
        pass

# Alamat IP dan Port Server PC Guru
DEFAULT_SERVER_IP = "localhost"  # Ganti dengan IP LAN PC Guru saat deployment riil, misal "192.168.1.100"
DEFAULT_SERVER_PORT = "3000"

HOSTS_MARKER_START = "# LABGUARD START - JANGAN DIEDIT MANUAL"
HOSTS_MARKER_END = "# LABGUARD END"

def get_local_ip():
    """Mendapatkan IP LAN aktif dari PC ini."""
    try:
        # Koneksi dummy ke IP luar untuk memicu socket memilih interface LAN yang aktif
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        # Fallback jika tidak ada koneksi internet/LAN aktif
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"

def is_admin():
    """Memeriksa apakah skrip berjalan dengan hak akses Administrator/Root."""
    try:
        if os.name == 'nt':
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        else:
            return os.getuid() == 0
    except Exception:
        return False

def flush_dns():
    """Melakukan flush DNS cache agar perubahan file hosts langsung berefek di browser."""
    try:
        if os.name == 'nt':
            subprocess.run(["ipconfig", "/flushdns"], capture_output=True, check=True)
            print("[+] DNS Cache berhasil diflush (ipconfig /flushdns)")
        else:
            # macOS / Linux fallback
            if os.path.exists("/usr/bin/dscacheutil"):
                subprocess.run(["dscacheutil", "-flushcache"], capture_output=True)
            elif os.path.exists("/usr/sbin/service"):
                subprocess.run(["sudo", "service", "network-manager", "restart"], capture_output=True)
            print("[+] DNS Cache berhasil diflush")
    except Exception as e:
        print(f"[!] Gagal flush DNS: {e}")

def update_hosts(blacklist):
    """Menambahkan daftar blacklist ke file hosts Windows."""
    try:
        if os.name == 'nt':
            hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
        else:
            hosts_path = "/etc/hosts"

        if not os.path.exists(hosts_path):
            print(f"[-] File hosts tidak ditemukan di {hosts_path}")
            return False

        # Baca file hosts asli
        with open(hosts_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()

        # Bersihkan entri LabGuard yang lama
        new_lines = []
        inside_block = False
        for line in lines:
            if HOSTS_MARKER_START in line:
                inside_block = True
                continue
            if HOSTS_MARKER_END in line:
                inside_block = False
                continue
            if not inside_block:
                new_lines.append(line)

        # Buat entri pemblokiran baru
        new_block = []
        new_block.append(f"{HOSTS_MARKER_START}\n")
        new_block.append(f"# Pemblokiran aktif oleh LabGuard - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        for domain in blacklist:
            domain_clean = domain.strip().lower()
            if domain_clean:
                # Blokir domain utama
                new_block.append(f"127.0.0.1 {domain_clean}\n")
        new_block.append(f"{HOSTS_MARKER_END}\n")

        # Tulis kembali ke file hosts
        with open(hosts_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines + new_block)

        print("[+] Sukses memperbarui file hosts dengan daftar blacklist!")
        flush_dns()
        return True
    except PermissionError:
        print("\n[-] ERROR: Akses ditolak saat mengedit file hosts.")
        print("    Skrip harus dijalankan sebagai ADMINISTRATOR (Run as Administrator)!")
        return False
    except Exception as e:
        print(f"[-] Error saat menulis ke hosts: {e}")
        return False

def clear_hosts():
    """Menghapus blok pemblokiran LabGuard dari file hosts."""
    try:
        if os.name == 'nt':
            hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
        else:
            hosts_path = "/etc/hosts"

        if not os.path.exists(hosts_path):
            return True

        with open(hosts_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()

        new_lines = []
        inside_block = False
        found_block = False
        for line in lines:
            if HOSTS_MARKER_START in line:
                inside_block = True
                found_block = True
                continue
            if HOSTS_MARKER_END in line:
                inside_block = False
                continue
            if not inside_block:
                new_lines.append(line)

        if found_block:
            with open(hosts_path, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            print("[+] Berhasil mencabut semua pemblokiran (file hosts dikembalikan normal).")
            flush_dns()
        return True
    except PermissionError:
        print("\n[-] ERROR: Akses ditolak saat membersihkan file hosts.")
        print("    Skrip harus dijalankan sebagai ADMINISTRATOR!")
        return False
    except Exception as e:
        print(f"[-] Error saat membersihkan hosts: {e}")
        return False

def run_installer():
    """Menginstal agent ke sistem jika dijalankan di luar folder instalasi resmi."""
    # PENTING: jika ada --silent (dijalankan oleh Scheduled Task/SYSTEM), ini adalah
    # mode AGENT, bukan installer. Jangan pernah buka GUI di sesi SYSTEM (tanpa desktop).
    if "--silent" in sys.argv:
        return False

    # Installer hanya untuk file .exe hasil PyInstaller
    if not getattr(sys, 'frozen', False):
        return False

    install_dir = os.path.join(os.environ.get("PROGRAMDATA", r"C:\ProgramData"), "LabGuard")
    install_exe = os.path.join(install_dir, "LabGuardAgent.exe")
    config_path = os.path.join(install_dir, "config.json")

    # Jika sudah berjalan dari folder instalasi resmi, jalankan agent secara normal
    if sys.executable.lower() == install_exe.lower():
        return False

    # Mode Installer
    if not is_admin():
        # --uac-admin manifest harusnya sudah meng-elevate otomatis
        return False

    import shutil
    import tkinter as tk
    from tkinter import messagebox, simpledialog

    # Sembunyikan window utama tkinter
    root = tk.Tk()
    root.withdraw()

    # Prompt untuk input IP Server Guru menggunakan GUI Dialog
    server_ip = simpledialog.askstring(
        "LabGuard Installer", 
        "Masukkan IP Address PC Guru (Server):", 
        initialvalue="192.168.1.100"
    )
    if not server_ip:
        messagebox.showwarning("LabGuard Installer", "Instalasi dibatalkan. IP Server diperlukan.")
        return True

    server_port = simpledialog.askstring(
        "LabGuard Installer",
        "Masukkan Port Server:",
        initialvalue="3000"
    )
    if not server_port:
        server_port = "3000"

    install_log = os.path.join(install_dir, "install.log")

    def _log(msg):
        try:
            with open(install_log, "a", encoding="utf-8", errors="ignore") as lf:
                lf.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
        except Exception:
            pass

    try:
        # Buat direktori tujuan
        os.makedirs(install_dir, exist_ok=True)
        _log(f"Mulai instalasi. server={server_ip}:{server_port}")

        # Salin file executable dirinya sendiri ke ProgramData
        shutil.copy2(sys.executable, install_exe)
        _log(f"Copy exe -> {install_exe} OK")

        # Simpan konfigurasi ke config.json
        config_data = {
            "server_url": f"http://{server_ip}:{server_port}",
            "server_ip": server_ip,
            "server_port": server_port,
            "heartbeat_interval_seconds": 5
        }
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=4)
        _log("Tulis config.json OK")

        # Hapus task lama jika ada untuk menghindari error duplikat
        subprocess.run('schtasks /Delete /TN "LabGuardAgent" /F', shell=True, capture_output=True)

        # Buat Scheduled Task baru (SYSTEM, ONSTART, HIGHEST, tersembunyi)
        task_cmd = f'schtasks /Create /TN "LabGuardAgent" /TR "\\"{install_exe}\\" --silent" /SC ONSTART /RU SYSTEM /RL HIGHEST /F'
        r1 = subprocess.run(task_cmd, shell=True, capture_output=True, text=True)
        _log(f"CREATE rc={r1.returncode} out={r1.stdout.strip()} err={r1.stderr.strip()}")
        if r1.returncode != 0:
            raise RuntimeError(f"schtasks CREATE gagal: {r1.stderr.strip() or r1.stdout.strip()}")

        # Ubah konfigurasi agar bisa berjalan di baterai (laptop)
        ps_cmd = 'powershell -NoProfile -Command "Set-ScheduledTask -TaskName \'LabGuardAgent\' -Settings (New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries)"'
        r_ps = subprocess.run(ps_cmd, shell=True, capture_output=True, text=True)
        _log(f"SET BATTERY SETTINGS rc={r_ps.returncode} out={r_ps.stdout.strip()} err={r_ps.stderr.strip()}")

        # Jalankan task secara langsung saat ini juga
        r2 = subprocess.run('schtasks /Run /TN "LabGuardAgent"', shell=True, capture_output=True, text=True)
        _log(f"RUN rc={r2.returncode} out={r2.stdout.strip()} err={r2.stderr.strip()}")

        messagebox.showinfo(
            "LabGuard Installer",
            "Instalasi Berhasil!\n\nLabGuard Agent kini berjalan diam-diam di latar belakang dan akan "
            "otomatis aktif setiap kali komputer siswa dinyalakan."
        )
    except Exception as e:
        _log(f"ERROR: {e}")
        messagebox.showerror(
            "LabGuard Installer",
            f"Gagal melakukan instalasi:\n{e}\n\nDetail tersimpan di:\n{install_log}"
        )

    return True

def main():
    _boot_log(f"START exe={sys.executable} argv={sys.argv[1:]} admin={is_admin()} frozen={getattr(sys, 'frozen', False)}")

    # 0. Jalankan Installer jika dijalankan pertama kali / di luar folder instalasi
    if run_installer():
        _boot_log("Mode INSTALLER selesai, keluar.")
        sys.exit(0)

    _boot_log("Lanjut ke mode AGENT (polling).")

    # Mode silent: berjalan di latar belakang tanpa jendela/konsol (via pythonw + Task Scheduler)
    silent = "--silent" in sys.argv or sys.stdin is None

    # Load konfigurasi dari file jika ada (terutama jika dijalankan oleh Scheduled Task)
    install_dir = os.path.join(os.environ.get("PROGRAMDATA", r"C:\ProgramData"), "LabGuard")
    config_path = os.path.join(install_dir, "config.json")
    
    loaded_ip = DEFAULT_SERVER_IP
    loaded_port = DEFAULT_SERVER_PORT
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                cfg = json.load(f)
                loaded_ip = cfg.get("server_ip", loaded_ip)
                loaded_port = cfg.get("server_port", loaded_port)
        except Exception:
            pass

    cli_server_ip = _get_arg("--server") or loaded_ip
    cli_server_port = _get_arg("--port") or loaded_port

    if silent:
        _setup_silent_logging()
        print(f"\n===== [{time.strftime('%Y-%m-%d %H:%M:%S')}] LabGuard Agent START (silent) =====")

    print("======================================================")
    print("             LABGUARD STUDENT AGENT v1.0              ")
    print("     Sistem Pemblokiran Website Lab Komputer          ")
    print("======================================================")

    # 1. Validasi Hak Administrator
    if not is_admin():
        print("\n[!] PERINGATAN KRITIS:")
        print("    Skrip tidak berjalan sebagai ADMINISTRATOR!")
        print("    Pemblokiran website tidak akan berfungsi tanpa hak akses ini.")
        print("    Silakan tutup jendela ini, buka Command Prompt (cmd) / PowerShell")
        print("    sebagai Administrator, lalu jalankan kembali skrip ini.")
        print("======================================================")
        if not silent:
            input("Tekan Enter untuk keluar...")
        sys.exit(1)

    print("[+] Status Akses: ADMINISTRATOR TERVERIFIKASI")

    # 2. Identitas PC Siswa
    pc_name = socket.gethostname()
    local_ip = get_local_ip()
    print(f"[+] Nama PC     : {pc_name}")
    print(f"[+] IP LAN PC   : {local_ip}")

    # 3. Konfigurasi Server IP
    print("\n--- KONFIGURASI ALAMAT SERVER PC GURU ---")
    if silent:
        # Tanpa konsol: ambil dari argumen CLI, atau pakai default bawaan skrip
        server_ip = cli_server_ip or DEFAULT_SERVER_IP
        server_port = cli_server_port or DEFAULT_SERVER_PORT
    else:
        server_ip = input(f"Masukkan IP Server Guru [Default: {DEFAULT_SERVER_IP}]: ").strip()
        if not server_ip:
            server_ip = DEFAULT_SERVER_IP

        server_port = input(f"Masukkan Port Server [Default: {DEFAULT_SERVER_PORT}]: ").strip()
        if not server_port:
            server_port = DEFAULT_SERVER_PORT

    server_url = f"http://{server_ip}:{server_port}"
    print(f"[+] Server Terpilih: {server_url}")
    print("======================================================")
    print("[+] Memulai polling ke server... Tekan Ctrl+C untuk berhenti.")
    print("======================================================")

    last_session_active = None
    last_blacklist = []
    
    # Track if we are currently blocking
    is_currently_blocking = False

    while True:
        try:
            # Polling data dari server
            url = f"{server_url}/api/agent/poll?pc_name={urllib.parse.quote(pc_name)}&ip={urllib.parse.quote(local_ip)}&status={'Blocked' if is_currently_blocking else 'Online'}"
            
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'LabGuardAgent/1.0', 'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req, timeout=4) as response:
                data = json.loads(response.read().decode('utf-8'))
                
            session_active = data.get("session_active", False)
            blacklist = data.get("blacklist", [])
            target_all = data.get("target_all", True)
            is_targeted = data.get("is_targeted", True)

            # Skenario 1: Sesi aktif dan PC ini termasuk target pemblokiran
            should_block = session_active and is_targeted

            if should_block:
                # Perlu mengupdate hosts jika:
                # - Sesi baru saja diaktifkan (sebelumnya tidak aktif)
                # - Daftar blacklist berubah
                # - Memang belum terblokir secara lokal
                if not is_currently_blocking or blacklist != last_blacklist:
                    print(f"\n[{time.strftime('%H:%M:%S')}] [SESI AKTIF] Menerapkan pemblokiran...")
                    print(f"[*] Daftar situs diblokir ({len(blacklist)}): {', '.join(blacklist)}")
                    success = update_hosts(blacklist)
                    if success:
                        is_currently_blocking = True
                        last_blacklist = blacklist.copy()
                    else:
                        print("[-] Gagal menerapkan pemblokiran.")
            else:
                # Skenario 2: Sesi tidak aktif atau PC ini dilepas dari target pemblokiran
                if is_currently_blocking:
                    print(f"\n[{time.strftime('%H:%M:%S')}] [SESI DIAKHIRI / DIKECUALIKAN] Mengembalikan kondisi hosts...")
                    success = clear_hosts()
                    if success:
                        is_currently_blocking = False
                        last_blacklist = []
            
            # Print feedback status secara periodik di konsol
            sys.stdout.write(f"\r[{time.strftime('%H:%M:%S')}] Polling Server OK. Status Sesi: {'AKTIF' if session_active else 'NON-AKTIF'}, Memblokir: {'YA' if is_currently_blocking else 'TIDAK'}")
            sys.stdout.flush()

        except urllib.error.URLError as e:
            # Server offline atau tidak terjangkau
            sys.stdout.write(f"\r[{time.strftime('%H:%M:%S')}] [KONEKSI GAGAL] Tidak dapat menghubungi PC Guru ({e.reason}). Mencoba lagi...")
            sys.stdout.flush()
            # Jika server mati, demi keamanan kembalikan hosts ke normal dulu agar siswa tidak terputus selamanya jika pelajaran selesai mendadak
            if is_currently_blocking:
                print("\n[!] Hubungan dengan server terputus. Mencabut blokir demi keamanan...")
                clear_hosts()
                is_currently_blocking = False
                last_blacklist = []
                
        except Exception as e:
            sys.stdout.write(f"\r[{time.strftime('%H:%M:%S')}] [ERROR] Terjadi kesalahan: {e}")
            sys.stdout.flush()

        time.sleep(5)  # Polling setiap 5 detik

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[-] Mematikan Agent LabGuard...")
        # Bersihkan hosts jika agent dimatikan secara manual oleh admin
        if is_admin():
            clear_hosts()
        print("[+] Selesai. Sampai jumpa!")
        sys.exit(0)
