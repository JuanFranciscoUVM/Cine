const { getDb } = require('./database/database');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'database', 'data.json');

async function seed() {
  const db = await getDb();
  
  await db.exec('DELETE FROM peliculas');
  await db.exec('DELETE FROM salas');

  const resP1 = await db.run('INSERT INTO peliculas (titulo, director, anio, genero) VALUES (?, ?, ?, ?)', ['Inception', 'Christopher Nolan', 2010, 'Ciencia Ficción']);
  const resP2 = await db.run('INSERT INTO peliculas (titulo, director, anio, genero) VALUES (?, ?, ?, ?)', ['The Matrix', 'Wachowskis', 1999, 'Acción']);
  const resP3 = await db.run('INSERT INTO peliculas (titulo, director, anio, genero) VALUES (?, ?, ?, ?)', ['Interstellar', 'Christopher Nolan', 2014, 'Aventura']);
  
  const resS1 = await db.run('INSERT INTO salas (nombre, capacidad) VALUES (?, ?)', ['Sala 1 - IMAX', 80]);
  const resS2 = await db.run('INSERT INTO salas (nombre, capacidad) VALUES (?, ?)', ['Sala 2 - 3D', 50]);

  const p1Id = resP1.lastID.toString();
  const p2Id = resP2.lastID.toString();
  const s1Id = resS1.lastID.toString();
  const s2Id = resS2.lastID.toString();

  const data = {
    "peliculas": [],
    "salas": [],
    "funciones": [
      {
        "id": "f_1",
        "peliculaId": p1Id,
        "salaId": s1Id,
        "fecha": "2026-06-25T18:00"
      },
      {
        "id": "f_2",
        "peliculaId": p2Id,
        "salaId": s2Id,
        "fecha": "2026-06-25T20:30"
      }
    ],
    "tickets": [],
    "reservaciones": [
      {
        "id": "r_1",
        "funcionId": "f_1",
        "cliente": "Carlos Diaz",
        "createdAt": new Date(Date.now() - 100000).toISOString()
      },
      {
        "id": "r_2",
        "funcionId": "f_2",
        "cliente": "Luis Martinez",
        "createdAt": new Date().toISOString()
      }
    ]
  };

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Se insertaron los datos de prueba correctamente.');
}

seed().catch(console.error);
