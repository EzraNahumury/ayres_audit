# Ayres Audit

> **Platform manajemen & audit Customer Service WhatsApp berbasis AI untuk Ayres Apparel**

Ayres Audit dirancang untuk menyelesaikan tantangan utama operasional CS yang menggunakan satu nomor WhatsApp bisnis secara bersama-sama — memastikan setiap percakapan ditangani oleh CS yang tepat, beban kerja merata, dan performa tim dapat diaudit secara real-time.

---

## Daftar Isi

- [Latar Belakang](#latar-belakang)
- [Use Case](#use-case)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Alur Distribusi Kontak](#alur-distribusi-kontak)
- [Alur Autentikasi & Akses](#alur-autentikasi--akses)
- [Fitur](#fitur)
- [Tech Stack](#tech-stack)

---

## Latar Belakang

Ketika satu nomor WhatsApp bisnis dioperasikan oleh banyak CS secara bersamaan, timbul tiga masalah utama:

| Masalah | Dampak |
|---|---|
| CS membalas chat yang sama dua kali | Pelanggan bingung, kesan tidak profesional |
| Beban kerja tidak merata | CS tertentu overload, yang lain idle |
| Tidak ada rekam jejak SOP | Sulit mengevaluasi kualitas pelayanan |

Ayres Audit hadir sebagai solusi terpadu yang menghubungkan WhatsApp, manajemen CS, dan analisa AI dalam satu platform.

---

## Use Case

```
┌─────────────────────────────────────────────────────────────────┐
│                        AYRES AUDIT SYSTEM                       │
│                                                                 │
│   ┌──────────────┐         ┌──────────────────────────────┐    │
│   │   PELANGGAN  │         │          SUPER ADMIN         │    │
│   └──────┬───────┘         └──────────────┬───────────────┘    │
│          │                                │                     │
│          │ Chat via WA           ┌────────┴────────┐           │
│          │                       │  • Kelola CS     │           │
│          ▼                       │  • Kelola Roles  │           │
│   ┌──────────────┐               │  • Lihat semua   │           │
│   │   WHATSAPP   │               │    distribusi    │           │
│   │   GATEWAY    │               │  • Analisa AI    │           │
│   └──────┬───────┘               │  • Balas semua   │           │
│          │                       │    kontak        │           │
│          │ Auto-save             └─────────────────┘           │
│          ▼                                                       │
│   ┌──────────────┐         ┌──────────────────────────────┐    │
│   │   DATABASE   │         │        CS AGENT              │    │
│   │   (MySQL)    │         └──────────────┬───────────────┘    │
│   └──────┬───────┘                        │                     │
│          │                       ┌────────┴────────┐           │
│          │ Auto-assign           │  • Toggle online │           │
│          ▼                       │  • Balas kontak  │           │
│   ┌──────────────┐               │    milik sendiri │           │
│   │ CS YANG      │               │  • Lihat data    │           │
│   │ ONLINE &     │               │    customer      │           │
│   │ LOAD TERKECIL│               │  • Lihat AI      │           │
│   └──────────────┘               │    summary       │           │
│                                  └─────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                                                                 │
│   Dashboard   │   Audital Work   │   Agent AI   │   Person CS  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP / Fetch API
┌───────────────────────────▼─────────────────────────────────────┐
│                      NEXT.JS 16 SERVER                          │
│                                                                 │
│  /api/whatsapp  │  /api/contacts  │  /api/distribution         │
│  /api/messages  │  /api/cs-persons│  /api/agent                │
│  /api/auth      │  /api/roles     │  /api/db/init              │
└──────────┬──────────────────────────────────┬───────────────────┘
           │                                  │
┌──────────▼──────────┐            ┌──────────▼──────────┐
│   BAILEYS (WA)      │            │    OLLAMA AI API     │
│                     │            │                      │
│  • Terima pesan     │            │  • Analisa lead      │
│  • Kirim pesan      │            │  • Jawab pertanyaan  │
│  • QR connect       │            │  • Audit SOP         │
└──────────┬──────────┘            └─────────────────────┘
           │
┌──────────▼──────────┐
│     MYSQL DATABASE  │
│                     │
│  contacts           │
│  messages           │
│  contact_assignments│
│  cs_attendance      │
│  users / roles      │
│  lead_analysis      │
└─────────────────────┘
```

---

## Alur Distribusi Kontak

```
 Customer kirim pesan WA
          │
          ▼
 ┌─────────────────┐
 │  Baileys menerima│
 │  pesan masuk     │
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │  Simpan kontak  │
 │  & pesan ke DB  │
 └────────┬────────┘
          │
          ▼
 ┌─────────────────────────────┐
 │  Kontak sudah pernah chat?  │
 └──────────┬──────────────────┘
            │
     ┌──────┴──────┐
    YA             TIDAK
     │               │
     ▼               ▼
 Tetap ke      Cari CS online
 CS yang       dengan beban
 sama          terkecil
                    │
                    ▼
            ┌───────────────┐
            │ Ada CS online?│
            └───────┬───────┘
                    │
             ┌──────┴──────┐
            YA             TIDAK
             │               │
             ▼               ▼
        Assign ke        Kontak masuk
        CS tersebut      antrian (akan
                         di-assign saat
                         ada CS online)
```

---

## Alur Autentikasi & Akses

```
 User buka web
      │
      ▼
 ┌──────────────┐
 │  Cek cookie  │──── Tidak ada ────▶ Redirect /login
 │  auth_token  │
 └──────┬───────┘
        │ Ada
        ▼
 ┌──────────────────┐
 │  Decode token    │
 │  cek permissions │
 └──────┬───────────┘
        │
   ┌────┴────┐
  "all"    specific
   │        permission
   ▼             │
 Akses        Cek route
 semua        vs permission
 halaman           │
              ┌────┴────┐
            Sesuai    Tidak sesuai
              │             │
              ▼             ▼
           Lanjut      Redirect ke
                       halaman yang
                       diizinkan
```

---

## Fitur

### 1. Audital Work
Monitor dan balas chat WhatsApp secara real-time.

- Semua CS melihat seluruh daftar kontak yang masuk
- Hanya CS yang **di-assign** ke kontak tersebut yang bisa membalas
- CS lain melihat notifikasi *"Ditangani oleh [nama CS]"* dan input pesan terkunci
- Badge nama CS tampil di setiap kontak pada daftar
- Auto-refresh pesan setiap **2 detik**, kontak setiap **5 detik**

---

### 2. CS Distribution
Visualisasi distribusi beban kerja CS secara real-time dan historis.

- Kartu per CS menampilkan jumlah kontak dan persentase beban
- **Filter tanggal** — lihat siapa yang online dan berapa kontak baru yang ditangani pada hari tertentu
- Distribusi kontak baru berjalan **otomatis** tanpa intervensi manual
- Logika distribusi: CS online + beban kontak paling sedikit = mendapat assignment berikutnya

---

### 3. Person CS
Manajemen data CS agent.

- Tambah CS baru — sistem otomatis membuat role CS dengan permission yang sesuai
- Toggle **Online / Offline** per CS
- CS hanya bisa toggle status diri sendiri; Admin bisa toggle semua CS
- Distribusi hanya dikirim ke CS berstatus **Online**
- Statistik beban kerja: total kontak, rata-rata kontak per CS, load bar visual
- Hapus CS — kontak yang di-assign otomatis masuk antrian ulang

---

### 4. Data Customer
Direktori lengkap semua pelanggan yang pernah berinteraksi.

- Nama, nomor WhatsApp, waktu chat pertama, chat terakhir, total pesan
- **Edit nama kontak** inline langsung dari tabel
- Resolusi nomor LID (format internal WhatsApp) ke nomor telepon nyata

---

### 5. Ayres Agent
AI assistant dengan konteks penuh dari database bisnis.

- Menjawab pertanyaan tentang customer, riwayat chat, dan tren
- Mengetahui data CS — siapa online, siapa handle customer mana, beban kerja
- Analisa lead: klasifikasi **Hot / Warm / Cold** berdasarkan pola percakapan
- Audit kepatuhan SOP CS
- Ekspor jawaban ke **PDF**
- Riwayat sesi percakapan tersimpan

---

### 6. Roles
Manajemen hak akses berbasis role.

- Buat role dengan kombinasi permission menu yang fleksibel
- Permission tersedia: `connect_wa` · `audital_work` · `data_customer` · `ayres_agent` · `roles` · `ai_settings`
- Role CS default: `audital_work` + `data_customer`
- Super Admin: akses penuh tanpa batasan (`all`)

---

### 7. Connect WhatsApp
Penghubung nomor WhatsApp bisnis ke sistem.

- Scan QR code dari layar menggunakan WhatsApp di HP
- Setelah terhubung, semua chat masuk dan keluar tersimpan otomatis
- Status koneksi real-time tampil di header Audital Work

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | MySQL via mysql2/promise |
| WhatsApp | Baileys (@whiskeysockets/baileys) |
| AI | Ollama (gpt-oss:120b-cloud) |
| Auth | Cookie-based (Base64 JWT sederhana) |
| Styling | Tailwind CSS + Inline Styles |
| Icons | Lucide React |
| PDF Export | jsPDF + html2canvas |

---

*Ayres Audit — built for Ayres Apparel CS Operations*
