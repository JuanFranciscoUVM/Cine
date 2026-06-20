const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    const db = await dbPromise;
    await initDb(db);
  }
  return dbPromise;
}

async function initDb(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS peliculas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      director TEXT,
      anio INTEGER,
      genero TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS salas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      capacidad INTEGER NOT NULL
    );
  `);
}

module.exports = {
  getDb
};
