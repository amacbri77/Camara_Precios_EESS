const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
const databasePath = path.join(dataDir, 'captures.db');

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS captures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    capture_date TEXT NOT NULL,
    capture_time TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    user_name TEXT,
    user_email TEXT,
    image_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received'
  )
`);

const insertCapture = db.prepare(`
  INSERT INTO captures (
    created_at,
    capture_date,
    capture_time,
    latitude,
    longitude,
    accuracy,
    user_name,
    user_email,
    image_path,
    status
  ) VALUES (
    @created_at,
    @capture_date,
    @capture_time,
    @latitude,
    @longitude,
    @accuracy,
    @user_name,
    @user_email,
    @image_path,
    @status
  )
`);

function saveCapture(payload) {
  const result = insertCapture.run(payload);
  return result.lastInsertRowid;
}

module.exports = {
  db,
  databasePath,
  saveCapture,
};
