var express = require('express');
var router = express.Router();
var { verificarToken } = require('../middleware/auth');

/* GET users listing — requiere sesión */
router.get('/', verificarToken, function (req, res) {
  return new Promise(function (resolve) {
    res.json({
      message: 'Ruta protegida. Usuario autenticado.',
      user: {
        id: req.user.id,
        email: req.user.email,
        nombre: req.user.nombre,
        rol: req.user.rol
      }
    });
    resolve();
  });
});

module.exports = router;
