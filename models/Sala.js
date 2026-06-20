const { getDb } = require('../database/database');

class Sala {
  constructor(id, nombre, capacidad) {
    this.id = id;
    this.nombre = nombre;
    this.capacidad = capacidad;
  }

  static async getAll() {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM salas');
    return rows.map(row => new Sala(row.id, row.nombre, row.capacidad));
  }

  static async getById(id) {
    const db = await getDb();
    const row = await db.get('SELECT * FROM salas WHERE id = ?', [id]);
    if (row) {
      return new Sala(row.id, row.nombre, row.capacidad);
    }
    return null;
  }

  async save() {
    const db = await getDb();
    if (this.id) {
      // Update
      await db.run(
        'UPDATE salas SET nombre = ?, capacidad = ? WHERE id = ?',
        [this.nombre, this.capacidad, this.id]
      );
      return this;
    } else {
      // Insert
      const result = await db.run(
        'INSERT INTO salas (nombre, capacidad) VALUES (?, ?)',
        [this.nombre, this.capacidad]
      );
      this.id = result.lastID;
      return this;
    }
  }

  static async delete(id) {
    const db = await getDb();
    await db.run('DELETE FROM salas WHERE id = ?', [id]);
  }
}

module.exports = Sala;
