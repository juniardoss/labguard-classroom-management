import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { createServer as createViteServer } from "vite";

// Kata kunci nama adapter virtual/VPN yang harus diabaikan saat memilih IP LAN.
const VIRTUAL_IFACE_KEYWORDS = [
  "virtualbox", "vmware", "hyper-v", "vethernet", "vpn", "mcafee",
  "loopback", "tailscale", "zerotier", "wsl", "docker", "tap", "tun",
];

function isVirtualIface(name: string): boolean {
  const lower = name.toLowerCase();
  return VIRTUAL_IFACE_KEYWORDS.some((kw) => lower.includes(kw));
}

// Ambil semua alamat IPv4 LAN aktif dari PC ini (server/PC Guru), lengkap dengan nama adapter.
function getLanIfaces(): { name: string; address: string }[] {
  const ifaces = os.networkInterfaces();
  const list: { name: string; address: string }[] = [];
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        list.push({ name, address: net.address });
      }
    }
  }
  return list;
}

// Kompatibilitas: kembalikan hanya daftar alamat IP.
function getLanIps(): string[] {
  return getLanIfaces().map((i) => i.address);
}

// Beri skor prioritas sebuah IP. Makin tinggi makin diprioritaskan sebagai IP LAN "asli".
function scoreLanIp(ip: string): number {
  if (ip.startsWith("169.254.")) return -100; // APIPA: tidak dapat DHCP / terputus
  if (ip.startsWith("192.168.56.")) return -50; // VirtualBox host-only default
  if (ip.startsWith("192.168.")) return 100; // LAN rumah/sekolah paling umum
  if (ip.startsWith("10.")) return 90; // LAN privat kelas A
  // 172.16.x - 172.31.x = privat kelas B, tapi sering dipakai VPN/hotspot → prioritas rendah
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 40;
  return 10;
}

// Pilih IP LAN utama: utamakan adapter fisik (bukan VPN/virtual) dan range LAN paling umum.
function getPrimaryLanIp(): string {
  const ifaces = getLanIfaces();
  const ranked = ifaces
    .filter((i) => !i.address.startsWith("169.254.")) // buang APIPA/terputus
    .map((i) => ({
      ...i,
      score: scoreLanIp(i.address) - (isVirtualIface(i.name) ? 200 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  if (ranked.length > 0) return ranked[0].address;

  // Semua adapter APIPA/kosong → jatuh ke alamat apa adanya sebagai upaya terakhir.
  const all = getLanIps();
  return all[0] || "127.0.0.1";
}

const DB_PATH = path.join(process.cwd(), "db.json");
const AGENT_PATH = path.join(process.cwd(), "src/agent/labguard_agent.py");
const AGENT_EXE_PATH = path.join(process.cwd(), "src/agent/dist/LabGuardAgent.exe");

// Helper untuk membaca database
function getDb() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultDb = {
      session: {
        sessionActive: false,
        sessionStartTime: null,
        targetAll: true,
        targetClients: []
      },
      blacklist: [
        "youtube.com",
        "www.youtube.com",
        "facebook.com",
        "www.facebook.com",
        "instagram.com",
        "www.instagram.com",
        "tiktok.com",
        "www.tiktok.com",
        "twitter.com",
        "x.com",
        "reddit.com",
        "roblox.com",
        "poki.com"
      ],
      realClients: {},
      useSimulation: true
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(content);
  } catch (e) {
    console.error("Gagal membaca database JSON, mereset...", e);
    return {
      session: { sessionActive: false, sessionStartTime: null, targetAll: true, targetClients: [] },
      blacklist: ["youtube.com", "www.youtube.com", "facebook.com", "instagram.com", "tiktok.com"],
      realClients: {},
      useSimulation: true
    };
  }
}

// Helper untuk menyimpan database
function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Gagal menyimpan database JSON:", e);
  }
}

// Daftar nama siswa Indonesia untuk simulasi 20 PC
const SIMULATED_STUDENTS = [
  "Andi Pratama", "Budi Santoso", "Citra Lestari", "Dedi Wijaya", 
  "Eka Saputra", "Farhan Hidayat", "Gita Rahayu", "Hendra Wijaya", 
  "Indah Permata", "Joko Susilo", "Kartika Sari", "Lukman Hakim", 
  "Mega Utami", "Novianti", "Oki Setiawan", "Putri Amelia", 
  "Rian Hidayat", "Siti Aminah", "Taufik Hidayat", "Yusuf Mansur"
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === REST API ENDPOINTS ===

  // 1. Get Session Status
  app.get("/api/session", (req, res) => {
    const db = getDb();
    res.json(db.session);
  });

  // 1b. Info Server (IP LAN PC Guru untuk ditampilkan di frontend)
  app.get("/api/server-info", (req, res) => {
    res.json({
      ip: getPrimaryLanIp(),
      port: PORT,
      hostname: os.hostname(), // nama komputer PC Guru: dipakai agent agar kebal ganti IP
      allIps: getLanIps(),
    });
  });

  // 2. Start Session
  app.post("/api/session/start", (req, res) => {
    const db = getDb();
    const { targetAll, targetClients } = req.body;
    
    db.session.sessionActive = true;
    db.session.sessionStartTime = new Date().toISOString();
    db.session.targetAll = targetAll !== undefined ? targetAll : true;
    db.session.targetClients = Array.isArray(targetClients) ? targetClients : [];
    
    saveDb(db);
    res.json({ message: "Sesi pelajaran dimulai", session: db.session });
  });

  // 3. Stop/End Session
  app.post("/api/session/stop", (req, res) => {
    const db = getDb();
    db.session.sessionActive = false;
    db.session.sessionStartTime = null;
    
    saveDb(db);
    res.json({ message: "Sesi pelajaran diakhiri", session: db.session });
  });

  // 4. Get Blacklist
  app.get("/api/blacklist", (req, res) => {
    const db = getDb();
    res.json(db.blacklist);
  });

  // 5. Add Blacklist Domain
  app.post("/api/blacklist", (req, res) => {
    const db = getDb();
    let { domain } = req.body;
    
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({ error: "Domain tidak valid" });
    }
    
    domain = domain.trim().toLowerCase();
    
    if (db.blacklist.includes(domain)) {
      return res.status(400).json({ error: "Domain sudah terdaftar di blacklist" });
    }
    
    db.blacklist.push(domain);
    saveDb(db);
    res.json({ message: "Domain ditambahkan", blacklist: db.blacklist });
  });

  // 6. Delete Blacklist Domain
  app.delete("/api/blacklist", (req, res) => {
    const db = getDb();
    let domain = req.body.domain || req.query.domain;
    
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({ error: "Domain tidak valid" });
    }
    
    domain = domain.trim().toLowerCase();
    
    const index = db.blacklist.indexOf(domain);
    if (index === -1) {
      return res.status(404).json({ error: "Domain tidak ditemukan di blacklist" });
    }
    
    db.blacklist.splice(index, 1);
    saveDb(db);
    res.json({ message: "Domain dihapus", blacklist: db.blacklist });
  });

  // 7. Toggle Simulation Mode
  app.post("/api/clients/simulate-toggle", (req, res) => {
    const db = getDb();
    db.useSimulation = req.body.useSimulation !== undefined ? req.body.useSimulation : !db.useSimulation;
    saveDb(db);
    res.json({ useSimulation: db.useSimulation });
  });

  // 8. Get Clients (Merged Simulated + Real Clients)
  app.get("/api/clients", (req, res) => {
    const db = getDb();
    const now = Date.now();
    const list: any[] = [];

    // Filter real clients yang masih aktif (terakhir terlihat < 15 detik yang lalu)
    const activeRealClients: Record<string, any> = {};
    let hasRealClients = false;

    Object.entries(db.realClients).forEach(([pcName, info]: [string, any]) => {
      const diff = now - info.lastSeen;
      if (diff < 15000) { // Masih aktif dalam 15 detik terakhir
        activeRealClients[pcName] = {
          ...info,
          status: db.session.sessionActive && (db.session.targetAll || db.session.targetClients.includes(pcName)) ? "Blocked" : "Online",
          isSimulated: false,
          studentName: "PC Riil (Siswa)"
        };
        hasRealClients = true;
      }
    });

    if (db.useSimulation) {
      // Buat 20 PC simulasi
      for (let i = 1; i <= 20; i++) {
        const padId = String(i).padStart(2, "0");
        const pcName = `PC-${padId}`;
        const ip = `192.168.1.1${padId}`;
        const studentName = SIMULATED_STUDENTS[i - 1];

        // Jika PC ini sudah ada sebagai PC riil, lewati agar tidak dobel
        if (activeRealClients[pcName]) {
          list.push(activeRealClients[pcName]);
          continue;
        }

        // Tentukan online status. Untuk simulasi yang realistis,
        // PC-05 dan PC-14 kita matikan (Offline) secara default
        const isOffline = i === 5 || i === 14;
        let status: "Online" | "Offline" | "Blocked" = "Online";

        if (isOffline) {
          status = "Offline";
        } else if (db.session.sessionActive) {
          const isTargeted = db.session.targetAll || db.session.targetClients.includes(pcName);
          status = isTargeted ? "Blocked" : "Online";
        }

        list.push({
          pcName,
          ip,
          lastSeen: now,
          status,
          studentName,
          isSimulated: true,
          isTargeted: db.session.targetAll || db.session.targetClients.includes(pcName)
        });
      }
    } else {
      // Hanya tampilkan PC riil
      Object.values(activeRealClients).forEach((info) => {
        list.push({
          ...info,
          isTargeted: db.session.targetAll || db.session.targetClients.includes(info.pcName)
        });
      });
    }

    res.json({
      clients: list,
      useSimulation: db.useSimulation,
      hasRealClients
    });
  });

  // 9. Client Polling Endpoint
  app.get("/api/agent/poll", (req, res) => {
    const pcName = (req.query.pc_name as string) || "UnknownPC";
    const ip = (req.query.ip as string) || "127.0.0.1";
    const clientStatus = (req.query.status as string) || "Online";

    const db = getDb();
    
    // Update data real client
    db.realClients[pcName] = {
      pcName,
      ip,
      lastSeen: Date.now(),
      status: clientStatus
    };
    
    saveDb(db);

    const isTargeted = db.session.targetAll || db.session.targetClients.includes(pcName);

    res.json({
      session_active: db.session.sessionActive,
      blacklist: db.blacklist,
      target_all: db.session.targetAll,
      is_targeted: isTargeted
    });
  });

  // 10. Download Student Agent Python File
  app.get("/api/agent/download", (req, res) => {
    try {
      if (!fs.existsSync(AGENT_PATH)) {
        return res.status(404).send("File agent tidak ditemukan di server.");
      }

      let content = fs.readFileSync(AGENT_PATH, "utf8");

      // Modifikasi dinamis IP dan port server di skrip download agar langsung mengarah ke URL server ini!
      const hostHeader = req.headers.host || "localhost:3000";
      let hostName = hostHeader;
      let port = "80";

      if (hostHeader.includes(":")) {
        const parts = hostHeader.split(":");
        hostName = parts[0];
        port = parts[1];
      } else {
        // Jika HTTPS standard (biasanya di deploy Cloud Run), set port ke 443 / default
        port = "443";
      }

      // Deteksi jika server diakses via HTTPS (misalnya di preview AI Studio)
      // headers['x-forwarded-proto'] memberi tahu protokol asli di balik proxy
      const proto = req.headers["x-forwarded-proto"] || "http";
      
      // Kita ganti konfigurasi default di skrip python
      // Ganti DEFAULT_SERVER_IP = "localhost" menjadi host atau domain riil
      // Dan dukung HTTPS jika dipanggil via HTTPS
      content = content.replace(
        `DEFAULT_SERVER_IP = "localhost"`,
        `DEFAULT_SERVER_IP = "${hostName}"`
      );
      content = content.replace(
        `DEFAULT_SERVER_PORT = "3000"`,
        `DEFAULT_SERVER_PORT = "${port}"`
      );

      // Jika proto adalah HTTPS, ganti baris pembentukan server_url agar menggunakan https secara fleksibel
      if (proto === "https") {
        content = content.replace(
          `server_url = f"http://{server_ip}:{server_port}"`,
          `server_url = f"https://{server_ip}" if server_port in ["443", "80"] else f"http://{server_ip}:{server_port}"`
        );
      }

      res.setHeader("Content-Disposition", "attachment; filename=labguard_agent.py");
      res.setHeader("Content-Type", "text/x-python");
      res.send(content);
    } catch (e) {
      console.error("Gagal mengunduh file agent:", e);
      res.status(500).send("Kesalahan server internal saat memproses unduhan.");
    }
  });

  // 10b. Download Student Agent Executable (LabGuardAgent.exe)
  app.get("/api/agent/download-exe", (req, res) => {
    if (!fs.existsSync(AGENT_EXE_PATH)) {
      return res
        .status(404)
        .send("File LabGuardAgent.exe belum tersedia di server. Build dulu dengan build_exe.bat.");
    }
    res.download(AGENT_EXE_PATH, "LabGuardAgent.exe", (err) => {
      if (err) console.error("Gagal mengunduh LabGuardAgent.exe:", err);
    });
  });

  // === VITE MIDDLEWARE SETUP ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server LabGuard berjalan aktif di http://0.0.0.0:${PORT}`);
  });
}

startServer();
