const db = require('../database/db');

function listar() {
  return new Promise(function (resolve, reject) {
    db.all('SELECT id, titulo, director, anio FROM peliculas')
      .then(function (peliculas) {
        resolve({ status: 200, data: peliculas });
      })
      .catch(reject);
  });
}

function obtenerPorId(id) {
  return new Promise(function (resolve, reject) {
    if (!id) {
      return resolve({ status: 400, message: 'El parámetro id es obligatorio.' });
    }
    db.get('SELECT id, titulo, director, anio FROM peliculas WHERE id = ?', [id])
      .then(function (pelicula) {
        if (!pelicula) {
          return resolve({ status: 404, message: 'Película no encontrada' });
        }
        resolve({ status: 200, data: pelicula });
      })
      .catch(reject);
  });
}

function crear(body) {
  return new Promise(function (resolve, reject) {
    const titulo = body && body.titulo != null ? String(body.titulo).trim() : '';
    const director = body && body.director != null ? String(body.director).trim() : '';
    const anio = body && body.anio != null ? Number(body.anio) : NaN;

    if (!titulo || !director || Number.isNaN(anio)) {
      return resolve({
        status: 400,
        message:
          'Faltan datos obligatorios o formato incorrecto: titulo (texto), director (texto) y anio (número) son requeridos.'
      });
    }

    const nuevaPelicula = {
      id: db.generateId(),
      titulo: titulo,
      director: director,
      anio: anio
    };

    db.run('INSERT INTO peliculas (id, titulo, director, anio) VALUES (?, ?, ?, ?)', [
      nuevaPelicula.id,
      nuevaPelicula.titulo,
      nuevaPelicula.director,
      nuevaPelicula.anio
    ])
      .then(function () {
        resolve({ status: 201, data: nuevaPelicula });
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

    db.get('SELECT id, titulo, director, anio FROM peliculas WHERE id = ?', [id])
      .then(function (actual) {
        if (!actual) {
          return resolve({ status: 404, message: 'Película no encontrada' });
        }

        if (body.titulo != null) actual.titulo = String(body.titulo).trim();
        if (body.director != null) actual.director = String(body.director).trim();
        if (body.anio != null) {
          const anio = Number(body.anio);
          if (Number.isNaN(anio)) {
            return resolve({ status: 400, message: 'El campo anio debe ser un número.' });
          }
          actual.anio = anio;
        }

        return db
          .run('UPDATE peliculas SET titulo = ?, director = ?, anio = ? WHERE id = ?', [
            actual.titulo,
            actual.director,
            actual.anio,
            id
          ])
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
    db.get('SELECT id FROM peliculas WHERE id = ?', [id])
      .then(function (pelicula) {
        if (!pelicula) {
          return resolve({ status: 404, message: 'Película no encontrada' });
        }
        return db.run('DELETE FROM peliculas WHERE id = ?', [id]).then(function () {
          resolve({ status: 200, message: 'Película eliminada correctamente' });
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
