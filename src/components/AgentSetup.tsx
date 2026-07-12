import React, { useState, useEffect } from 'react';
import {
  Download,
  FileCode,
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Server,
  MousePointerClick,
  Copy,
  Check,
  Monitor,
  Terminal,
  Globe,
  Flame,
} from 'lucide-react';

export default function AgentSetup() {
  const [role, setRole] = useState<'guru' | 'siswa'>('guru');
  const [serverIp, setServerIp] = useState<string>('192.168.1.100');
  const [serverPort, setServerPort] = useState<string>('3000');
  const [serverName, setServerName] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Ambil IP & nama komputer PC Guru (server) untuk ditampilkan di panduan.
  useEffect(() => {
    fetch('/api/server-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ip) setServerIp(data.ip);
        if (data?.port) setServerPort(String(data.port));
        if (data?.hostname) setServerName(data.hostname);
      })
      .catch(() => {});
  }, []);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Kotak perintah kecil dengan tombol salin
  const CommandBox = ({ cmd, k }: { cmd: string; k: string }) => (
    <div className="flex items-center justify-between gap-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700">
      <code className="font-mono text-[12px] text-emerald-300 overflow-x-auto whitespace-nowrap">{cmd}</code>
      <button
        onClick={() => copyText(cmd, k)}
        className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition bg-slate-700/60 px-2 py-1 rounded-md flex-shrink-0"
      >
        {copiedKey === k ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copiedKey === k ? 'Tersalin' : 'Salin'}
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileCode className="h-5 w-5 text-blue-600" />
          Panduan Instalasi LabGuard
        </h2>
        <p className="text-sm text-slate-500">
          Pasang aplikasi di <span className="font-semibold text-slate-600">PC Guru</span> terlebih dahulu (sebagai server),
          lalu pasang Agent di setiap <span className="font-semibold text-slate-600">PC Siswa</span>.
        </p>
      </div>

      {/* Role Toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1 text-sm font-bold max-w-md">
        <button
          id="role-guru-btn"
          onClick={() => setRole('guru')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
            role === 'guru' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Monitor className="h-4 w-4" />
          PC Guru (Server)
        </button>
        <button
          id="role-siswa-btn"
          onClick={() => setRole('siswa')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition ${
            role === 'siswa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCode className="h-4 w-4" />
          PC Siswa (Agent)
        </button>
      </div>

      {/* ============================ PC GURU (SERVER) ============================ */}
      {role === 'guru' && (
        <div className="space-y-6">
          <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5">
            <span className="text-xs font-bold text-blue-700 tracking-wider uppercase block mb-1">
              🖥️ SETUP PC GURU (SERVER PUSAT)
            </span>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              PC Guru menjalankan dashboard sekaligus server pusat yang mengatur seluruh PC siswa. Cukup dipasang di
              <span className="font-semibold"> satu PC saja</span> (PC guru/operator lab). Membutuhkan <span className="font-semibold">Node.js</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Langkah */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase block">
                🛠️ Langkah Instalasi (PC Guru)
              </span>
              <ol className="space-y-4">
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    <p className="font-semibold text-slate-700">Instal Node.js</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Unduh <span className="font-bold">Node.js versi LTS</span> dari{' '}
                      <a href="https://nodejs.org" target="_blank" rel="noopener" className="text-blue-600 font-semibold underline">nodejs.org</a>,
                      lalu instal dengan pengaturan default (Next → Next → Install).
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    <p className="font-semibold text-slate-700">Salin folder aplikasi</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Letakkan folder proyek LabGuard di PC Guru, misalnya di{' '}
                      <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">C:\LabGuard-Server</code>.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">3</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Terminal className="h-4 w-4 text-blue-600" /> Instal dependensi (sekali saja)
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">
                      Buka folder tersebut, klik kanan → <span className="font-bold">Open in Terminal</span>, lalu jalankan:
                    </p>
                    <CommandBox cmd="npm install" k="npm-install" />
                  </div>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">4</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700">Jalankan server</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">
                      Masih di terminal yang sama, jalankan perintah berikut. Biarkan jendela ini terbuka selama pelajaran.
                    </p>
                    <CommandBox cmd="npm run dev" k="npm-dev" />
                  </div>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">5</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-blue-600" /> Buka dashboard
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">
                      Buka browser di PC Guru dan akses alamat:
                    </p>
                    <CommandBox cmd="http://localhost:3000" k="localhost" />
                  </div>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">✓</span>
                  <div>
                    <p className="font-semibold text-slate-700">Catat IP untuk PC Siswa</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Alamat IP di bawah ini adalah yang harus dimasukkan siswa saat memasang Agent. Lanjut ke tab{' '}
                      <span className="font-bold text-blue-600">PC Siswa (Agent)</span> untuk memasang di komputer siswa.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Info & catatan teknis PC Guru */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase block">
                ⚙️ Alamat Server &amp; Catatan Penting
              </span>

              {/* Panel IP server */}
              <div className="bg-slate-900 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="h-4.5 w-4.5 text-blue-400" />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-300">Alamat Server PC Guru Ini</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 rounded-xl p-3.5 border border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">IP Address</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold text-emerald-400">{serverIp}</span>
                      <button onClick={() => copyText(serverIp, 'ip')} className="text-slate-300 hover:text-white transition bg-slate-700/60 p-1 rounded-md">
                        {copiedKey === 'ip' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3.5 border border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Port</p>
                    <span className="font-mono text-base font-bold text-blue-300">{serverPort}</span>
                  </div>
                </div>
                {serverName && (
                  <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                    💡 Nama komputer: <span className="font-mono text-emerald-300">{serverName}</span> — boleh dipakai siswa
                    sebagai ganti IP (anti ganti-IP saat restart).
                  </p>
                )}
              </div>

              {/* Firewall */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 leading-relaxed">
                <span className="font-bold flex items-center gap-1.5 mb-1.5">
                  <Flame className="h-4 w-4 text-amber-600" /> Izinkan Firewall (agar PC siswa bisa terhubung)
                </span>
                <p className="mb-2">
                  Jika PC siswa tidak bisa terhubung, buka <span className="font-bold">PowerShell sebagai Administrator</span> di PC Guru, jalankan:
                </p>
                <CommandBox
                  cmd={`netsh advfirewall firewall add rule name="LabGuard" dir=in action=allow protocol=TCP localport=${serverPort}`}
                  k="firewall"
                />
              </div>

              {/* Catatan menjaga server tetap hidup */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold block mb-0.5 text-slate-700">Penting</span>
                Server harus tetap berjalan (jendela terminal terbuka) selama pelajaran berlangsung. Menutup terminal atau
                mematikan PC Guru akan menghentikan pemblokiran — Agent siswa otomatis membuka blokir demi keamanan.
                PC Guru &amp; PC Siswa juga harus berada di jaringan LAN yang sama.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================ PC SISWA (AGENT) ============================ */}
      {role === 'siswa' && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Cukup 3 langkah. Jalankan satu file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">LabGuardAgent.exe</code>,
            masukkan IP PC Guru, selesai. <span className="font-semibold text-slate-600">Tidak perlu menginstal Python.</span>
          </p>

          {/* Download Action Box */}
          <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-700 tracking-wider uppercase block">📥 UNDUH PROGRAM SIAP PAKAI</span>
              <h3 className="font-bold text-slate-800">Program Agent LabGuard (<code>LabGuardAgent.exe</code>)</h3>
              <p className="text-xs text-slate-600 max-w-xl">
                File tunggal yang langsung bisa dijalankan di PC siswa (Windows). Program memasang dirinya sendiri secara
                otomatis dan berjalan diam-diam di latar belakang setiap kali PC dinyalakan.
              </p>
            </div>
            <a
              id="download-agent-btn"
              href="/api/agent/download-exe"
              download="LabGuardAgent.exe"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-100/50 whitespace-nowrap"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              Unduh LabGuardAgent.exe
            </a>
          </div>

          {/* Info Alamat Server */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-4.5 w-4.5 text-blue-400" />
              <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                Alamat PC Guru (Server) — masukkan nilai ini saat diminta
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-xl p-3.5 border border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">IP Address Server</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-lg font-bold text-emerald-400">{serverIp}</span>
                  <button
                    onClick={() => copyText(serverIp, 'ip-siswa')}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition bg-slate-700/60 px-2 py-1 rounded-md"
                  >
                    {copiedKey === 'ip-siswa' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === 'ip-siswa' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-3.5 border border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Port</p>
                <span className="font-mono text-lg font-bold text-blue-300">{serverPort}</span>
              </div>
            </div>
            {serverName && (
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                💡 <span className="font-semibold text-slate-300">Tips anti ganti-IP:</span> Anda juga boleh mengetik{' '}
                <span className="font-mono text-emerald-300">{serverName}</span> (nama komputer PC Guru) sebagai ganti IP.
                Cara ini tetap bekerja walau IP server berubah setelah restart.
              </p>
            )}
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase block">🛠️ Langkah Instalasi (PC Siswa)</span>
              <ol className="space-y-3">
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    <p className="font-semibold text-slate-700">Unduh &amp; letakkan filenya</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Klik tombol <span className="font-bold">Unduh LabGuardAgent.exe</span> di atas, lalu simpan di lokasi
                      yang mudah ditemukan, misalnya folder <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">Downloads</code> atau Desktop.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <MousePointerClick className="h-4 w-4 text-blue-600" />
                      Klik kanan → <span className="text-blue-700">Run as administrator</span>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Klik kanan file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">LabGuardAgent.exe</code>,
                      pilih <span className="font-bold">"Run as administrator"</span>. Saat muncul jendela konfirmasi Windows (UAC),
                      klik <span className="font-bold">Yes</span>. Wajib sebagai admin agar bisa memblokir website.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Server className="h-4 w-4 text-blue-600" />
                      Masukkan IP Address PC Guru
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sebuah kotak dialog akan muncul menanyakan <span className="font-bold">IP Address PC Guru (Server)</span>.
                      Ketik <span className="font-mono font-bold text-emerald-600">{serverIp}</span>, klik OK, lalu isi Port{' '}
                      <span className="font-mono font-bold text-blue-600">{serverPort}</span> (biasanya sudah terisi) dan klik OK lagi.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">✓</span>
                  <div>
                    <p className="font-semibold text-slate-700">Selesai — berjalan otomatis</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Muncul pesan <span className="font-bold">"Instalasi Berhasil"</span>. Sejak saat ini Agent berjalan diam-diam
                      di latar belakang dan <span className="font-bold">otomatis aktif setiap PC dinyalakan</span> — tanpa perlu
                      dijalankan ulang. PC siswa akan langsung muncul di Dashboard.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Technical Validation & Safety */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase block">⚙️ Detail Teknis &amp; Keamanan</span>
              <div className="space-y-3">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 text-xs text-amber-800 leading-relaxed">
                  <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block mb-0.5">Kenapa Harus "Run as Administrator"?</span>
                    Program memblokir website dengan memodifikasi file hosts Windows (<code className="font-mono text-[10.5px]">C:\Windows\System32\drivers\etc\hosts</code>),
                    yang berada di folder sistem terproteksi. Hanya proses dengan hak Administrator yang boleh mengeditnya.
                  </div>
                </div>
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold block mb-1 text-slate-700">Apa yang terjadi saat dijalankan?</span>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>Menyalin dirinya ke <code className="font-mono text-[10.5px]">C:\ProgramData\LabGuard</code></li>
                    <li>Menyimpan alamat server yang Anda masukkan ke <code className="font-mono text-[10.5px]">config.json</code></li>
                    <li>Membuat Scheduled Task agar auto-start senyap setiap PC menyala</li>
                    <li>Menyinkronkan perintah pemblokiran dari PC Guru tiap 5 detik</li>
                  </ul>
                </div>
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-150 flex gap-2.5 text-xs text-emerald-800">
                  <KeyRound className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Sistem Pengaman Mandiri (Self-Healing)</span>
                    Jika koneksi ke PC Guru terputus mendadak saat pelajaran (mis. listrik padam atau server dimatikan),
                    Agent otomatis mencabut semua pemblokiran agar PC siswa kembali normal. Siswa tidak akan terkunci permanen.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Scenario Guide (berlaku untuk keduanya) */}
      <div className="border-t border-slate-150 pt-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-blue-600" />
          Skenario Demo Pengujian Aplikasi
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Gunakan langkah demo berikut untuk mempresentasikan aplikasi ini di hadapan dosen penguji atau guru pembimbing Anda:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150/80">
            <span className="font-bold text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded block w-max mb-1.5">TAHAP 1: KONDISI AWAL</span>
            <p className="text-xs font-semibold text-slate-700">Akses Situs Bebas</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Sebelum sesi dimulai, buka browser di PC siswa dan buka <code className="bg-slate-100 px-1 font-mono text-[10px]">youtube.com</code>. Situs akan terbuka dengan lancar karena pemblokiran belum aktif.
            </p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150/80">
            <span className="font-bold text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded block w-max mb-1.5">TAHAP 2: BLOKIR AKTIF</span>
            <p className="text-xs font-semibold text-slate-700">Mulai Sesi Guru</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Klik tombol <span className="font-bold text-rose-600">Mulai Sesi Pelajaran</span> di dashboard guru. Dalam 5 detik, hosts file akan berubah dan browser tidak akan bisa mengakses YouTube lagi.
            </p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150/80">
            <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded block w-max mb-1.5">TAHAP 3: SELESAI BELAJAR</span>
            <p className="text-xs font-semibold text-slate-700">Akhiri Sesi Guru</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Klik <span className="font-bold text-emerald-600">Akhiri Sesi Pelajaran</span>. Agent akan merestore file hosts seperti sediakala dan melakukan DNS Flush. YouTube dapat diakses kembali dengan normal!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
