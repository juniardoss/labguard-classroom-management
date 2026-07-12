import React from 'react';
import { motion } from 'motion/react';
import { Laptop, ShieldAlert, CheckCircle2, WifiOff, Check, X } from 'lucide-react';
import { ClientPC } from '../types';

interface ClassroomGridProps {
  clients: ClientPC[];
  targetAll: boolean;
  targetClients: string[];
  onToggleTarget: (pcName: string) => void;
  sessionActive: boolean;
}

export default function ClassroomGrid({
  clients,
  targetAll,
  targetClients,
  onToggleTarget,
  sessionActive,
}: ClassroomGridProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Laptop className="h-5 w-5 text-blue-600" />
            Denah Tata Letak Lab Komputer
          </h2>
          <p className="text-sm text-slate-500">
            Representasi visual 20 PC Siswa + 1 PC Guru di LAN. Klik PC untuk menambah/menghapus target blokir.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Online (Normal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            <span>Terblokir (Sesi Aktif)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span>Offline</span>
          </div>
        </div>
      </div>

      {/* Grid Lab */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {clients.map((pc) => {
          const isOffline = pc.status === 'Offline';
          const isBlocked = pc.status === 'Blocked';
          const isTargeted = targetAll || targetClients.includes(pc.pcName);

          return (
            <motion.div
              key={pc.pcName}
              whileHover={!isOffline ? { y: -3, scale: 1.01 } : {}}
              className={`relative flex flex-col p-4 rounded-lg border transition-all duration-200 select-none overflow-hidden ${
                isOffline
                  ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  : isBlocked
                  ? 'bg-white border-slate-200 shadow-sm'
                  : isTargeted && sessionActive
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              {/* Vertical accent bars from Professional Polish template */}
              {!isOffline && (
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    isBlocked ? 'bg-blue-600' : 'bg-emerald-500'
                  }`}
                />
              )}

              {/* Target / Block indicator badge */}
              {!isOffline && (
                <button
                  id={`target-toggle-${pc.pcName}`}
                  onClick={() => onToggleTarget(pc.pcName)}
                  disabled={targetAll}
                  className={`absolute top-2.5 right-2.5 p-1 rounded transition-all ${
                    targetAll
                      ? 'text-blue-400/40 cursor-not-allowed'
                      : isTargeted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                  }`}
                  title={
                    targetAll
                      ? 'Semua PC ditargetkan secara global'
                      : isTargeted
                      ? 'PC Ditargetkan (Klik untuk lepas)'
                      : 'Klik untuk jadikan target pemblokiran'
                  }
                >
                  {isTargeted ? <Check className="h-3 w-3 stroke-[3]" /> : <X className="h-3 w-3" />}
                </button>
              )}

              {/* Icon & PC Name */}
              <div className="flex items-center gap-2 mb-2 pl-1.5">
                <div
                  className={`p-2 rounded-lg ${
                    isOffline
                      ? 'bg-slate-100 text-slate-400'
                      : isBlocked
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-emerald-50/80 text-emerald-600'
                  }`}
                >
                  <Laptop className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-700 block leading-tight">
                    {pc.pcName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider">{pc.ip}</span>
                </div>
              </div>

              {/* Student Name */}
              <div className="mt-1 pl-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-semibold truncate block max-w-[120px]" title={pc.studentName}>
                  {pc.studentName || 'PC Siswa'}
                </span>
              </div>

              {/* Connection & Security Status */}
              <div className="mt-3 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold pl-1.5">
                <span className="text-slate-400 font-normal">Status</span>
                {isOffline ? (
                  <span className="text-slate-400 flex items-center gap-1">
                    <WifiOff className="h-3.5 w-3.5" />
                    Offline
                  </span>
                ) : isBlocked ? (
                  <span className="text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    Filter On
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    Online
                  </span>
                )}
              </div>

              {/* Floating warning label if targeted but session inactive */}
              {sessionActive && isTargeted && !isOffline && !isBlocked && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[0.5px] rounded-lg flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-[10px] text-slate-500 font-bold">Menghubungkan...</span>
                  <span className="text-[9px] text-blue-600 font-black mt-1 bg-blue-50 px-2 py-0.5 rounded">
                    Menunggu Polling
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Simulated Teacher Desk Representation at the front of the class */}
      <div className="mt-8 pt-6 border-t border-dashed border-slate-200 flex justify-center">
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-12 py-3 text-center shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mx-auto mb-1 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            MEJA GURU / SERVER UTAMA
          </span>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">IP: localhost:3000</p>
        </div>
      </div>
    </div>
  );
}
