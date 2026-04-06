# AI WhatsApp Auto Audit System

**Baileys + Ollama** — Sistem audit otomatis untuk Customer Service Ayres berbasis AI.

---

## 1. Overview

### Tujuan

Membangun sistem web-based dashboard yang dapat:

- Mengambil chat WhatsApp secara otomatis via Baileys
- Menyimpan seluruh history percakapan
- **Mengklasifikasikan leads** (Hot / Warm / Cold)
- **Mengaudit kinerja CS/Sales** berdasarkan SOP Ayres
- Menampilkan semua data dalam dashboard interaktif (mirip WhatsApp Web)

### Value Utama

- Menggantikan fungsi sales supervisor
- Monitoring performa CS secara otomatis berdasarkan SOP
- Menghindari missed follow-up
- Klasifikasi leads otomatis untuk prioritas closing

---

## 2. Arsitektur Sistem

```
[ WhatsApp (Baileys) ]
          |
[ Backend API (Node.js / Express) ]
          |
[ Database (MongoDB) ]
          |
[ AI Engine (Ollama) ]
          |
[ Frontend Dashboard (Next.js) ]
```

---

## 3. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Node.js, Express.js, Baileys |
| AI Engine | Ollama (Llama 3 / Mistral) |
| Database | MongoDB |
| Frontend | Next.js / React |

---

## 4. Dashboard & UI

### 4.1 Layout Utama

```
+------------------+--------------------------------------------------+
|                  |  Sales Faiz - Detail                             |
|  SIDEBAR         |  179 chat · 2,669 pesan · 164 contacts    [31ms]|
|                  +------+-------------------------------------------+
|  Analisa Data    |      |                                           |
|   - Audital Work | LIST |     CHAT DETAIL                          |
|                  | KONTAK|    (bubble chat seperti WA)              |
|  General Menu    |      |    - teks, gambar, PDF, link              |
|   - List Sales/CS|      |                                           |
|   - Divisi       |      |                                           |
|   - Roles        |      |                                           |
|                  |      |                                           |
|  AI Settings     |      |                                           |
|   - AI Settings  |      |                                           |
+------------------+------+-------------------------------------------+
```

### 4.2 Sidebar Navigation

**Analisa Data**
- Audital Work — hasil analisa AI per sales/CS

**General Menu**
- List Sales/CS — daftar semua sales/CS yang di-monitor
- Divisi Perusahaan — grouping per divisi
- Roles — pengaturan hak akses (admin, manager, viewer)

**AI Settings**
- Konfigurasi model AI, token usage, parameter analisa

### 4.3 Halaman Per Sales/CS

Setiap sales/CS punya halaman detail sendiri:

- **Header**: nama sales, total chat, total pesan, total kontak, response time rata-rata
- **Tab Chat Details**: list kontak (kiri) + detail percakapan (kanan) — tampilan mirip WhatsApp Web
- **Tab Analytics**: skor SOP compliance, lead breakdown, trend performa
- **Search chat**: cari pesan dalam percakapan

### 4.4 Chat Viewer

Tampilan bubble chat mendukung:
- Pesan teks (masuk & keluar)
- Gambar & media
- File PDF / dokumen
- Link preview
- Timestamp per pesan
- Status pesan (sent, delivered, read)

---

## 5. Fitur Utama

### 5.1 Lead Classification

AI mengklasifikasikan customer ke 3 tier berdasarkan analisa percakapan:

**Hot Leads (Siap Beli)**

- Sudah tanya detail (harga, size, stok, ongkir)
- Sudah bandingkan produk
- Ada urgency ("butuh minggu ini", "buat event")
- Repeat customer
- Respon cepat & engaged
- **Strategi:** Fokus closing cepat, kasih urgency & kemudahan

**Warm Leads (Tertarik, Belum Yakin)**

- Baru tanya umum (model, bahan, fungsi)
- Masih bandingkan brand lain
- Belum ada urgency
- Interaksi ada tapi belum dalam
- **Strategi:** Edukasi, social proof, soft follow-up

**Cold Leads (Belum Siap)**

- Baru lihat-lihat
- Belum pernah interaksi serius
- Tidak respon / slow response
- **Strategi:** Awareness content, retargeting

### 5.2 CS Performance Audit

AI mengaudit kinerja CS berdasarkan **3 SOP Ayres**:

#### SOP 1 — Respon Pesan CS

| Parameter | Cara Deteksi |
|-----------|-------------|
| Respon awal WA < 5 menit | Selisih timestamp pesan customer vs balasan CS |
| Script inquiry awal digunakan | Deteksi mention "Deadline Aman", "Pattern Lab", positioning Ayres |
| Tidak over-promise | Deteksi kata "bisa kok pasti aman" tanpa data |
| Edukasi timeline 21 hari kerja | Cek penyampaian 3 syarat mulai produksi (DP 70%, proofing ACC, data fix) |
| Tanggal fix tertulis | Deteksi tanggal spesifik, bukan kata "sekitar" |
| Alur pemesanan disampaikan | Cek 7 langkah (Lead → DP Design → Design Fix → Proofing → DP Produksi → Pelunasan → Kirim) |
| Komitmen kompensasi disampaikan | Cek apakah tabel kompensasi keterlambatan diinformasikan |

#### SOP 2 — Penanganan Komplain

| Parameter | Cara Deteksi |
|-----------|-------------|
| Respon komplain < 5 menit | Timestamp analysis |
| Kategorisasi benar (minor/major/keterlambatan) | AI klasifikasi isi komplain |
| Kompensasi proaktif (tidak menunggu diminta) | Cek apakah CS langsung tawarkan kompensasi saat telat |
| Koordinasi produksi < 1 jam | Timestamp analysis |
| Follow up sampai selesai | Cek ada follow-up message setelah komplain |
| Update log komplain | Cek input ke sistem log |

#### SOP 3 — Survei Kepuasan Pelanggan

| Parameter | Cara Deteksi |
|-----------|-------------|
| Survei dikirim H+3 setelah barang diterima | Hitung dari tanggal kirim |
| 5 pertanyaan wajib ditanyakan | Pattern matching di chat |
| NPS action sesuai skor | Skor 9-10: minta testimoni. 7-8: tanyakan perbaikan. <=6: eskalasi CS senior |

---

## 6. Module System

### 6.1 WhatsApp Integration (Baileys)

- Login via QR
- Ambil chat real-time
- Sync history
- Session management

### 6.2 Chat Listener

Menangkap semua chat masuk & keluar:

```javascript
sock.ev.on("messages.upsert", async ({ messages }) => {
  const msg = messages[0];
  // Simpan ke database
});
```

### 6.3 Database Layer

**Collection: `users`**

```json
{
  "name": "Admin 1",
  "role": "admin",
  "divisi": "Sales",
  "wa_session_id": "session_xxx",
  "created_at": "2026-03-01"
}
```

**Collection: `chats`**

```json
{
  "cs_id": "user_xxx",
  "contact": "628xxxx",
  "name": "Customer A",
  "message": "berapa harga?",
  "media_type": "text",
  "media_url": null,
  "timestamp": "2026-03-10T10:00:00",
  "fromMe": false,
  "status": "read"
}
```

**Collection: `contacts`**

```json
{
  "cs_id": "user_xxx",
  "contact": "628xxxx",
  "name": "Customer A",
  "last_message": "berapa harga?",
  "last_message_at": "2026-03-10T10:00:00",
  "total_messages": 45,
  "lead_category": "hot"
}
```

**Collection: `lead_analysis`**

```json
{
  "contact": "628xxxx",
  "cs_id": "user_xxx",
  "category": "hot",
  "summary": "Customer tertarik paket A",
  "sentiment": "positive",
  "follow_up": "Kirim price list",
  "updated_at": "2026-04-04"
}
```

**Collection: `cs_audit`**

```json
{
  "cs_id": "user_xxx",
  "cs_name": "Admin 1",
  "period": "2026-03",
  "total_chats": 179,
  "total_messages": 2669,
  "total_contacts": 164,
  "response_time_avg_ms": 31000,
  "sop1_compliance": {
    "script_used": true,
    "timeline_educated": true,
    "date_written": true,
    "compensation_informed": true,
    "no_over_promise": true,
    "score": 90
  },
  "sop2_compliance": {
    "complaint_response_time": 240,
    "categorized_correctly": true,
    "proactive_compensation": true,
    "followed_up": true,
    "score": 85
  },
  "sop3_compliance": {
    "survey_sent": true,
    "survey_timing_correct": true,
    "nps_action_correct": true,
    "score": 80
  },
  "overall_score": 87
}
```

### 6.4 AI Engine (Ollama)

- Klasifikasi leads (Hot / Warm / Cold)
- Analisa intent & sentiment
- Audit kepatuhan SOP dari percakapan
- Generate insight & rekomendasi

---

## 7. Data Flow

### Real-time Flow

1. Chat masuk dari WhatsApp
2. Backend menerima event via Baileys
3. Data disimpan ke MongoDB
4. AI dipanggil (opsional realtime)
5. Hasil disimpan & dashboard update

### Batch Analysis Flow

1. Ambil data 30 hari terakhir
2. Group by contact per CS
3. Kirim ke AI untuk klasifikasi leads
4. Audit percakapan CS terhadap SOP
5. Hitung skor & simpan hasil analisa

---

## 8. Dashboard Pages

### 8.1 List Sales/CS
- Daftar semua sales/CS yang di-monitor
- Quick stats: total chat, response time, skor SOP
- Klik untuk masuk ke detail

### 8.2 Sales/CS Detail — Chat Details Tab
- List kontak (kiri) dengan preview pesan terakhir
- Detail percakapan (kanan) dengan bubble chat
- Search chat
- Header: total chat, total pesan, total kontak, avg response time

### 8.3 Sales/CS Detail — Analytics Tab
- Lead breakdown (Hot / Warm / Cold)
- Skor kepatuhan SOP 1, 2, 3
- Response time trend
- Follow-up pending
- Pelanggaran SOP yang terdeteksi
- Filter: 7 hari, 30 hari, custom range

### 8.4 Audital Work
- Hasil analisa AI per sales/CS
- Summary & rekomendasi
- Perbandingan performa antar CS

---

## 9. Limitasi Sistem

| Komponen | Limitasi |
|----------|---------|
| Baileys | Tidak menjamin full history, risiko banned |
| Ollama | Butuh resource besar, latency lebih tinggi |
| WhatsApp | Rate limit, anti spam system |

---

## 10. Security & Privacy

- Semua data disimpan lokal
- Tidak dikirim ke pihak ketiga
- Session WhatsApp terenkripsi
- Role-based access control (admin, manager, viewer)

---

## 11. Roadmap

| Phase | Fitur |
|-------|-------|
| **Phase 1 (MVP)** | Login QR, ambil chat, simpan DB, chat viewer (mirip WA Web), list sales/CS |
| **Phase 2** | Lead classification, CS audit berdasarkan SOP, analytics tab |
| **Phase 3** | Batch analysis 30 hari, audital work, notification system |
| **Phase 4 (Advanced)** | Auto follow-up, multi-agent AI, CS coaching recommendation |
