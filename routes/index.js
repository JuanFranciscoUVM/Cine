const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authController = require('../controllers/authController');
const {
  tokenOpcional,
  verificarTokenVista,
  autorizarRolesVista
} = require('../middleware/auth');

function renderConDatos(res, vista, extras) {
  return new Promise(function (resolve) {
    db.readData()
      .then(function (data) {
        const payload = Object.assign(
          { peliculas: data.peliculas, salas: data.salas },
          extras || {}
        );
        res.render(vista, payload);
        resolve();
      })
      .catch(function (err) {
        res.status(500).render('error', {
          message: 'Error al cargar datos',
          error: { status: 500, stack: err.message }
        });
        resolve();
      });
  });
}

/* ---------- Solo login / registro (sin sesión) ---------- */

router.get('/login', tokenOpcional, function (req, res) {
  return new Promise(function (resolve) {
    if (req.user) {
      res.redirect('/');
      return resolve();
    }
    res.render('login', { title: 'Iniciar sesión', user: null, error: null });
    resolve();
  });
});

router.post('/login', function (req, res) {
  return new Promise(function (resolve) {
    authController
      .login(req.body)
      .then(function (result) {
        if (result.status !== 200) {
          res.render('login', {
            title: 'Iniciar sesión',
            user: null,
            error: result.message
          });
          return resolve();
        }
        res.cookie('token', result.data.token, {
          httpOnly: false,
          maxAge: 8 * 60 * 60 * 1000
        });
        res.redirect('/');
        resolve();
      })
      .catch(function (err) {
        res.render('login', {
          title: 'Iniciar sesión',
          user: null,
          error: err.message
        });
        resolve();
      });
  });
});

router.get('/registro', tokenOpcional, function (req, res) {
  return new Promise(function (resolve) {
    if (req.user) {
      res.redirect('/');
      return resolve();
    }
    res.render('registro', { title: 'Registro', user: null, error: null });
    resolve();
  });
});

router.post('/registro', function (req, res) {
  return new Promise(function (resolve) {
    authController
      .registrar(req.body)
      .then(function (result) {
        if (result.status !== 201) {
          res.render('registro', {
            title: 'Registro',
            user: null,
            error: result.message
          });
          return resolve();
        }
        res.redirect('/login');
        resolve();
      })
      .catch(function (err) {
        res.render('registro', {
          title: 'Registro',
          user: null,
          error: err.message
        });
        resolve();
      });
  });
});

router.get('/logout', function (req, res) {
  return new Promise(function (resolve) {
    res.clearCookie('token');
    res.redirect('/login');
    resolve();
  });
});

/* ---------- Panel: requiere sesión ---------- */

router.get('/', verificarTokenVista, function (req, res) {
  return new Promise(function (resolve) {
    res.render('index', {
      title: 'CineVision Dashboard',
      user: req.user
    });
    resolve();
  });
});

router.get('/permisos', verificarTokenVista, function (req, res) {
  return new Promise(function (resolve) {
    res.render('permisos', { title: 'Roles y permisos', user: req.user });
    resolve();
  });
});

/* admin: gestiona catálogo | empleado/cliente: solo lectura */
router.get(
  '/peliculas',
  verificarTokenVista,
  autorizarRolesVista('admin', 'empleado', 'cliente'),
  function (req, res) {
    return renderConDatos(res, 'peliculas', {
      title: 'Películas',
      user: req.user
    });
  }
);

/* admin: gestiona salas | empleado: consulta capacidad para programar */
router.get(
  '/salas',
  verificarTokenVista,
  autorizarRolesVista('admin', 'empleado'),
  function (req, res) {
    return renderConDatos(res, 'salas', {
      title: 'Salas',
      user: req.user
    });
  }
);

/* empleado: programa funciones | admin/cliente: ven cartelera */
router.get(
  '/funciones',
  verificarTokenVista,
  autorizarRolesVista('admin', 'empleado', 'cliente'),
  function (req, res) {
    return new Promise(function (resolve) {
      db.readData()
        .then(function (data) {
          const funciones = data.funciones.map(function (f) {
            const peli =
              data.peliculas.find(function (p) {
                return p.id === f.peliculaId;
              }) || { titulo: 'Sin Asignar' };
            const sala =
              data.salas.find(function (s) {
                return s.id === f.salaId;
              }) || { nombre: 'Sin Asignar' };
            return Object.assign({}, f, { pelicula: peli.titulo, sala: sala.nombre });
          });

          res.render('funciones', {
            title: 'Funciones',
            user: req.user,
            funciones: funciones,
            peliculas: data.peliculas,
            salas: data.salas
          });
          resolve();
        })
        .catch(function (err) {
          res.status(500).render('error', {
            message: 'Error al cargar funciones',
            error: { status: 500, stack: err.message }
          });
          resolve();
        });
    });
  }
);

/* cliente: crea/edita | empleado: controla y elimina */
router.get(
  '/reservaciones',
  verificarTokenVista,
  autorizarRolesVista('cliente', 'empleado'),
  function (req, res) {
    return new Promise(function (resolve) {
      db.readData()
        .then(function (data) {
          const reservaciones = data.reservaciones.map(function (r) {
            const funcion =
              data.funciones.find(function (f) {
                return f.id === r.funcionId;
              }) || {};
            const peli =
              data.peliculas.find(function (p) {
                return p.id === funcion.peliculaId;
              }) || { titulo: '?' };
            return Object.assign({}, r, { pelicula: peli.titulo, fecha: funcion.fecha });
          });

          res.render('reservaciones', {
            title: 'Reservaciones',
            user: req.user,
            reservaciones: reservaciones,
            funciones: data.funciones.map(function (f) {
              const p =
                data.peliculas.find(function (peli) {
                  return peli.id === f.peliculaId;
                }) || { titulo: 'ID:' + f.id };
              return Object.assign({}, f, { tituloPelicula: p.titulo });
            })
          });
          resolve();
        })
        .catch(function (err) {
          res.status(500).render('error', {
            message: 'Error al cargar reservaciones',
            error: { status: 500, stack: err.message }
          });
          resolve();
        });
    });
  }
);

module.exports = router;
