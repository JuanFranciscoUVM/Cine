const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * Migración 002: usuarios semilla con contraseñas cifradas (bcrypt).
 *
 *   admin@cine.com    / admin123    -> admin
 *   empleado@cine.com / empleado123 -> empleado
 *   cliente@cine.com  / cliente123  -> cliente
 */
function up() {
  return new Promise(function (resolve, reject) {
    const seeds = [
      { email: 'admin@cine.com', nombre: 'Administrador', password: 'admin123', rol: 'admin' },
      { email: 'empleado@cine.com', nombre: 'Empleado Cine', password: 'empleado123', rol: 'empleado' },
      { email: 'cliente@cine.com', nombre: 'Cliente Demo', password: 'cliente123', rol: 'cliente' }
    ];

    Promise.all(
      seeds.map(function (u) {
        return bcrypt.hash(u.password, 10).then(function (hash) {
          return {
            id: db.generateId(),
            email: u.email,
            nombre: u.nombre,
            password: hash,
            rol: u.rol,
            createdAt: new Date().toISOString()
          };
        });
      })
    )
      .then(function (usuarios) {
        return usuarios.reduce(function (cadena, u) {
          return cadena.then(function () {
            return db.get('SELECT id FROM usuarios WHERE email = ?', [u.email]).then(function (existe) {
              if (existe) return true;
              return db.run(
                'INSERT INTO usuarios (id, email, nombre, password, rol, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                [u.id, u.email, u.nombre, u.password, u.rol, u.createdAt]
              );
            });
          });
        }, Promise.resolve());
      })
      .then(resolve)
      .catch(reject);
  });
}

module.exports = { id: '002_usuarios_seed', up };
