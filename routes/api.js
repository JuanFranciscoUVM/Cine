const express = require('express');
const router = express.Router();
const db = require('../database/db');

// --- POST ENDPOINTS (Create / Ingresar datos y relacionar) ---

// 1. POST /api/peliculas - Crear película
router.post('/peliculas', (req, res) => {
  const data = db.readData();
  const nuevaPelicula = {
    id: db.generateId(),
    titulo: req.body.titulo || 'Sin título',
    director: req.body.director || 'Desconocido',
    anio: req.body.anio || 2024
  };
  data.peliculas.push(nuevaPelicula);
  db.writeData(data);
  res.status(201).json(nuevaPelicula);
});

// 2. POST /api/salas - Crear sala
router.post('/salas', (req, res) => {
  const data = db.readData();
  const nuevaSala = {
    id: db.generateId(),
    nombre: req.body.nombre || 'Sala X',
    capacidad: req.body.capacidad || 50
  };
  data.salas.push(nuevaSala);
  db.writeData(data);
  res.status(201).json(nuevaSala);
});

// 3. POST /api/funciones - Crear función (Relaciona Pelicula, Sala)
router.post('/funciones', (req, res) => {
  const data = db.readData();
  const nuevaFuncion = {
    id: db.generateId(),
    peliculaId: req.body.peliculaId || null,
    salaId: req.body.salaId || null,
    fecha: req.body.fecha || new Date().toISOString() // formato YYYY-MM-DD
  };
  data.funciones.push(nuevaFuncion);
  db.writeData(data);
  res.status(201).json(nuevaFuncion);
});

// 4. POST /api/reservaciones - Crear reservación
router.post('/reservaciones', (req, res) => {
    const data = db.readData();
    const nuevaReservacion = {
        id: db.generateId(),
        funcionId: req.body.funcionId || null,
        cliente: req.body.cliente || 'Desconocido',
        createdAt: new Date().toISOString()
    };
    data.reservaciones.push(nuevaReservacion);
    db.writeData(data);
    res.status(201).json(nuevaReservacion);
});


// --- GET ENDPOINTS (Consultar / Filtros / Orden) ---

// 5. GET /api/peliculas/:id - Mostrar elemento por su id
router.get('/peliculas/:id', (req, res) => {
  const data = db.readData();
  const pelicula = data.peliculas.find(p => p.id === req.params.id);
  if (pelicula) {
    res.json(pelicula);
  } else {
    res.status(404).json({ message: 'Película no encontrada' });
  }
});

// 6. GET /api/funciones/fechas - Mostrar elementos en un rango de fecha
// Requiere query parameters: ?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
router.get('/funciones/fechas', (req, res) => {
  const data = db.readData();
  const { inicio, fin } = req.query;
  if (!inicio || !fin) {
    return res.status(400).json({ message: 'Por favor provea fechas de inicio y fin en el query.' });
  }

  const inicioDate = new Date(inicio);
  const finDate = new Date(fin);

  const funcionesFiltradas = data.funciones.filter(f => {
    const fechaFuncion = new Date(f.fecha);
    return fechaFuncion >= inicioDate && fechaFuncion <= finDate;
  });

  res.json(funcionesFiltradas);
});

// 7. GET /api/reservaciones/ultimas - Mostrar los últimos 5 elementos
router.get('/reservaciones/ultimas', (req, res) => {
  const data = db.readData();
  // Ordenar por createdAt de más reciente a más antiguo
  const ordenadas = data.reservaciones.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  // Tomar los últimos 5 (los 5 más recientes)
  const top5 = ordenadas.slice(0, 5);
  res.json(top5);
});


// --- PUT ENDPOINTS (Modificar) ---

// 8. PUT /api/peliculas/:id - Modificar datos de una entidad
router.put('/peliculas/:id', (req, res) => {
  const data = db.readData();
  const index = data.peliculas.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    data.peliculas[index] = { ...data.peliculas[index], ...req.body };
    db.writeData(data);
    res.json(data.peliculas[index]);
  } else {
    res.status(404).json({ message: 'Película no encontrada' });
  }
});

// 9. PUT /api/salas/:id - Modificar datos de una sala
router.put('/salas/:id', (req, res) => {
  const data = db.readData();
  const index = data.salas.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    data.salas[index] = { ...data.salas[index], ...req.body };
    db.writeData(data);
    res.json(data.salas[index]);
  } else {
    res.status(404).json({ message: 'Sala no encontrada' });
  }
});

// 10. PUT /api/funciones/:id - Modificar datos de una funcion
router.put('/funciones/:id', (req, res) => {
    const data = db.readData();
    const index = data.funciones.findIndex(f => f.id === req.params.id);
    if (index !== -1) {
      data.funciones[index] = { ...data.funciones[index], ...req.body };
      db.writeData(data);
      res.json(data.funciones[index]);
    } else {
      res.status(404).json({ message: 'Función no encontrada' });
    }
});


// --- DELETE ENDPOINTS (Eliminar / Quitar relaciones) ---

// 11. DELETE /api/peliculas/:id - Eliminar elementos de una entidad
router.delete('/peliculas/:id', (req, res) => {
  const data = db.readData();
  const index = data.peliculas.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    data.peliculas.splice(index, 1);
    db.writeData(data);
    res.json({ message: 'Película eliminada correctamente' });
  } else {
    res.status(404).json({ message: 'Película no encontrada' });
  }
});

// 12. DELETE /api/reservaciones/:id - Eliminar reservacion
router.delete('/reservaciones/:id', (req, res) => {
  const data = db.readData();
  const index = data.reservaciones.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    data.reservaciones.splice(index, 1);
    db.writeData(data);
    res.json({ message: 'Reservación eliminada correctamente' });
  } else {
    res.status(404).json({ message: 'Reservación no encontrada' });
  }
});

// 13. DELETE /api/funciones/:id/pelicula - Eliminar la relación entre elementos
// Remueve la película de la función
router.delete('/funciones/:id/pelicula', (req, res) => {
  const data = db.readData();
  const index = data.funciones.findIndex(f => f.id === req.params.id);
  if (index !== -1) {
    // Romper la relación
    data.funciones[index].peliculaId = null;
    db.writeData(data);
    res.json({ message: 'Relación con película eliminada de la función', funcion: data.funciones[index] });
  } else {
    res.status(404).json({ message: 'Función no encontrada' });
  }
});

module.exports = router;
