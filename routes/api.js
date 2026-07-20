const express = require('express');
const router = express.Router();
const { verificarToken, autorizarRoles } = require('../middleware/auth');
const peliculasController = require('../controllers/peliculasController');
const salasController = require('../controllers/salasController');
const funcionesController = require('../controllers/funcionesController');
const reservacionesController = require('../controllers/reservacionesController');

function responder(res, result) {
  if (result.data !== undefined) {
    return res.status(result.status).json(result.data);
  }
  return res.status(result.status).json({ message: result.message });
}

function manejarError(res, err) {
  res.status(500).json({ message: err.message || 'Error interno del servidor' });
}

/* Todas las rutas /api/* requieren sesión (JWT). Login/registro están en /api/auth */
router.use(verificarToken);

/* ---------- LECTURA (cualquier usuario autenticado) ---------- */

router.get('/peliculas', autorizarRoles('admin', 'empleado', 'cliente'), function (req, res) {
  return new Promise(function (resolve) {
    peliculasController
      .listar()
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.get('/peliculas/:id', autorizarRoles('admin', 'empleado', 'cliente'), function (req, res) {
  return new Promise(function (resolve) {
    peliculasController
      .obtenerPorId(req.params.id)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.get('/salas', autorizarRoles('admin', 'empleado'), function (req, res) {
  return new Promise(function (resolve) {
    salasController
      .listar()
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.get('/funciones', autorizarRoles('admin', 'empleado', 'cliente'), function (req, res) {
  return new Promise(function (resolve) {
    funcionesController
      .listar()
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.get('/funciones/fechas', autorizarRoles('admin', 'empleado', 'cliente'), function (req, res) {
  return new Promise(function (resolve) {
    funcionesController
      .filtrarPorFechas(req.query.inicio, req.query.fin)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

/* ---------- ADMIN (películas y salas) ---------- */

router.post('/peliculas', autorizarRoles('admin'), function (req, res) {
  return new Promise(function (resolve) {
    peliculasController
      .crear(req.body)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.put('/peliculas/:id', autorizarRoles('admin'), function (req, res) {
  return new Promise(function (resolve) {
    peliculasController
      .actualizar(req.params.id, req.body)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.delete('/peliculas/:id', autorizarRoles('admin'), function (req, res) {
  return new Promise(function (resolve) {
    peliculasController
      .eliminar(req.params.id)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.post('/salas', autorizarRoles('admin'), function (req, res) {
  return new Promise(function (resolve) {
    salasController
      .crear(req.body)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.put('/salas/:id', autorizarRoles('admin'), function (req, res) {
  return new Promise(function (resolve) {
    salasController
      .actualizar(req.params.id, req.body)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

/* ---------- EMPLEADO (funciones y control de reservaciones) ---------- */

router.post('/funciones', autorizarRoles('empleado'), function (req, res) {
  return new Promise(function (resolve) {
    funcionesController
      .crear(req.body)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.put('/funciones/:id', autorizarRoles('empleado'), function (req, res) {
  return new Promise(function (resolve) {
    funcionesController
      .actualizar(req.params.id, req.body)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.delete('/funciones/:id/pelicula', autorizarRoles('empleado'), function (req, res) {
  return new Promise(function (resolve) {
    funcionesController
      .quitarPelicula(req.params.id)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.get('/reservaciones/ultimas', autorizarRoles('empleado'), function (req, res) {
  return new Promise(function (resolve) {
    reservacionesController
      .ultimas()
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.delete('/reservaciones/:id', autorizarRoles('empleado'), function (req, res) {
  return new Promise(function (resolve) {
    reservacionesController
      .eliminar(req.params.id)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

/* ---------- CLIENTE (crear y editar reservaciones) ---------- */

router.post('/reservaciones', autorizarRoles('cliente'), function (req, res) {
  return new Promise(function (resolve) {
    reservacionesController
      .crear(req.body)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.put('/reservaciones/:id', autorizarRoles('cliente'), function (req, res) {
  return new Promise(function (resolve) {
    reservacionesController
      .actualizar(req.params.id, req.body)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.get('/reservaciones/:id', autorizarRoles('cliente'), function (req, res) {
  return new Promise(function (resolve) {
    reservacionesController
      .obtenerPorId(req.params.id)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

router.get('/reservaciones', autorizarRoles('cliente', 'empleado'), function (req, res) {
  return new Promise(function (resolve) {
    reservacionesController
      .listar()
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        manejarError(res, err);
        resolve();
      });
  });
});

module.exports = router;
