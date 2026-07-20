const fs = require('fs');
const path = require('path');
const db = require('../db');

/**
 * Migración 003: importa datos del data.json anterior (si existe)
 * hacia SQLite, una sola vez.
 */
function up() {
  return new Promise(function (resolve, reject) {
    const jsonPath = path.join(__dirname, '..', 'data.json');
    fs.readFile(jsonPath, 'utf8', function (err, raw) {
      if (err) {
        if (err.code === 'ENOENT') return resolve();
        return reject(err);
      }

      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        return reject(parseErr);
      }

      db.get('SELECT COUNT(*) AS total FROM peliculas')
        .then(function (row) {
          if (row && row.total > 0) {
            console.log('    (películas ya existen en SQLite; se omite importación JSON)');
            return resolve();
          }

          const insertar = function (sql, filas, mapFn) {
            return (filas || []).reduce(function (cadena, item) {
              return cadena.then(function () {
                return db.run(sql, mapFn(item));
              });
            }, Promise.resolve());
          };

          return insertar(
            'INSERT OR IGNORE INTO peliculas (id, titulo, director, anio) VALUES (?, ?, ?, ?)',
            data.peliculas,
            function (p) {
              return [p.id, p.titulo, p.director, p.anio];
            }
          )
            .then(function () {
              return insertar(
                'INSERT OR IGNORE INTO salas (id, nombre, capacidad) VALUES (?, ?, ?)',
                data.salas,
                function (s) {
                  return [s.id, s.nombre, s.capacidad];
                }
              );
            })
            .then(function () {
              return insertar(
                'INSERT OR IGNORE INTO funciones (id, peliculaId, salaId, fecha) VALUES (?, ?, ?, ?)',
                data.funciones,
                function (f) {
                  return [f.id, f.peliculaId, f.salaId, f.fecha];
                }
              );
            })
            .then(function () {
              return insertar(
                'INSERT OR IGNORE INTO reservaciones (id, funcionId, cliente, createdAt) VALUES (?, ?, ?, ?)',
                data.reservaciones,
                function (r) {
                  return [r.id, r.funcionId, r.cliente, r.createdAt];
                }
              );
            })
            .then(function () {
              console.log('    (datos importados desde data.json)');
              resolve();
            });
        })
        .catch(reject);
    });
  });
}

module.exports = { id: '003_importar_json', up };
