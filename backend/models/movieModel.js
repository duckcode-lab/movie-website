const db = require('../config/database');

const editableFields = [
  'title',
  'englishTitle',
  'genre',
  'cast',
  'director',
  'studio',
  'country',
  'bannerUrl',
  'posterUrl',
  'videoUrl',
  'quality',
  'rating',
  'episodes',
  'year',
  'description'
];

async function findAll() {
  const [rows] = await db.query('SELECT * FROM movie ORDER BY id DESC');
  return rows;
}

async function findById(id) {
  const [rows] = await db.execute('SELECT * FROM movie WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function search(query) {
  if (!query || !query.trim()) {
    return findAll();
  }

  const keyword = `%${query.trim()}%`;
  const sql = `
    SELECT * FROM movie 
    WHERE title LIKE ? 
       OR englishTitle LIKE ? 
       OR genre LIKE ? 
       OR cast LIKE ? 
       OR director LIKE ? 
       OR studio LIKE ? 
       OR country LIKE ? 
    ORDER BY id DESC
  `;

  const [rows] = await db.execute(sql, Array(7).fill(keyword));
  return rows;
}

async function create(movie) {
  const fields = editableFields.filter((field) => Object.hasOwn(movie, field));
  const columns = fields.map((field) => `\`${field}\``).join(', ');
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map((field) => movie[field]);

  const [result] = await db.execute(
    `INSERT INTO movie (${columns}) VALUES (${placeholders})`,
    values
  );

  return findById(result.insertId);
}

async function update(id, movie) {
  const fields = editableFields.filter((field) => Object.hasOwn(movie, field));
  const assignments = fields.map((field) => `\`${field}\` = ?`).join(', ');
  const values = fields.map((field) => movie[field]);

  await db.execute(
    `UPDATE movie SET ${assignments} WHERE id = ?`,
    [...values, id]
  );

  return findById(id);
}

async function remove(id) {
  const [result] = await db.execute('DELETE FROM movie WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, search, create, update, remove };