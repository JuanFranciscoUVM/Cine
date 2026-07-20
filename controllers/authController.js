const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const config = require('../config');

function validarEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function registrar(body) {
  return new Promise(function (resolve, reject) {
    const email = body && body.email ? String(body.email).trim().toLowerCase() : '';
    const nombre = body && body.nombre ? String(body.nombre).trim() : '';
    const password = body && body.password ? String(body.password) : '';
    const rol = body && body.rol ? String(body.rol).trim().toLowerCase() : 'cliente';

    if (!email || !nombre || !password) {
      return resolve({
        status: 400,
        message: 'Faltan datos obligatorios: email, nombre y password son requeridos.'
      });
    }
    if (!validarEmail(email)) {
      return resolve({ status: 400, message: 'El email no tiene un formato válido.' });
    }
    if (password.length < 6) {
      return resolve({ status: 400, message: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (['admin', 'empleado', 'cliente'].indexOf(rol) === -1) {
      return resolve({ status: 400, message: 'Rol inválido. Use: admin, empleado o cliente.' });
    }

    db.get('SELECT id FROM usuarios WHERE email = ?', [email])
      .then(function (existe) {
        if (existe) {
          return resolve({ status: 409, message: 'Ya existe un usuario con ese email.' });
        }
        return bcrypt.hash(password, 10).then(function (hash) {
          const usuario = {
            id: db.generateId(),
            email: email,
            nombre: nombre,
            password: hash,
            rol: rol,
            createdAt: new Date().toISOString()
          };
          return db
            .run(
              'INSERT INTO usuarios (id, email, nombre, password, rol, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
              [usuario.id, usuario.email, usuario.nombre, usuario.password, usuario.rol, usuario.createdAt]
            )
            .then(function () {
              resolve({
                status: 201,
                data: {
                  id: usuario.id,
                  email: usuario.email,
                  nombre: usuario.nombre,
                  rol: usuario.rol
                }
              });
            });
        });
      })
      .catch(reject);
  });
}

function login(body) {
  return new Promise(function (resolve, reject) {
    const email = body && body.email ? String(body.email).trim().toLowerCase() : '';
    const password = body && body.password ? String(body.password) : '';

    if (!email || !password) {
      return resolve({
        status: 400,
        message: 'Faltan datos obligatorios: email y password son requeridos.'
      });
    }

    db.get('SELECT id, email, nombre, password, rol FROM usuarios WHERE email = ?', [email])
      .then(function (usuario) {
        if (!usuario) {
          return resolve({ status: 401, message: 'Credenciales incorrectas.' });
        }
        return bcrypt.compare(password, usuario.password).then(function (ok) {
          if (!ok) {
            return resolve({ status: 401, message: 'Credenciales incorrectas.' });
          }
          const payload = {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol
          };
          const token = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
          });
          resolve({
            status: 200,
            data: {
              message: 'Inicio de sesión exitoso',
              token: token,
              user: payload
            }
          });
        });
      })
      .catch(reject);
  });
}

function perfil(userId) {
  return new Promise(function (resolve, reject) {
    db.get('SELECT id, email, nombre, rol FROM usuarios WHERE id = ?', [userId])
      .then(function (usuario) {
        if (!usuario) {
          return resolve({ status: 404, message: 'Usuario no encontrado.' });
        }
        resolve({ status: 200, data: usuario });
      })
      .catch(reject);
  });
}

module.exports = {
  registrar,
  login,
  perfil
};
