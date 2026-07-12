import React, { useState } from 'react';
import { Shield, Plus, Trash2, Search, AlertCircle, Gamepad2, Share2, Tv } from 'lucide-react';

interface BlacklistManagerProps {
  blacklist: string[];
  onAddDomain: (domain: string) => void;
  onRemoveDomain: (domain: string) => void;
}

const TEMPLATE_GAMES = ['poki.com', 'roblox.com', 'friv.com', 'crazygames.com', 'steamcommunity.com'];
const TEMPLATE_SOCIALS = ['facebook.com', 'instagram.com', 'tiktok.com', 'twitter.com', 'x.com', 'reddit.com'];
const TEMPLATE_VIDEOS = ['youtube.com', 'netflix.com', 'twitch.tv', 'vimeo.com'];

export default function BlacklistManager({
  blacklist,
  onAddDomain,
  onRemoveDomain,
}: BlacklistManagerProps) {
  const [newDomain, setNewDomain] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) return;

    // Validasi format domain sederhana
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(trimmed) && trimmed !== 'localhost') {
      setError('Format domain tidak valid (misal: youtube.com)');
      return;
    }

    if (blacklist.includes(trimmed)) {
      setError('Domain sudah ada dalam daftar blacklist');
      return;
    }

    onAddDomain(trimmed);
    setNewDomain('');
  };

  const handleApplyTemplate = (template: string[]) => {
    setError('');
    let countAdded = 0;
    template.forEach((domain) => {
      if (!blacklist.includes(domain)) {
        onAddDomain(domain);
        countAdded++;
      }
    });
  };

  const filteredBlacklist = blacklist.filter((domain) =>
    domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
        <Shield className="h-5 w-5 text-blue-600" />
        Manajemen Blacklist Website
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Siswa tidak dapat mengakses situs-situs yang ada dalam daftar di bawah ini ketika sesi pelajaran diaktifkan.
      </p>

      {/* Quick Block Templates */}
      <div className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-150">
        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-3">
          ⚡ Blokir Cepat via Templat Kategori
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            id="template-games-btn"
            onClick={() => handleApplyTemplate(TEMPLATE_GAMES)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 rounded-lg text-left text-xs font-semibold text-slate-700 transition"
          >
            <Gamepad2 className="h-4 w-4 text-amber-500" />
            <div>
              <p>Game Online</p>
              <span className="text-[10px] text-slate-400 font-normal">Roblox, Poki, Friv</span>
            </div>
          </button>

          <button
            id="template-socials-btn"
            onClick={() => handleApplyTemplate(TEMPLATE_SOCIALS)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-lg text-left text-xs font-semibold text-slate-700 transition"
          >
            <Share2 className="h-4 w-4 text-blue-500" />
            <div>
              <p>Media Sosial</p>
              <span className="text-[10px] text-slate-400 font-normal">FB, TikTok, Instagram</span>
            </div>
          </button>

          <button
            id="template-videos-btn"
            onClick={() => handleApplyTemplate(TEMPLATE_VIDEOS)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 rounded-lg text-left text-xs font-semibold text-slate-700 transition"
          >
            <Tv className="h-4 w-4 text-rose-500" />
            <div>
              <p>Streaming Video</p>
              <span className="text-[10px] text-slate-400 font-normal">YouTube, Netflix, Twitch</span>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Tambah Domain */}
        <div className="lg:col-span-5">
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase block mb-3">
            Tambah Domain Kustom
          </span>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="custom-domain-input" className="sr-only">
                Masukkan domain situs
              </label>
              <div className="relative">
                <input
                  id="custom-domain-input"
                  type="text"
                  placeholder="Contoh: youtube.com"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-3.5 pr-12 py-2.5 border border-slate-250 bg-slate-50/30 focus:bg-white rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
                />
                <button
                  id="add-domain-submit"
                  type="submit"
                  className="absolute right-2 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 mt-2 text-rose-600 text-xs font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-150/60 leading-relaxed">
              <span className="font-bold text-slate-500 block text-[10px] tracking-wide uppercase">
                💡 TIPS PEMBLOKIRAN HOSTS:
              </span>
              <p>
                - Agar browser terblokir maksimal, sangat disarankan menambahkan domain utama beserta versi{' '}
                <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px]">www.</code>
              </p>
              <p>
                - Contoh: Tambahkan <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px]">youtube.com</code>{' '}
                dan <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10px]">www.youtube.com</code> agar tidak lolos bypass.
              </p>
            </div>
          </form>
        </div>

        {/* List Blacklist */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              Daftar Blacklist Aktif ({filteredBlacklist.length})
            </span>

            {/* Search Bar */}
            <div className="relative max-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="search-blacklist"
                type="text"
                placeholder="Cari domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-slate-50/50 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="border border-slate-150 rounded-xl overflow-hidden flex-1 max-h-[280px] overflow-y-auto bg-slate-50/30">
            {filteredBlacklist.length > 0 ? (
              <div className="divide-y divide-slate-150 bg-white">
                {filteredBlacklist.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/60 transition group"
                  >
                    <span className="text-sm font-semibold text-slate-700 font-mono">{domain}</span>
                    <button
                      id={`remove-domain-${domain}`}
                      onClick={() => onRemoveDomain(domain)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition duration-150"
                      title="Hapus dari Blacklist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-400 h-full">
                <Shield className="h-8 w-8 mb-2.5 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium">Tidak ada domain blacklist ditemukan</p>
                {searchQuery && (
                  <button
                    id="clear-search"
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] text-blue-600 font-bold mt-1 hover:underline"
                  >
                    Bersihkan Pencarian
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
