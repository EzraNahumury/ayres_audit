import mysql from "mysql2/promise";

/**
 * Inisialisasi database & tabel.
 * Dipanggil sekali saat server start via API /api/db/init
 */
export async function initDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    multipleStatements: true,
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS ayres_audit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE ayres_audit`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id          BIGINT AUTO_INCREMENT PRIMARY KEY,
      jid         VARCHAR(50)  NOT NULL UNIQUE,
      phone       VARCHAR(20)  NOT NULL,
      name        VARCHAR(255) DEFAULT NULL,
      updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id            BIGINT AUTO_INCREMENT PRIMARY KEY,
      message_id    VARCHAR(255)  NOT NULL,
      contact_jid   VARCHAR(50)   NOT NULL,
      sender_jid    VARCHAR(50)   NOT NULL,
      from_me       TINYINT(1)    NOT NULL DEFAULT 0,
      message_type  VARCHAR(20)   NOT NULL DEFAULT 'text',
      body          TEXT          DEFAULT NULL,
      media_url     VARCHAR(500)  DEFAULT NULL,
      timestamp     TIMESTAMP     NOT NULL,
      created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_message_id (message_id),
      INDEX idx_contact (contact_jid),
      INDEX idx_timestamp (timestamp)
    ) ENGINE=InnoDB
  `);

  await conn.query(`
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
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS cs_audit (
      id                BIGINT AUTO_INCREMENT PRIMARY KEY,
      contact_jid       VARCHAR(50)  NOT NULL,
      period            VARCHAR(7)   NOT NULL,
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
    ) ENGINE=InnoDB
  `);

  await conn.end();
  return { success: true };
}
