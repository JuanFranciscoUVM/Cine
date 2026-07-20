const jwt = require('jsonwebtoken');
const config = require('../config');

function extraerToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

function verificarToken(req, res, next) {
  return new Promise(function (resolve) {
    const token = extraerToken(req);
    if (!token) {
      res.status(401).json({
        message: 'Advertencia: debe iniciar sesión para acceder a este recurso.'
      });
      return resolve();
    }

    jwt.verify(token, config.jwt.secret, function (err, decoded) {
      if (err) {
        res.status(401).json({
          message: 'Advertencia: token inválido o expirado. Inicie sesión nuevamente.'
        });
        return resolve();
      }
      req.user = decoded;
      next();
      resolve();
    });
  });
}

function tokenOpcional(req, res, next) {
  return new Promise(function (resolve) {
    const token = extraerToken(req);
    if (!token) {
      req.user = null;
      next();
      return resolve();
    }

    jwt.verify(token, config.jwt.secret, function (err, decoded) {
      req.user = err ? null : decoded;
      next();
      resolve();
    });
  });
}

function autorizarRoles() {
  const rolesPermitidos = Array.prototype.slice.call(arguments);

  return function (req, res, next) {
    return new Promise(function (resolve) {
      if (!req.user || !req.user.rol) {
        res.status(401).json({
          message: 'Advertencia: no autenticado. Inicie sesión.'
        });
        return resolve();
      }

      if (rolesPermitidos.indexOf(req.user.rol) === -1) {
        res.status(403).json({
          message:
            'Advertencia: su rol (' +
            req.user.rol +
            ') no está autorizado para realizar esta operación. Roles permitidos: ' +
            rolesPermitidos.join(', ') +
            '.'
        });
        return resolve();
      }

      next();
      resolve();
    });
  };
}

/** Para vistas EJS: si no hay token o rol, redirige con mensaje */
function verificarTokenVista(req, res, next) {
  return new Promise(function (resolve) {
    const token = extraerToken(req);
    if (!token) {
      res.redirect('/login');
      return resolve();
    }

    jwt.verify(token, config.jwt.secret, function (err, decoded) {
      if (err) {
        res.clearCookie('token');
        res.redirect('/login');
        return resolve();
      }
      req.user = decoded;
      next();
      resolve();
    });
  });
}

function autorizarRolesVista() {
  const rolesPermitidos = Array.prototype.slice.call(arguments);

  return function (req, res, next) {
    return new Promise(function (resolve) {
      if (!req.user || rolesPermitidos.indexOf(req.user.rol) === -1) {
        const rolActual = req.user && req.user.rol ? req.user.rol : 'sin rol';
        res.status(403).render('error', {
          message:
            'Advertencia: su rol (' +
            rolActual +
            ') no puede acceder a esta sección del panel. Roles permitidos: ' +
            rolesPermitidos.join(', ') +
            '.',
          error: { status: 403, stack: '' }
        });
        return resolve();
      }
      next();
      resolve();
    });
  };
}

module.exports = {
  verificarToken,
  tokenOpcional,
  autorizarRoles,
  verificarTokenVista,
  autorizarRolesVista,
  extraerToken
};
