const db = require('../config/database');

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

module.exports = { findAll, findById, search };