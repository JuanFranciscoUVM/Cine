const { getDb } = require('../database/database');

class Pelicula {
  constructor(id, titulo, director, anio, genero) {
    this.id = id;
    this.titulo = titulo;
    this.director = director;
    this.anio = anio;
    this.genero = genero;
  }

  static async getAll() {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM peliculas');
    return rows.map(row => new Pelicula(row.id, row.titulo, row.director, row.anio, row.genero));
  }

  static async getById(id) {
    const db = await getDb();
    const row = await db.get('SELECT * FROM peliculas WHERE id = ?', [id]);
    if (row) {
      return new Pelicula(row.id, row.titulo, row.director, row.anio, row.genero);
    }
    return null;
  }

  async save() {
    const db = await getDb();
    if (this.id) {
      // Update
      await db.run(
        'UPDATE peliculas SET titulo = ?, director = ?, anio = ?, genero = ? WHERE id = ?',
        [this.titulo, this.director, this.anio, this.genero, this.id]
      );
      return this;
    } else {
      // Insert
      const result = await db.run(
        'INSERT INTO peliculas (titulo, director, anio, genero) VALUES (?, ?, ?, ?)',
        [this.titulo, this.director, this.anio, this.genero]
      );
      this.id = result.lastID;
      return this;
    }
  }

  static async delete(id) {
    const db = await getDb();
    await db.run('DELETE FROM peliculas WHERE id = ?', [id]);
  }
}

module.exports = Pelicula;
