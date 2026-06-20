const express = require('express');
const router = express.Router();
const db = require('../database/db');

const Pelicula = require('../models/Pelicula');
const Sala = require('../models/Sala');

// --- POST ENDPOINTS (Create / Ingresar datos y relacionar) ---

// 1. POST /api/peliculas - Crear película
router.post('/peliculas', async (req, res) => {
  try {
    const pelicula = new Pelicula(
      null, 
      req.body.titulo || 'Sin título', 
      req.body.director || 'Desconocido', 
      req.body.anio || 2024,
      req.body.genero || 'Drama'
    );
    await pelicula.save();
    res.status(201).json(pelicula);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. POST /api/salas - Crear sala
router.post('/salas', async (req, res) => {
  try {
    const sala = new Sala(
      null, 
      req.body.nombre || 'Sala X', 
      req.body.capacidad || 50
    );
    await sala.save();
    res.status(201).json(sala);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
router.get('/peliculas/:id', async (req, res) => {
  try {
    const pelicula = await Pelicula.getById(req.params.id);
    if (pelicula) {
      res.json(pelicula);
    } else {
      res.status(404).json({ message: 'Película no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
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
router.put('/peliculas/:id', async (req, res) => {
  try {
    const pelicula = await Pelicula.getById(req.params.id);
    if (pelicula) {
      pelicula.titulo = req.body.titulo || pelicula.titulo;
      pelicula.director = req.body.director || pelicula.director;
      pelicula.anio = req.body.anio || pelicula.anio;
      pelicula.genero = req.body.genero || pelicula.genero;
      await pelicula.save();
      res.json(pelicula);
    } else {
      res.status(404).json({ message: 'Película no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 9. PUT /api/salas/:id - Modificar datos de una sala
router.put('/salas/:id', async (req, res) => {
  try {
    const sala = await Sala.getById(req.params.id);
    if (sala) {
      sala.nombre = req.body.nombre || sala.nombre;
      sala.capacidad = req.body.capacidad || sala.capacidad;
      await sala.save();
      res.json(sala);
    } else {
      res.status(404).json({ message: 'Sala no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
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
router.delete('/peliculas/:id', async (req, res) => {
  try {
    await Pelicula.delete(req.params.id);
    res.json({ message: 'Película eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 11b. DELETE /api/salas/:id - Eliminar elementos de una sala (Agregado)
router.delete('/salas/:id', async (req, res) => {
  try {
    await Sala.delete(req.params.id);
    res.json({ message: 'Sala eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
