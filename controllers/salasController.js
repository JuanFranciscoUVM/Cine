const db = require('../database/db');

function listar() {
  return new Promise(function (resolve, reject) {
    db.all('SELECT id, nombre, capacidad FROM salas')
      .then(function (salas) {
        resolve({ status: 200, data: salas });
      })
      .catch(reject);
  });
}

function crear(body) {
  return new Promise(function (resolve, reject) {
    const nombre = body && body.nombre != null ? String(body.nombre).trim() : '';
    const capacidad = body && body.capacidad != null ? Number(body.capacidad) : NaN;

    if (!nombre || Number.isNaN(capacidad)) {
      return resolve({
        status: 400,
        message:
          'Faltan datos obligatorios o formato incorrecto: nombre (texto) y capacidad (número) son requeridos.'
      });
    }

    const nuevaSala = {
      id: db.generateId(),
      nombre: nombre,
      capacidad: capacidad
    };

    db.run('INSERT INTO salas (id, nombre, capacidad) VALUES (?, ?, ?)', [
      nuevaSala.id,
      nuevaSala.nombre,
      nuevaSala.capacidad
    ])
      .then(function () {
        resolve({ status: 201, data: nuevaSala });
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

    db.get('SELECT id, nombre, capacidad FROM salas WHERE id = ?', [id])
      .then(function (actual) {
        if (!actual) {
          return resolve({ status: 404, message: 'Sala no encontrada' });
        }

        if (body.nombre != null) actual.nombre = String(body.nombre).trim();
        if (body.capacidad != null) {
          const capacidad = Number(body.capacidad);
          if (Number.isNaN(capacidad)) {
            return resolve({ status: 400, message: 'El campo capacidad debe ser un número.' });
          }
          actual.capacidad = capacidad;
        }

        return db
          .run('UPDATE salas SET nombre = ?, capacidad = ? WHERE id = ?', [
            actual.nombre,
            actual.capacidad,
            id
          ])
          .then(function () {
            resolve({ status: 200, data: actual });
          });
      })
      .catch(reject);
  });
}

module.exports = {
  listar,
  crear,
  actualizar
};
