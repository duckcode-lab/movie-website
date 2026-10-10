const db = require('../config/database');

async function findVisibleByMovieId(movieId) {
  const [rows] = await db.execute(
    `SELECT
      c.id,
      c.movie_id AS movieId,
      c.content_id AS content,
      c.created_at AS createdAt,
      u.username,
      u.full_name AS fullName
    FROM movie_comment c
    LEFT JOIN users u ON u.account_id = c.user_id
    WHERE c.movie_id = ? AND (c.is_hidden = FALSE OR c.is_hidden IS NULL)
    ORDER BY c.created_at DESC, c.id DESC`,
    [movieId]
  );

  return rows;
}

const findByMovieId = findVisibleByMovieId;

async function create(movieId, userId, content) {
  const [result] = await db.execute(
    `INSERT INTO movie_comment (movie_id, user_id, content_id, created_at)
    VALUES (?, ?, ?, NOW())`,
    [movieId, userId, content]
  );

  return result.insertId;
}

async function setHidden(commentId, movieId, isHidden) {
  const [result] = await db.execute(
    `UPDATE movie_comment
    SET is_hidden = ?
    WHERE id = ? AND movie_id = ?`,
    [isHidden, commentId, movieId]
  );

  return result.affectedRows > 0;
}

async function remove(commentId, movieId) {
  const [result] = await db.execute(
    'DELETE FROM movie_comment WHERE id = ? AND movie_id = ?',
    [commentId, movieId]
  );

  return result.affectedRows > 0;
}

module.exports = { findVisibleByMovieId, findByMovieId, create, setHidden, remove };