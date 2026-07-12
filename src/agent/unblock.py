# -*- coding: utf-8 -*-
"""
LabGuard - Pembersih Blokir Darurat
-----------------------------------
Jalankan skrip ini SEBAGAI ADMINISTRATOR di PC yang websitenya masih terblokir.
Skrip akan menghapus blok LabGuard dari file hosts dan flush DNS.
"""

import os
import sys
import subprocess
import ctypes

HOSTS_MARKER_START = "# LABGUARD START - JANGAN DIEDIT MANUAL"
HOSTS_MARKER_END = "# LABGUARD END"


def is_admin():
    try:
        if os.name == 'nt':
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        return os.getuid() == 0
    except Exception:
        return False


def flush_dns():
    try:
        if os.name == 'nt':
            subprocess.run(["ipconfig", "/flushdns"], capture_output=True)
            print("[+] DNS cache berhasil diflush.")
    except Exception as e:
        print(f"[!] Gagal flush DNS: {e}")


def clear_hosts():
    hosts_path = r"C:\Windows\System32\drivers\etc\hosts" if os.name == 'nt' else "/etc/hosts"

    if not os.path.exists(hosts_path):
        print(f"[-] File hosts tidak ditemukan di {hosts_path}")
        return False

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
        print("[+] Blok LabGuard berhasil dihapus. File hosts kembali normal.")
        flush_dns()
    else:
        print("[i] Tidak ada blok LabGuard di file hosts. Mungkin sudah bersih.")
    return True


def main():
    print("=" * 50)
    print("        LABGUARD - PEMBERSIH BLOKIR DARURAT")
    print("=" * 50)

    if not is_admin():
        print("\n[!] Skrip TIDAK berjalan sebagai Administrator.")
        print("    Tutup jendela ini, klik kanan file ini / Command Prompt,")
        print("    pilih 'Run as administrator', lalu jalankan lagi.")
        input("\nTekan Enter untuk keluar...")
        sys.exit(1)

    clear_hosts()
    print("\n[+] Selesai. Coba buka kembali website yang tadi terblokir.")
    input("Tekan Enter untuk keluar...")


if __name__ == "__main__":
    main()
