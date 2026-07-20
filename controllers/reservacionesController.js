const db = require('../database/db');

function listar() {
  return new Promise(function (resolve, reject) {
    db.all('SELECT id, funcionId, cliente, createdAt FROM reservaciones')
      .then(function (reservaciones) {
        resolve({ status: 200, data: reservaciones });
      })
      .catch(reject);
  });
}

function obtenerPorId(id) {
  return new Promise(function (resolve, reject) {
    if (!id) {
      return resolve({ status: 400, message: 'El parámetro id es obligatorio.' });
    }
    db.get('SELECT id, funcionId, cliente, createdAt FROM reservaciones WHERE id = ?', [id])
      .then(function (reservacion) {
        if (!reservacion) {
          return resolve({ status: 404, message: 'Reservación no encontrada' });
        }
        resolve({ status: 200, data: reservacion });
      })
      .catch(reject);
  });
}

function ultimas() {
  return new Promise(function (resolve, reject) {
    db.all(
      'SELECT id, funcionId, cliente, createdAt FROM reservaciones ORDER BY createdAt DESC LIMIT 5'
    )
      .then(function (rows) {
        resolve({ status: 200, data: rows });
      })
      .catch(reject);
  });
}

function crear(body) {
  return new Promise(function (resolve, reject) {
    const funcionId = body && body.funcionId != null ? String(body.funcionId).trim() : '';
    const cliente = body && body.cliente != null ? String(body.cliente).trim() : '';

    if (!funcionId || !cliente) {
      return resolve({
        status: 400,
        message: 'Faltan datos obligatorios: funcionId y cliente son requeridos.'
      });
    }

    db.get('SELECT id FROM funciones WHERE id = ?', [funcionId])
      .then(function (funcion) {
        if (!funcion) {
          return resolve({
            status: 400,
            message: 'funcionId no corresponde a una función existente.'
          });
        }

        const nuevaReservacion = {
          id: db.generateId(),
          funcionId: funcionId,
          cliente: cliente,
          createdAt: new Date().toISOString()
        };

        return db
          .run(
            'INSERT INTO reservaciones (id, funcionId, cliente, createdAt) VALUES (?, ?, ?, ?)',
            [
              nuevaReservacion.id,
              nuevaReservacion.funcionId,
              nuevaReservacion.cliente,
              nuevaReservacion.createdAt
            ]
          )
          .then(function () {
            resolve({ status: 201, data: nuevaReservacion });
          });
      })
      .catch(reject);
  });
}

function actualizar(id, body) {
  return new Promise(function (resolve, reject) {
    if (!id) {
      return resolve({ status: 400, message: 'El parámetro id es obligatorio.' });
    }
    if (!body || typeof body !== 'object') {
      return resolve({
        status: 400,
        message: 'Debe enviar un cuerpo JSON con los campos a modificar.'
      });
    }

    const cliente = body.cliente != null ? String(body.cliente).trim() : '';
    const funcionId = body.funcionId != null ? String(body.funcionId).trim() : null;

    if (!cliente && !funcionId) {
      return resolve({
        status: 400,
        message: 'Debe enviar al menos un campo a modificar: cliente o funcionId.'
      });
    }

    db.get('SELECT id, funcionId, cliente, createdAt FROM reservaciones WHERE id = ?', [id])
      .then(function (actual) {
        if (!actual) {
          return resolve({ status: 404, message: 'Reservación no encontrada' });
        }

        const aplicar = function () {
          if (cliente) actual.cliente = cliente;
          if (funcionId) actual.funcionId = funcionId;

          return db
            .run('UPDATE reservaciones SET funcionId = ?, cliente = ? WHERE id = ?', [
              actual.funcionId,
              actual.cliente,
              id
            ])
            .then(function () {
              resolve({ status: 200, data: actual });
            });
        };

        if (funcionId) {
          return db.get('SELECT id FROM funciones WHERE id = ?', [funcionId]).then(function (funcion) {
            if (!funcion) {
              return resolve({
                status: 400,
                message: 'funcionId no corresponde a una función existente.'
              });
            }
            return aplicar();
          });
        }
        return aplicar();
      })
      .catch(reject);
  });
}

function eliminar(id) {
  return new Promise(function (resolve, reject) {
    if (!id) {
      return resolve({ status: 400, message: 'El parámetro id es obligatorio.' });
    }
    db.get('SELECT id FROM reservaciones WHERE id = ?', [id])
      .then(function (reservacion) {
        if (!reservacion) {
          return resolve({ status: 404, message: 'Reservación no encontrada' });
        }
        return db.run('DELETE FROM reservaciones WHERE id = ?', [id]).then(function () {
          resolve({ status: 200, message: 'Reservación eliminada correctamente' });
        });
      })
      .catch(reject);
  });
}

module.exports = {
  listar,
  obtenerPorId,
  ultimas,
  crear,
  actualizar,
  eliminar
};
