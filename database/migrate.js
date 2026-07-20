/**
 * Script de migración SQLite: crea tablas y datos iniciales
 * para desplegar el sistema en un servidor nuevo.
 *
 * Uso: npm run migrate
 */
require('dotenv').config();

const db = require('./db');
const config = require('../config');

const migraciones = [
  require('./migrations/001_estructura'),
  require('./migrations/002_usuarios_seed'),
  require('./migrations/003_importar_json')
];

function yaAplicada(id) {
  return db.get('SELECT id FROM migrations WHERE id = ?', [id]).then(function (row) {
    return !!row;
  }).catch(function () {
    return false;
  });
}

function marcarAplicada(id) {
  return db.run('INSERT OR IGNORE INTO migrations (id, applied_at) VALUES (?, ?)', [
    id,
    new Date().toISOString()
  ]);
}

function correrMigracion(migracion) {
  return yaAplicada(migracion.id).then(function (aplicada) {
    if (aplicada) {
      console.log('  [omitida] ' + migracion.id + ' (ya aplicada)');
      return true;
    }

    // La tabla migrations se crea en 001; antes de eso no podemos marcar.
    return migracion.up().then(function () {
      if (migracion.id === '001_estructura') {
        return marcarAplicada(migracion.id);
      }
      return marcarAplicada(migracion.id);
    }).then(function () {
      console.log('  [ok] ' + migracion.id);
    });
  });
}

function migrar() {
  console.log('Migrando base de datos SQLite...');
  console.log('  Motor: SQLite');
  console.log('  Host:', config.db.host + ':' + config.db.port);
  console.log('  Usuario DB:', config.db.user);
  console.log('  Nombre DB:', config.db.name);
  console.log('  Archivo:', db.dbPath);

  return migraciones
    .reduce(function (cadena, migracion) {
      return cadena.then(function () {
        return correrMigracion(migracion);
      });
    }, Promise.resolve())
    .then(function () {
      console.log('Migración completada.');
    })
    .catch(function (err) {
      console.error('Error en migración:', err.message);
      process.exitCode = 1;
    });
}

migrar();
