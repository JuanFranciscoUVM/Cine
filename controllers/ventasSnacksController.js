const db = require('../database/db');

function listar() {
  return new Promise(function (resolve, reject) {
    db.all(
      `SELECT v.id, v.snackId, v.reservacionId, v.cliente, v.cantidad, v.total, v.createdAt,
              s.nombre AS snackNombre, s.categoria AS snackCategoria
       FROM ventas_snacks v
       LEFT JOIN snacks s ON s.id = v.snackId
       ORDER BY v.createdAt DESC`
    )
      .then(function (ventas) {
        resolve({ status: 200, data: ventas });
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
      `SELECT v.id, v.snackId, v.reservacionId, v.cliente, v.cantidad, v.total, v.createdAt,
              s.nombre AS snackNombre
       FROM ventas_snacks v
       LEFT JOIN snacks s ON s.id = v.snackId
       WHERE v.id = ?`,
      [id]
    )
      .then(function (venta) {
        if (!venta) {
          return resolve({ status: 404, message: 'Venta de snack no encontrada' });
        }
        resolve({ status: 200, data: venta });
      })
      .catch(reject);
  });
}

function crear(body) {
  return new Promise(function (resolve, reject) {
    const snackId = body && body.snackId != null ? String(body.snackId).trim() : '';
    const cliente = body && body.cliente != null ? String(body.cliente).trim() : '';
    const cantidad = body && body.cantidad != null ? Number(body.cantidad) : NaN;
    const reservacionId =
      body && body.reservacionId != null && String(body.reservacionId).trim() !== ''
        ? String(body.reservacionId).trim()
        : null;

    if (!snackId || !cliente || Number.isNaN(cantidad) || !Number.isInteger(cantidad) || cantidad < 1) {
      return resolve({
        status: 400,
        message:
          'Faltan datos: snackId, cliente y cantidad (entero ≥ 1) son requeridos. reservacionId es opcional.'
      });
    }

    db.get('SELECT id, nombre, precio, stock FROM snacks WHERE id = ?', [snackId])
      .then(function (snack) {
        if (!snack) {
          return resolve({ status: 404, message: 'El snack indicado no existe.' });
        }
        if (snack.stock < cantidad) {
          return resolve({
            status: 400,
            message: 'Stock insuficiente. Disponible: ' + snack.stock
          });
        }

        const validarReservacion = reservacionId
          ? db.get('SELECT id FROM reservaciones WHERE id = ?', [reservacionId])
          : Promise.resolve({ id: true });

        return validarReservacion.then(function (reservacion) {
          if (!reservacion) {
            return resolve({ status: 404, message: 'La reservación indicada no existe.' });
          }

          const nueva = {
            id: db.generateId(),
            snackId: snackId,
            reservacionId: reservacionId,
            cliente: cliente,
            cantidad: cantidad,
            total: Math.round(snack.precio * cantidad * 100) / 100,
            createdAt: new Date().toISOString()
          };

          return db
            .run(
              `INSERT INTO ventas_snacks
               (id, snackId, reservacionId, cliente, cantidad, total, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                nueva.id,
                nueva.snackId,
                nueva.reservacionId,
                nueva.cliente,
                nueva.cantidad,
                nueva.total,
                nueva.createdAt
              ]
            )
            .then(function () {
              return db.run('UPDATE snacks SET stock = stock - ? WHERE id = ?', [
                cantidad,
                snackId
              ]);
            })
            .then(function () {
              resolve({ status: 201, data: Object.assign({}, nueva, { snackNombre: snack.nombre }) });
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

    db.get(
      'SELECT id, snackId, reservacionId, cliente, cantidad, total, createdAt FROM ventas_snacks WHERE id = ?',
      [id]
    )
      .then(function (actual) {
        if (!actual) {
          return resolve({ status: 404, message: 'Venta de snack no encontrada' });
        }

        const nuevoCliente =
          body.cliente != null ? String(body.cliente).trim() : actual.cliente;
        const nuevaCantidad =
          body.cantidad != null ? Number(body.cantidad) : actual.cantidad;
        const nuevoSnackId =
          body.snackId != null ? String(body.snackId).trim() : actual.snackId;
        let nuevaReservacionId = actual.reservacionId;
        if (body.reservacionId !== undefined) {
          nuevaReservacionId =
            body.reservacionId != null && String(body.reservacionId).trim() !== ''
              ? String(body.reservacionId).trim()
              : null;
        }

        if (!nuevoCliente) {
          return resolve({ status: 400, message: 'El cliente no puede quedar vacío.' });
        }
        if (
          Number.isNaN(nuevaCantidad) ||
          !Number.isInteger(nuevaCantidad) ||
          nuevaCantidad < 1
        ) {
          return resolve({ status: 400, message: 'cantidad debe ser un entero ≥ 1.' });
        }

        return db
          .get('SELECT id, precio, stock FROM snacks WHERE id = ?', [nuevoSnackId])
          .then(function (snack) {
            if (!snack) {
              return resolve({ status: 404, message: 'El snack indicado no existe.' });
            }

            const delta =
              nuevoSnackId === actual.snackId
                ? nuevaCantidad - actual.cantidad
                : nuevaCantidad;
            const stockDisponible =
              nuevoSnackId === actual.snackId
                ? snack.stock + actual.cantidad
                : snack.stock;

            if (delta > 0 && snack.stock < delta) {
              return resolve({
                status: 400,
                message: 'Stock insuficiente para la nueva cantidad. Disponible: ' + snack.stock
              });
            }
            if (nuevoSnackId !== actual.snackId && stockDisponible < nuevaCantidad) {
              return resolve({
                status: 400,
                message: 'Stock insuficiente en el snack destino.'
              });
            }

            const validarReservacion = nuevaReservacionId
              ? db.get('SELECT id FROM reservaciones WHERE id = ?', [nuevaReservacionId])
              : Promise.resolve({ id: true });

            return validarReservacion.then(function (reservacion) {
              if (!reservacion) {
                return resolve({ status: 404, message: 'La reservación indicada no existe.' });
              }

              const total = Math.round(snack.precio * nuevaCantidad * 100) / 100;

              // Devolver stock del snack anterior y descontar el nuevo
              const ajustarStock = function () {
                if (nuevoSnackId === actual.snackId) {
                  return db.run('UPDATE snacks SET stock = stock - ? WHERE id = ?', [
                    delta,
                    actual.snackId
                  ]);
                }
                return db
                  .run('UPDATE snacks SET stock = stock + ? WHERE id = ?', [
                    actual.cantidad,
                    actual.snackId
                  ])
                  .then(function () {
                    return db.run('UPDATE snacks SET stock = stock - ? WHERE id = ?', [
                      nuevaCantidad,
                      nuevoSnackId
                    ]);
                  });
              };

              return ajustarStock()
                .then(function () {
                  return db.run(
                    `UPDATE ventas_snacks
                     SET snackId = ?, reservacionId = ?, cliente = ?, cantidad = ?, total = ?
                     WHERE id = ?`,
                    [
                      nuevoSnackId,
                      nuevaReservacionId,
                      nuevoCliente,
                      nuevaCantidad,
                      total,
                      id
                    ]
                  );
                })
                .then(function () {
                  resolve({
                    status: 200,
                    data: {
                      id: id,
                      snackId: nuevoSnackId,
                      reservacionId: nuevaReservacionId,
                      cliente: nuevoCliente,
                      cantidad: nuevaCantidad,
                      total: total,
                      createdAt: actual.createdAt
                    }
                  });
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
    db.get('SELECT id, snackId, cantidad FROM ventas_snacks WHERE id = ?', [id])
      .then(function (venta) {
        if (!venta) {
          return resolve({ status: 404, message: 'Venta de snack no encontrada' });
        }
        return db
          .run('DELETE FROM ventas_snacks WHERE id = ?', [id])
          .then(function () {
            return db.run('UPDATE snacks SET stock = stock + ? WHERE id = ?', [
              venta.cantidad,
              venta.snackId
            ]);
          })
          .then(function () {
            resolve({ status: 200, message: 'Venta de snack eliminada correctamente' });
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
