const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('../config');

const dbPath = path.isAbsolute(config.db.path)
  ? config.db.path
  : path.join(__dirname, '..', config.db.path.replace(/^\.\//, ''));

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function run(sql, params) {
  return new Promise(function (resolve, reject) {
    try {
      const stmt = sqlite.prepare(sql);
      const info = stmt.run.apply(stmt, params || []);
      resolve(info);
    } catch (err) {
      reject(err);
    }
  });
}

function get(sql, params) {
  return new Promise(function (resolve, reject) {
    try {
      const stmt = sqlite.prepare(sql);
      const row = stmt.get.apply(stmt, params || []);
      resolve(row || null);
    } catch (err) {
      reject(err);
    }
  });
}

function all(sql, params) {
  return new Promise(function (resolve, reject) {
    try {
      const stmt = sqlite.prepare(sql);
      const rows = stmt.all.apply(stmt, params || []);
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
}

function exec(sql) {
  return new Promise(function (resolve, reject) {
    try {
      sqlite.exec(sql);
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
}

/** Carga todas las colecciones (útil para vistas EJS). */
function readData() {
  return new Promise(function (resolve, reject) {
    try {
      resolve({
        peliculas: sqlite.prepare('SELECT id, titulo, director, anio FROM peliculas').all(),
        salas: sqlite.prepare('SELECT id, nombre, capacidad FROM salas').all(),
        funciones: sqlite.prepare('SELECT id, peliculaId, salaId, fecha FROM funciones').all(),
        tickets: sqlite.prepare('SELECT id, reservacionId, asiento FROM tickets').all(),
        reservaciones: sqlite
          .prepare('SELECT id, funcionId, cliente, createdAt FROM reservaciones')
          .all(),
        usuarios: sqlite
          .prepare('SELECT id, email, nombre, password, rol, createdAt FROM usuarios')
          .all()
      });
    } catch (err) {
      reject(err);
    }
  });
}

function getDbInfo() {
  return {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    name: config.db.name,
    path: dbPath,
    engine: 'sqlite'
  };
}

function close() {
  return new Promise(function (resolve, reject) {
    try {
      sqlite.close();
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  sqlite,
  run,
  get,
  all,
  exec,
  readData,
  generateId,
  getDbInfo,
  close,
  dbPath
};
