import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldAlert,
  Laptop,
  Play,
  Square,
  Plus,
  Trash2,
  Download,
  Settings,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileCode,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  LayoutGrid,
  Bell,
  Sparkles
} from 'lucide-react';

import { ClientPC, SessionState } from './types';
import ClassroomGrid from './components/ClassroomGrid';
import BlacklistManager from './components/BlacklistManager';
import AgentSetup from './components/AgentSetup';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blacklist' | 'agent-setup'>('dashboard');

  // Application State
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [targetAll, setTargetAll] = useState(true);
  const [targetClients, setTargetClients] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [clients, setClients] = useState<ClientPC[]>([]);
  const [useSimulation, setUseSimulation] = useState(true);
  const [hasRealClients, setHasRealClients] = useState(false);

  // UI Utilities
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [serverHost, setServerHost] = useState('localhost:3000');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    // Auto clear toast
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  // Ambil IP LAN PC Guru (server) untuk ditampilkan di header
  useEffect(() => {
    fetch('/api/server-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ip) {
          setServerHost(`${data.ip}:${data.port}`);
        } else if (typeof window !== 'undefined') {
          setServerHost(window.location.host);
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          setServerHost(window.location.host);
        }
      });
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    try {
      // 1. Fetch Session
      const resSession = await fetch('/api/session');
      if (resSession.ok) {
        const data: SessionState = await resSession.json();
        setSessionActive(data.sessionActive);
        setSessionStartTime(data.sessionStartTime);
        setTargetAll(data.targetAll);
        setTargetClients(data.targetClients);
      }

      // 2. Fetch Blacklist
      const resBlacklist = await fetch('/api/blacklist');
      if (resBlacklist.ok) {
        const data = await resBlacklist.json();
        setBlacklist(data);
      }

      // 3. Fetch Clients
      const resClients = await fetch('/api/clients');
      if (resClients.ok) {
        const data = await resClients.json();
        setClients(data.clients);
        setUseSimulation(data.useSimulation);
        setHasRealClients(data.hasRealClients);
      }
    } catch (e) {
      console.error("Gagal polling data ke Express API server:", e);
    }
  };

  // Polling data berkala setiap 3 detik
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Timer Sesi Aktif
  useEffect(() => {
    if (!sessionActive || !sessionStartTime) {
      setElapsedTime('00:00');
      return;
    }

    const updateTimer = () => {
      const start = new Date(sessionStartTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, now - start);

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');

      if (h > 0) {
        setElapsedTime(`${pad(h)}:${pad(m)}:${pad(s)}`);
      } else {
        setElapsedTime(`${pad(m)}:${pad(s)}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionActive, sessionStartTime]);

  // Handler: Mulai Sesi Pelajaran
  const handleStartSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAll,
          targetClients
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionActive(data.session.sessionActive);
        setSessionStartTime(data.session.sessionStartTime);
        showToast('Sesi pelajaran berhasil DIMULAI. Pemblokiran website telah diaktifkan!', 'success');
      } else {
        showToast('Gagal memulai sesi pelajaran', 'error');
      }
    } catch (e) {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Akhiri Sesi Pelajaran
  const handleStopSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/session/stop', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setSessionActive(data.session.sessionActive);
        setSessionStartTime(null);
        showToast('Sesi pelajaran telah DIAKHIRI. Kondisi PC siswa dikembalikan normal.', 'info');
      } else {
        showToast('Gagal mengakhiri sesi pelajaran', 'error');
      }
    } catch (e) {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Tambah Blacklist Domain
  const handleAddDomain = async (domain: string) => {
    try {
      const res = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (res.ok) {
        const data = await res.json();
        setBlacklist(data.blacklist);
        showToast(`Berhasil menambahkan "${domain}" ke blacklist`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal menambahkan domain', 'error');
      }
    } catch (e) {
      showToast('Gagal menghubungi server', 'error');
    }
  };

  // Handler: Hapus Blacklist Domain
  const handleRemoveDomain = async (domain: string) => {
    try {
      const res = await fetch('/api/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (res.ok) {
        const data = await res.json();
        setBlacklist(data.blacklist);
        showToast(`Domain "${domain}" dihapus dari blacklist`, 'info');
      } else {
        showToast('Gagal menghapus domain', 'error');
      }
    } catch (e) {
      showToast('Gagal menghubungi server', 'error');
    }
  };

  // Handler: Toggle Target PC Siswa
  const handleToggleTarget = (pcName: string) => {
    let updatedTargets = [...targetClients];
    if (updatedTargets.includes(pcName)) {
      updatedTargets = updatedTargets.filter((name) => name !== pcName);
      showToast(`PC ${pcName} dihapus dari target pemblokiran.`, 'info');
    } else {
      updatedTargets.push(pcName);
      showToast(`PC ${pcName} ditambahkan sebagai target pemblokiran.`, 'success');
    }
    setTargetClients(updatedTargets);

    // Kirim update targets ke server jika sesi sedang aktif
    if (sessionActive) {
      fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAll: false,
          targetClients: updatedTargets
        }),
      });
    }
  };

  // Handler: Toggle Simulation Mode
  const handleToggleSimulation = async () => {
    try {
      const res = await fetch('/api/clients/simulate-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useSimulation: !useSimulation }),
      });

      if (res.ok) {
        const data = await res.json();
        setUseSimulation(data.useSimulation);
        showToast(
          data.useSimulation
            ? 'Mengaktifkan simulasi lab (20 PC siswa).'
            : 'Menonaktifkan simulasi. Hanya menampilkan koneksi PC riil.',
          'info'
        );
      }
    } catch (e) {
      showToast('Gagal mengubah mode simulasi', 'error');
    }
  };

  // Hitung jumlah PC berdasarkan statusnya
  const totalPC = clients.length;
  const onlinePC = clients.filter((c) => c.status === 'Online').length;
  const blockedPC = clients.filter((c) => c.status === 'Blocked').length;
  const offlinePC = clients.filter((c) => c.status === 'Offline').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-semibold pointer-events-auto min-w-[320px] max-w-md ${
                toast.type === 'success'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : toast.type === 'error'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-blue-600 text-white border-blue-500'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-100 flex-shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-rose-100 flex-shrink-0" />
              ) : (
                <Bell className="h-5 w-5 text-blue-100 flex-shrink-0" />
              )}
              <div className="flex-1">{toast.message}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 backdrop-blur-md/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-100">
              <Shield className="h-5.5 w-5.5 stroke-[2.25]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">
                  LabGuard Classroom
                </h1>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md uppercase">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Sistem Monitoring & Pemblokiran Lab Komputer</p>
            </div>
          </div>

          {/* Quick Server Status Badge */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute"></span>
              <span className="text-xs font-bold text-emerald-700">SERVER ONLINE</span>
            </div>
            <div className="h-3.5 w-[1px] bg-slate-300"></div>
            <span className="text-xs font-mono font-semibold text-slate-500 hover:text-blue-600 cursor-pointer" title="Alamat IP LAN PC Guru">
              IP: {serverHost}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Status Sesi */}
          <div className="bg-white rounded-2xl border border-slate-200/85 p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Sesi Pelajaran</p>
              <h3 className={`text-xl font-black ${sessionActive ? 'text-rose-600' : 'text-slate-500'}`}>
                {sessionActive ? 'Sesi Aktif' : 'Non-Aktif'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {sessionActive ? 'Pemblokiran sedang berjalan' : 'PC siswa berjalan normal'}
              </p>
            </div>
            <div className={`p-3.5 rounded-xl ${sessionActive ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <Activity className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: PC Terhubung */}
          <div className="bg-white rounded-2xl border border-slate-200/85 p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">PC Terhubung (LAN)</p>
              <h3 className="text-xl font-black text-slate-800">
                {onlinePC + blockedPC} <span className="text-xs font-semibold text-slate-400">/ {totalPC} PC</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {hasRealClients ? 'PC Riil Aktif Tersambung' : 'Menggunakan model simulasi'}
              </p>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
              <Laptop className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: PC Terblokir */}
          <div className="bg-white rounded-2xl border border-slate-200/85 p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Target Diblokir</p>
              <h3 className="text-xl font-black text-rose-600">{blockedPC} PC</h3>
              <p className="text-xs text-slate-400 font-medium">
                {sessionActive ? 'Akses dibatasi hosts' : 'Pemblokiran belum di-start'}
              </p>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Blacklist Sites */}
          <div className="bg-white rounded-2xl border border-slate-200/85 p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Blacklist Situs</p>
              <h3 className="text-xl font-black text-slate-800">{blacklist.length} Domain</h3>
              <p className="text-xs text-slate-400 font-medium">Daftar situs dilarang dibuka</p>
            </div>
            <div className="p-3.5 bg-slate-50 text-slate-600 rounded-xl">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Global Control Console */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${sessionActive ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-750 text-slate-400'}`}>
                  {sessionActive ? '● SESI SEDANG BERLANGSUNG' : 'SESI MATI'}
                </span>
                {sessionActive && (
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-mono font-bold">
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    {elapsedTime}
                  </span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                {sessionActive
                  ? 'Pemblokiran Konten Aktif di Semua PC Target'
                  : 'Siap Memulai Sesi Pelajaran Baru?'}
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {sessionActive
                  ? 'Seluruh PC siswa yang berstatus "Terblokir" tidak dapat mengakses domain yang berada di dalam daftar blacklist. Agent pada PC siswa akan menyinkronkan status ini setiap 5 detik.'
                  : 'Saat Anda memulai sesi, skrip agent di PC siswa secara otomatis memperbarui file hosts Windows dan memblokir domain-domain terlarang. Anda bisa mematikan pemblokiran kapan saja.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 min-w-[280px]">
              {sessionActive ? (
                <button
                  id="stop-session-btn"
                  onClick={handleStopSession}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 text-white font-black text-sm rounded-xl transition shadow-md shadow-emerald-950/20"
                >
                  <Square className="h-4.5 w-4.5 stroke-[3]" />
                  AKHIRI SESI PELAJARAN
                </button>
              ) : (
                <div className="w-full space-y-3">
                  {/* Select target type */}
                  <div className="flex bg-slate-800 rounded-lg p-1 text-[11px] font-bold">
                    <button
                      id="target-all-btn"
                      type="button"
                      onClick={() => {
                        setTargetAll(true);
                        showToast('Target pemblokiran diset untuk SEMUA PC siswa.', 'info');
                      }}
                      className={`flex-1 py-1.5 rounded-md text-center transition ${targetAll ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Terapkan Semua PC
                    </button>
                    <button
                      id="target-select-btn"
                      type="button"
                      onClick={() => {
                        setTargetAll(false);
                        showToast('Target diset ke PC tertentu saja. Pilih PC Anda di bawah.', 'info');
                      }}
                      className={`flex-1 py-1.5 rounded-md text-center transition ${!targetAll ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Pilih PC Spesifik
                    </button>
                  </div>

                  <button
                    id="start-session-btn"
                    onClick={handleStartSession}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:bg-slate-800 text-white font-black text-sm rounded-xl transition shadow-md shadow-rose-950/20"
                  >
                    <Play className="h-4.5 w-4.5 stroke-[3]" />
                    MULAI SESI PELAJARAN
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sub-Header / Notification Alert banner */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600"></span>
              <span>
                {targetAll
                  ? 'Aturan Pemblokiran berlaku global untuk semua PC siswa'
                  : `Hanya PC terpilih (${targetClients.length} PC ditandai) yang akan diblokir.`}
              </span>
            </div>

            {/* Simulation switch toggle in Footer of control box */}
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mode Simulasi (Demo)</span>
              <button
                id="toggle-simulation-switch"
                onClick={handleToggleSimulation}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  useSimulation ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    useSimulation ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="h-4.5 w-4.5" />
            Dashboard Lab Komputer
          </button>

          <button
            id="tab-blacklist"
            onClick={() => setActiveTab('blacklist')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${
              activeTab === 'blacklist'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="h-4.5 w-4.5" />
            Kelola Blacklist ({blacklist.length})
          </button>

          <button
            id="tab-agent-setup"
            onClick={() => setActiveTab('agent-setup')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold transition-all ${
              activeTab === 'agent-setup'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="h-4.5 w-4.5" />
            Panduan Instalasi
          </button>
        </div>

        {/* Tab Contents */}
        <div className="transition-all duration-300">
          {activeTab === 'dashboard' && (
            <ClassroomGrid
              clients={clients}
              targetAll={targetAll}
              targetClients={targetClients}
              onToggleTarget={handleToggleTarget}
              sessionActive={sessionActive}
            />
          )}

          {activeTab === 'blacklist' && (
            <BlacklistManager
              blacklist={blacklist}
              onAddDomain={handleAddDomain}
              onRemoveDomain={handleRemoveDomain}
            />
          )}

          {activeTab === 'agent-setup' && <AgentSetup />}
        </div>
      </main>

      {/* Footer credits and system metadata */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-6 text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-2">
            © 2026 LabGuard Classroom Management. Dilindungi Hak Cipta.
            <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
              sus programmer A-24
            </span>
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              Sistem Selesai Dipersiapkan
            </span>
            <span className="h-3 w-[1px] bg-slate-200"></span>
            <span>Versi Rilis: 1.0.0-Stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
