const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

function responder(res, result) {
  if (result.data !== undefined) {
    return res.status(result.status).json(result.data);
  }
  return res.status(result.status).json({ message: result.message });
}

router.post('/register', function (req, res) {
  return new Promise(function (resolve) {
    authController
      .registrar(req.body)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        res.status(500).json({ message: err.message });
        resolve();
      });
  });
});

router.post('/login', function (req, res) {
  return new Promise(function (resolve) {
    authController
      .login(req.body)
      .then(function (result) {
        if (result.status === 200 && result.data && result.data.token) {
          res.cookie('token', result.data.token, {
            httpOnly: false,
            maxAge: 8 * 60 * 60 * 1000
          });
        }
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        res.status(500).json({ message: err.message });
        resolve();
      });
  });
});

router.get('/me', verificarToken, function (req, res) {
  return new Promise(function (resolve) {
    authController
      .perfil(req.user.id)
      .then(function (result) {
        responder(res, result);
        resolve();
      })
      .catch(function (err) {
        res.status(500).json({ message: err.message });
        resolve();
      });
  });
});

module.exports = router;
