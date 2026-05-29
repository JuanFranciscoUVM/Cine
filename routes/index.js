const express = require('express');
const router = express.Router();
const db = require('../database/db');

/* GET home page (View 1) */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CineVision Dashboard' });
});

/* GET peliculas (View 2) */
router.get('/peliculas', function(req, res, next) {
  const data = db.readData();
  res.render('peliculas', { title: 'Películas', peliculas: data.peliculas });
});

/* GET salas (View 3) */
router.get('/salas', function(req, res, next) {
  const data = db.readData();
  res.render('salas', { title: 'Salas', salas: data.salas });
});

/* GET funciones (View 4) */
router.get('/funciones', function(req, res, next) {
  const data = db.readData();
  // Join data
  const funciones = data.funciones.map(f => {
    const peli = data.peliculas.find(p => p.id === f.peliculaId) || { titulo: 'Sin Asignar' };
    const sala = data.salas.find(s => s.id === f.salaId) || { nombre: 'Sin Asignar' };
    return { ...f, pelicula: peli.titulo, sala: sala.nombre };
  });

  res.render('funciones', { 
    title: 'Funciones', 
    funciones, 
    peliculas: data.peliculas, 
    salas: data.salas 
  });
});

/* GET reservaciones (View 5) */
router.get('/reservaciones', function(req, res, next) {
  const data = db.readData();
  const reservaciones = data.reservaciones.map(r => {
    const funcion = data.funciones.find(f => f.id === r.funcionId) || {};
    const peli = data.peliculas.find(p => p.id === funcion.peliculaId) || { titulo: '?' };
    return { ...r, pelicula: peli.titulo, fecha: funcion.fecha };
  });
  
  res.render('reservaciones', { 
    title: 'Reservaciones', 
    reservaciones,
    funciones: data.funciones.map(f => {
      const p = data.peliculas.find(p => p.id === f.peliculaId) || {titulo: 'ID:'+f.id};
      return {...f, tituloPelicula: p.titulo};
    })
  });
});

module.exports = router;
