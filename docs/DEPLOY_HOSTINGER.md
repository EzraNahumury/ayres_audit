# Deploy Ayres Audit ke Hostinger Cloud Startup

Panduan ini ditulis untuk **Hostinger Cloud Startup** (plan dengan "Hingga 10 aplikasi Node.js"). Untuk VPS, urutannya sama tapi langkah "Setup Node.js App via hPanel" diganti dengan `pm2`.

---

## 0. Persiapan keamanan (WAJIB dulu)

Sebelum upload, pastikan:

- [ ] **Rotate `OLLAMA_API_KEY`** di dashboard Ollama. Key yang lama (di `.env.local` lokal) anggap bocor.
- [ ] Generate `AUTH_SECRET` baru:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```
- [ ] Jalankan migrasi password lokal dulu untuk verifikasi:
  ```bash
  node scripts/migrate-passwords.mjs
  ```
  Pastikan semua user lama bisa login dengan password lamanya (hash di DB akan auto-upgrade saat login pertama, atau langsung oleh skrip migrasi).

---

## 1. Setup MySQL di hPanel

1. Masuk hPanel → **Databases** → **MySQL Databases**
2. Buat database baru, mis. `u123456_ayres`
3. Buat user MySQL baru — **jangan pakai root**:
   - Username: `u123456_ayres_app`
   - Password: generate password kuat (32 chars), simpan baik-baik
   - Grant: `ALL PRIVILEGES` pada database `u123456_ayres` saja
4. Catat host (`localhost` biasanya), port (`3306`)

---

## 2. Setup Node.js App di hPanel

1. hPanel → **Advanced** → **Node.js**
2. Klik **Create Application**
3. Konfigurasi:
   - **Node.js version**: 20.x (atau yang terbaru tersedia)
   - **Application mode**: Production
   - **Application root**: `domains/yourdomain.com/public_html/ayres` (atau folder pilihan)
   - **Application URL**: domain/subdomain target
   - **Application startup file**: `node_modules/next/dist/bin/next` dengan argumen `start -p $PORT` — atau biarkan default lalu set Startup Command nanti
4. Klik **Create**

---

## 3. Upload kode

**Opsi A — via Git (rekomendasi):**

```bash
# Di SSH Hostinger
cd ~/domains/yourdomain.com/public_html
git clone https://github.com/<user>/ayres_audit.git ayres
cd ayres
```

**Opsi B — via File Manager / FTP:**

Upload semua file **kecuali**:
- `node_modules/` (akan diinstall ulang di server)
- `.next/` (akan di-build ulang)
- `wa_sessions/`, `public/wa-media/`, `.env.local`, `.tunnel.log`, `.dev-server.log`

---

## 4. Konfigurasi environment

Di hPanel → Node.js App → **Environment Variables**, tambahkan satu-per-satu:

| Variable | Value |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | `u123456_ayres_app` |
| `DB_PASS` | password MySQL yang tadi dibuat |
| `DB_NAME` | `u123456_ayres` |
| `AUTH_SECRET` | output `node -e "..."` di langkah 0 |
| `OLLAMA_HOST` | `https://ollama.com` |
| `OLLAMA_MODEL` | `gpt-oss:120b-cloud` |
| `OLLAMA_API_KEY` | key yang sudah di-rotate |
| `NODE_ENV` | `production` |

> Catatan: **JANGAN upload `.env.local`** ke server. Pakai env vars hPanel — lebih aman dan tidak ke-commit ulang.

---

## 5. Install dependency & build

Via SSH:

```bash
cd ~/domains/yourdomain.com/public_html/ayres

# Aktifkan environment Node.js yang barusan dibuat (hPanel kasih perintah persis-nya)
source /home/u123456/nodevenv/.../activate

npm ci
npm run build
```

> **Kalau native module Baileys gagal compile** di server Hostinger:
> 1. Build `node_modules/` di lokal Windows/Linux dengan arsitektur yang sama (x86_64 Linux)
> 2. Compress dan upload manual
> 3. Skip `npm ci` di server

---

## 6. Migrasi database

```bash
# Init schema (idempotent)
curl http://localhost:$PORT/api/db/init

# Atau jalankan langsung:
node -e "import('./lib/init-db.ts').then(m => m.initDatabase()).then(console.log)"

# Hash semua password lama jadi PBKDF2
node scripts/migrate-passwords.mjs
```

---

## 7. Start application

Di hPanel → Node.js App → klik **Restart**.

Verifikasi:

```bash
curl https://yourdomain.com/api/health
# Expected: {"ok":true,"uptime":...,"db":"ok","latencyMs":...}
```

---

## 8. Keep-alive (PENTING)

Hostinger Cloud Hosting bisa **mematikan proses Node.js saat idle**. Untuk Baileys (yang harus selalu konek ke WhatsApp), ini fatal.

**Setup UptimeRobot (gratis):**

1. Daftar di https://uptimerobot.com
2. New Monitor → **HTTP(s)**
3. URL: `https://yourdomain.com/api/health`
4. Monitoring interval: **5 minutes**
5. Save

Ini akan ping endpoint kamu tiap 5 menit → proses Node tetap hidup → Baileys tidak putus.

---

## 9. Connect WhatsApp

1. Buka `https://yourdomain.com/login`, login pakai akun super admin (password sudah di-hash otomatis)
2. Menu **Connect** → scan QR pakai HP
3. Cek folder `wa_sessions/` mulai berisi file → koneksi tersimpan

---

## 10. Backup rutin

Yang harus di-backup berkala:

- **MySQL dump** (mingguan, via hPanel → Backups)
- Folder **`wa_sessions/`** (kalau hilang, harus scan QR ulang)
- Folder **`public/wa-media/`** (media customer)

```bash
# Contoh backup manual via SSH
tar czf ~/backups/wa-$(date +%Y%m%d).tar.gz wa_sessions public/wa-media
```

---

## Troubleshooting

**Login berhasil tapi langsung redirect ke `/login`**
→ `AUTH_SECRET` di hPanel beda dengan saat token dibuat. Hapus cookie browser, login ulang.

**Login error "AUTH_SECRET is missing or shorter than 32 chars"**
→ Set env var `AUTH_SECRET` di hPanel, restart app.

**WA QR tidak muncul / WA disconnect terus**
→ Cek log Node.js di hPanel. Kalau ada error WebSocket, kemungkinan Cloud Hosting block outbound WS — upgrade ke VPS.

**Baileys disconnect tiap beberapa jam**
→ UptimeRobot tidak aktif, atau interval terlalu lama. Set ke 5 menit.

**Tabel `users` error "Data too long for column 'password'"**
→ Skrip migrasi sudah ALTER otomatis, tapi kalau gagal: `ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL;`

---

## Catatan teknis

- File `middleware.ts` di-deprecated di Next.js 16 (rencananya diganti `proxy.ts`). Masih bekerja, migrasi nanti aja.
- `serverExternalPackages` di `next.config.ts` sudah berisi Baileys + mysql2 — jangan dihapus, kalau dihapus build error.
- Polling client (kontak 5s, pesan 2s) cukup berat. Kalau load tinggi, perlonggar interval di `app/dashboard/audital-work/`.
