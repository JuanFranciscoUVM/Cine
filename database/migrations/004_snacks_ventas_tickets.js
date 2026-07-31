/**
 * Migración 004: snacks, ventas_snacks y mejora de tickets (precio).
 * Entidades del concesionario y boletería del cine.
 */
const db = require('../db');

function up() {
  return db
    .exec(
      `
    CREATE TABLE IF NOT EXISTS snacks (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ventas_snacks (
      id TEXT PRIMARY KEY,
      snackId TEXT NOT NULL,
      reservacionId TEXT,
      cliente TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      total REAL NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (snackId) REFERENCES snacks(id) ON DELETE RESTRICT,
      FOREIGN KEY (reservacionId) REFERENCES reservaciones(id) ON DELETE SET NULL
    );
  `
    )
    .then(function () {
      return db
        .exec(`ALTER TABLE tickets ADD COLUMN precio REAL NOT NULL DEFAULT 0;`)
        .catch(function () {
          // Columna ya existe en ejecuciones repetidas / DBs previas
          return true;
        });
    })
    .then(function () {
      return db.get('SELECT COUNT(*) AS n FROM snacks').then(function (row) {
        if (row && row.n > 0) {
          return true;
        }

        const snacks = [
          ['snk_palomitas', 'Palomitas grandes', 'comida', 8.5, 120],
          ['snk_nachos', 'Nachos con queso', 'comida', 7.0, 80],
          ['snk_refresco', 'Refresco 500ml', 'bebida', 4.5, 200],
          ['snk_combo', 'Combo cine (palomitas + refresco)', 'combo', 11.0, 60]
        ];

        return snacks
          .reduce(function (cadena, s) {
            return cadena.then(function () {
              return db.run(
                'INSERT OR IGNORE INTO snacks (id, nombre, categoria, precio, stock) VALUES (?, ?, ?, ?, ?)',
                s
              );
            });
          }, Promise.resolve());
      });
    });
}

module.exports = { id: '004_snacks_ventas_tickets', up };
