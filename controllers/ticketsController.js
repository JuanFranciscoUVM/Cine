const db = require('../database/db');

function listar() {
  return new Promise(function (resolve, reject) {
    db.all(
      `SELECT t.id, t.reservacionId, t.asiento, t.precio,
              r.cliente, r.funcionId
       FROM tickets t
       LEFT JOIN reservaciones r ON r.id = t.reservacionId`
    )
      .then(function (tickets) {
        resolve({ status: 200, data: tickets });
      })
      .catch(reject);
  });
}

function obtenerPorId(id) {
  return new Promise(function (resolve, reject) {
    if (!id) {
      return resolve({ status: 400, message: 'El parámetro id es obligatorio.' });
    }
    db.get(
      `SELECT t.id, t.reservacionId, t.asiento, t.precio,
              r.cliente, r.funcionId
       FROM tickets t
       LEFT JOIN reservaciones r ON r.id = t.reservacionId
       WHERE t.id = ?`,
      [id]
    )
      .then(function (ticket) {
        if (!ticket) {
          return resolve({ status: 404, message: 'Ticket no encontrado' });
        }
        resolve({ status: 200, data: ticket });
      })
      .catch(reject);
  });
}

function crear(body) {
  return new Promise(function (resolve, reject) {
    const reservacionId =
      body && body.reservacionId != null ? String(body.reservacionId).trim() : '';
    const asiento = body && body.asiento != null ? String(body.asiento).trim() : '';
    const precio = body && body.precio != null ? Number(body.precio) : NaN;

    if (!reservacionId || !asiento || Number.isNaN(precio) || precio < 0) {
      return resolve({
        status: 400,
        message:
          'Faltan datos o formato incorrecto: reservacionId, asiento (texto) y precio (número ≥ 0) son requeridos.'
      });
    }

    db.get('SELECT id FROM reservaciones WHERE id = ?', [reservacionId])
      .then(function (reservacion) {
        if (!reservacion) {
          return resolve({ status: 404, message: 'La reservación indicada no existe.' });
        }

        return db
          .get('SELECT id FROM tickets WHERE reservacionId = ? AND asiento = ?', [
            reservacionId,
            asiento
          ])
          .then(function (duplicado) {
            if (duplicado) {
              return resolve({
                status: 400,
                message: 'Ya existe un ticket con ese asiento en la reservación.'
              });
            }

            const nuevo = {
              id: db.generateId(),
              reservacionId: reservacionId,
              asiento: asiento,
              precio: precio
            };

            return db
              .run(
                'INSERT INTO tickets (id, reservacionId, asiento, precio) VALUES (?, ?, ?, ?)',
                [nuevo.id, nuevo.reservacionId, nuevo.asiento, nuevo.precio]
              )
              .then(function () {
                resolve({ status: 201, data: nuevo });
              });
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

    db.get('SELECT id, reservacionId, asiento, precio FROM tickets WHERE id = ?', [id])
      .then(function (actual) {
        if (!actual) {
          return resolve({ status: 404, message: 'Ticket no encontrado' });
        }

        const siguiente = {
          reservacionId:
            body.reservacionId != null
              ? String(body.reservacionId).trim()
              : actual.reservacionId,
          asiento: body.asiento != null ? String(body.asiento).trim() : actual.asiento,
          precio: body.precio != null ? Number(body.precio) : actual.precio
        };

        if (!siguiente.asiento || Number.isNaN(siguiente.precio) || siguiente.precio < 0) {
          return resolve({
            status: 400,
            message: 'asiento (texto) y precio (número ≥ 0) son obligatorios.'
          });
        }

        return db
          .get('SELECT id FROM reservaciones WHERE id = ?', [siguiente.reservacionId])
          .then(function (reservacion) {
            if (!reservacion) {
              return resolve({ status: 404, message: 'La reservación indicada no existe.' });
            }

            return db
              .run(
                'UPDATE tickets SET reservacionId = ?, asiento = ?, precio = ? WHERE id = ?',
                [siguiente.reservacionId, siguiente.asiento, siguiente.precio, id]
              )
              .then(function () {
                resolve({
                  status: 200,
                  data: Object.assign({ id: id }, siguiente)
                });
              });
          });
      })
      .catch(reject);
  });
}

function eliminar(id) {
  return new Promise(function (resolve, reject) {
    if (!id) {
      return resolve({ status: 400, message: 'El parámetro id es obligatorio.' });
    }
    db.get('SELECT id FROM tickets WHERE id = ?', [id])
      .then(function (ticket) {
        if (!ticket) {
          return resolve({ status: 404, message: 'Ticket no encontrado' });
        }
        return db.run('DELETE FROM tickets WHERE id = ?', [id]).then(function () {
          resolve({ status: 200, message: 'Ticket eliminado correctamente' });
        });
      })
      .catch(reject);
  });
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
