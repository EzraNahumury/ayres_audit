CREATE DATABASE IF NOT EXISTS ayres_audit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ayres_audit;

-- =============================================
-- Tabel kontak (setiap nomor WA yang pernah chat)
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  jid         VARCHAR(50)  NOT NULL UNIQUE,          -- 628xxx@s.whatsapp.net
  phone       VARCHAR(20)  NOT NULL,                 -- 628xxx
  name        VARCHAR(255) DEFAULT NULL,             -- push name dari WA
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- Tabel pesan (semua chat masuk & keluar)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  message_id    VARCHAR(255)  NOT NULL,              -- ID pesan dari WA
  contact_jid   VARCHAR(50)   NOT NULL,              -- JID kontak
  sender_jid    VARCHAR(50)   NOT NULL,              -- siapa yang kirim
  from_me       TINYINT(1)    NOT NULL DEFAULT 0,    -- 1 = keluar, 0 = masuk
  message_type  VARCHAR(20)   NOT NULL DEFAULT 'text', -- text, image, document, video, audio, sticker
  body          TEXT          DEFAULT NULL,           -- isi pesan teks
  media_url     VARCHAR(500)  DEFAULT NULL,           -- path file media jika ada
  timestamp     TIMESTAMP     NOT NULL,               -- waktu pesan
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_message_id (message_id),
  INDEX idx_contact (contact_jid),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

-- =============================================
-- Tabel lead analysis (hasil AI)
-- =============================================
CREATE TABLE IF NOT EXISTS lead_analysis (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  contact_jid VARCHAR(50)   NOT NULL,
  category    ENUM('hot','warm','cold') NOT NULL,
  summary     TEXT          DEFAULT NULL,
  sentiment   VARCHAR(20)   DEFAULT NULL,
  follow_up   TEXT          DEFAULT NULL,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_contact (contact_jid),
  INDEX idx_category (category)
) ENGINE=InnoDB;

-- =============================================
-- Tabel audit CS (skor kepatuhan SOP)
-- =============================================
CREATE TABLE IF NOT EXISTS cs_audit (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  contact_jid       VARCHAR(50)  NOT NULL,
  period            VARCHAR(7)   NOT NULL,           -- '2026-03'
  response_time_ms  INT          DEFAULT NULL,
  script_used       TINYINT(1)   DEFAULT 0,
  timeline_educated TINYINT(1)   DEFAULT 0,
  date_written      TINYINT(1)   DEFAULT 0,
  compensation_info TINYINT(1)   DEFAULT 0,
  no_over_promise   TINYINT(1)   DEFAULT 0,
  overall_score     INT          DEFAULT 0,
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_contact (contact_jid),
  INDEX idx_period (period)
) ENGINE=InnoDB;
