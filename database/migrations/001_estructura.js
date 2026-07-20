/**
 * Migración 001: crea las tablas SQLite del sistema.
 */
const db = require('../db');

function up() {
  return db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('admin', 'empleado', 'cliente')),
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS peliculas (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      director TEXT NOT NULL,
      anio INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS salas (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      capacidad INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS funciones (
      id TEXT PRIMARY KEY,
      peliculaId TEXT,
      salaId TEXT,
      fecha TEXT NOT NULL,
      FOREIGN KEY (peliculaId) REFERENCES peliculas(id) ON DELETE SET NULL,
      FOREIGN KEY (salaId) REFERENCES salas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reservaciones (
      id TEXT PRIMARY KEY,
      funcionId TEXT,
      cliente TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (funcionId) REFERENCES funciones(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      reservacionId TEXT,
      asiento TEXT,
      FOREIGN KEY (reservacionId) REFERENCES reservaciones(id) ON DELETE CASCADE
    );
  `);
}

module.exports = { id: '001_estructura', up };
