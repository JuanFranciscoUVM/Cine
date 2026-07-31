const db = require('../database/db');

function listar() {
  return new Promise(function (resolve, reject) {
    db.all('SELECT id, nombre, categoria, precio, stock FROM snacks ORDER BY nombre')
      .then(function (snacks) {
        resolve({ status: 200, data: snacks });
      })
      .catch(reject);
  });
}

function obtenerPorId(id) {
  return new Promise(function (resolve, reject) {
    if (!id) {
      return resolve({ status: 400, message: 'El parámetro id es obligatorio.' });
    }
    db.get('SELECT id, nombre, categoria, precio, stock FROM snacks WHERE id = ?', [id])
      .then(function (snack) {
        if (!snack) {
          return resolve({ status: 404, message: 'Snack no encontrado' });
        }
        resolve({ status: 200, data: snack });
      })
      .catch(reject);
  });
}

function crear(body) {
  return new Promise(function (resolve, reject) {
    const nombre = body && body.nombre != null ? String(body.nombre).trim() : '';
    const categoria =
      body && body.categoria != null ? String(body.categoria).trim().toLowerCase() : '';
    const precio = body && body.precio != null ? Number(body.precio) : NaN;
    const stock = body && body.stock != null ? Number(body.stock) : NaN;

    const categoriasValidas = ['comida', 'bebida', 'combo', 'dulce'];
    if (!nombre || !categoria || Number.isNaN(precio) || Number.isNaN(stock)) {
      return resolve({
        status: 400,
        message:
          'Faltan datos: nombre, categoria (comida|bebida|combo|dulce), precio y stock son requeridos.'
      });
    }
    if (categoriasValidas.indexOf(categoria) === -1) {
      return resolve({
        status: 400,
        message: 'categoria debe ser: comida, bebida, combo o dulce.'
      });
    }
    if (precio < 0 || stock < 0 || !Number.isInteger(stock)) {
      return resolve({
        status: 400,
        message: 'precio ≥ 0 y stock debe ser un entero ≥ 0.'
      });
    }

    const nuevo = {
      id: db.generateId(),
      nombre: nombre,
      categoria: categoria,
      precio: precio,
      stock: stock
    };

    db.run(
      'INSERT INTO snacks (id, nombre, categoria, precio, stock) VALUES (?, ?, ?, ?, ?)',
      [nuevo.id, nuevo.nombre, nuevo.categoria, nuevo.precio, nuevo.stock]
    )
      .then(function () {
        resolve({ status: 201, data: nuevo });
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

    db.get('SELECT id, nombre, categoria, precio, stock FROM snacks WHERE id = ?', [id])
      .then(function (actual) {
        if (!actual) {
          return resolve({ status: 404, message: 'Snack no encontrado' });
        }

        if (body.nombre != null) actual.nombre = String(body.nombre).trim();
        if (body.categoria != null) {
          const categoria = String(body.categoria).trim().toLowerCase();
          const categoriasValidas = ['comida', 'bebida', 'combo', 'dulce'];
          if (categoriasValidas.indexOf(categoria) === -1) {
            return resolve({
              status: 400,
              message: 'categoria debe ser: comida, bebida, combo o dulce.'
            });
          }
          actual.categoria = categoria;
        }
        if (body.precio != null) {
          const precio = Number(body.precio);
          if (Number.isNaN(precio) || precio < 0) {
            return resolve({ status: 400, message: 'El campo precio debe ser un número ≥ 0.' });
          }
          actual.precio = precio;
        }
        if (body.stock != null) {
          const stock = Number(body.stock);
          if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
            return resolve({
              status: 400,
              message: 'El campo stock debe ser un entero ≥ 0.'
            });
          }
          actual.stock = stock;
        }

        if (!actual.nombre) {
          return resolve({ status: 400, message: 'El nombre no puede quedar vacío.' });
        }

        return db
          .run(
            'UPDATE snacks SET nombre = ?, categoria = ?, precio = ?, stock = ? WHERE id = ?',
            [actual.nombre, actual.categoria, actual.precio, actual.stock, id]
          )
          .then(function () {
            resolve({ status: 200, data: actual });
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
    db.get('SELECT id FROM snacks WHERE id = ?', [id])
      .then(function (snack) {
        if (!snack) {
          return resolve({ status: 404, message: 'Snack no encontrado' });
        }
        return db
          .get('SELECT id FROM ventas_snacks WHERE snackId = ? LIMIT 1', [id])
          .then(function (venta) {
            if (venta) {
              return resolve({
                status: 400,
                message: 'No se puede eliminar: el snack tiene ventas asociadas.'
              });
            }
            return db.run('DELETE FROM snacks WHERE id = ?', [id]).then(function () {
              resolve({ status: 200, message: 'Snack eliminado correctamente' });
            });
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
