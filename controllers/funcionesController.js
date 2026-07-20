const db = require('../database/db');

function listar() {
  return new Promise(function (resolve, reject) {
    db.all('SELECT id, peliculaId, salaId, fecha FROM funciones')
      .then(function (funciones) {
        resolve({ status: 200, data: funciones });
      })
      .catch(reject);
  });
}

function filtrarPorFechas(inicio, fin) {
  return new Promise(function (resolve, reject) {
    if (!inicio || !fin) {
      return resolve({
        status: 400,
        message: 'Por favor provea fechas de inicio y fin en el query (inicio, fin).'
      });
    }

    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);
    if (Number.isNaN(inicioDate.getTime()) || Number.isNaN(finDate.getTime())) {
      return resolve({
        status: 400,
        message: 'Formato de fecha incorrecto. Use YYYY-MM-DD.'
      });
    }

    db.all('SELECT id, peliculaId, salaId, fecha FROM funciones')
      .then(function (funciones) {
        const funcionesFiltradas = funciones.filter(function (f) {
          const fechaFuncion = new Date(f.fecha);
          return fechaFuncion >= inicioDate && fechaFuncion <= finDate;
        });
        resolve({ status: 200, data: funcionesFiltradas });
      })
      .catch(reject);
  });
}

function crear(body) {
  return new Promise(function (resolve, reject) {
    const peliculaId = body && body.peliculaId != null ? String(body.peliculaId).trim() : '';
    const salaId = body && body.salaId != null ? String(body.salaId).trim() : '';
    const fecha = body && body.fecha != null ? String(body.fecha).trim() : '';

    if (!peliculaId || !salaId || !fecha) {
      return resolve({
        status: 400,
        message: 'Faltan datos obligatorios: peliculaId, salaId y fecha son requeridos.'
      });
    }
    if (Number.isNaN(new Date(fecha).getTime())) {
      return resolve({ status: 400, message: 'La fecha no tiene un formato válido.' });
    }

    Promise.all([
      db.get('SELECT id FROM peliculas WHERE id = ?', [peliculaId]),
      db.get('SELECT id FROM salas WHERE id = ?', [salaId])
    ])
      .then(function (resultados) {
        if (!resultados[0]) {
          return resolve({
            status: 400,
            message: 'peliculaId no corresponde a una película existente.'
          });
        }
        if (!resultados[1]) {
          return resolve({ status: 400, message: 'salaId no corresponde a una sala existente.' });
        }

        const nuevaFuncion = {
          id: db.generateId(),
          peliculaId: peliculaId,
          salaId: salaId,
          fecha: fecha
        };

        return db
          .run('INSERT INTO funciones (id, peliculaId, salaId, fecha) VALUES (?, ?, ?, ?)', [
            nuevaFuncion.id,
            nuevaFuncion.peliculaId,
            nuevaFuncion.salaId,
            nuevaFuncion.fecha
          ])
          .then(function () {
            resolve({ status: 201, data: nuevaFuncion });
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

    db.get('SELECT id, peliculaId, salaId, fecha FROM funciones WHERE id = ?', [id])
      .then(function (actual) {
        if (!actual) {
          return resolve({ status: 404, message: 'Función no encontrada' });
        }

        if (body.peliculaId != null) actual.peliculaId = String(body.peliculaId);
        if (body.salaId != null) actual.salaId = String(body.salaId);
        if (body.fecha != null) {
          if (Number.isNaN(new Date(body.fecha).getTime())) {
            return resolve({ status: 400, message: 'La fecha no tiene un formato válido.' });
          }
          actual.fecha = String(body.fecha);
        }

        return db
          .run('UPDATE funciones SET peliculaId = ?, salaId = ?, fecha = ? WHERE id = ?', [
            actual.peliculaId,
            actual.salaId,
            actual.fecha,
            id
          ])
          .then(function () {
            resolve({ status: 200, data: actual });
          });
      })
      .catch(reject);
  });
}

function quitarPelicula(id) {
  return new Promise(function (resolve, reject) {
    if (!id) {
      return resolve({ status: 400, message: 'El parámetro id es obligatorio.' });
    }
    db.get('SELECT id, peliculaId, salaId, fecha FROM funciones WHERE id = ?', [id])
      .then(function (funcion) {
        if (!funcion) {
          return resolve({ status: 404, message: 'Función no encontrada' });
        }
        return db.run('UPDATE funciones SET peliculaId = NULL WHERE id = ?', [id]).then(function () {
          funcion.peliculaId = null;
          resolve({
            status: 200,
            data: {
              message: 'Relación con película eliminada de la función',
              funcion: funcion
            }
          });
        });
      })
      .catch(reject);
  });
}

module.exports = {
  listar,
  filtrarPorFechas,
  crear,
  actualizar,
  quitarPelicula
};
