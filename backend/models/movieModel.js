const db = require('../config/database');

const editableFields = [
  'title',
  'englishTitle',
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

function mapMovies(rows) {
  const movies = new Map();

  for (const row of rows) {
    let movie = movies.get(row.id);
    if (!movie) {
      const { relationGenreId, relationGenreName, ...movieData } = row;
      movie = { ...movieData, genres: [] };
      movies.set(row.id, movie);
    }

    if (row.relationGenreId !== null) {
      movie.genres.push({ id: row.relationGenreId, name: row.relationGenreName });
    }
  }

  for (const movie of movies.values()) {
    if (movie.genres.length > 0) {
      movie.genre = movie.genres.map(({ name }) => name).join(', ');
    } else {
      movie.genre = movie.genre || '';
    }
  }

  return [...movies.values()];
}

async function readMovies(executor, where = '', values = [], order = '') {
  const [rows] = await executor.execute(
    `SELECT m.*, g.id AS relationGenreId, g.name AS relationGenreName
     FROM movie m
     LEFT JOIN movie_genre mg ON mg.movie_id = m.id
     LEFT JOIN genre g ON g.id = mg.genre_id
     ${where}
     ${order}`,
    values
  );
  return mapMovies(rows);
}

async function findAll() {
  return readMovies(db, '', [], 'ORDER BY m.id DESC');
}

async function findById(id) {
  const movies = await readMovies(db, 'WHERE m.id = ?', [id]);
  return movies[0];
}

async function search(query) {
  if (!query || !query.trim()) {
    return findAll();
  }

  const keyword = `%${query.trim()}%`;
  return readMovies(
    db,
    `WHERE m.title LIKE ?
       OR m.englishTitle LIKE ?
       OR (
         m.genre LIKE ?
         AND NOT EXISTS (
           SELECT 1 FROM movie_genre legacy_mg WHERE legacy_mg.movie_id = m.id
         )
       )
       OR g.name LIKE ?
       OR m.cast LIKE ?
       OR m.director LIKE ?
       OR m.studio LIKE ?
       OR m.country LIKE ?`,
    Array(8).fill(keyword),
    'ORDER BY m.id DESC'
  );
}

async function resolveGenreIds(connection, movie) {
  if (Object.hasOwn(movie, 'genreIds')) {
    if (movie.genreIds.length === 0) return [];

    const placeholders = movie.genreIds.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `SELECT id FROM genre WHERE id IN (${placeholders})`,
      movie.genreIds
    );
    if (rows.length !== movie.genreIds.length) {
      const error = new Error('Danh sách thể loại không tồn tại');
      error.code = 'GENRE_IDS_NOT_FOUND';
      throw error;
    }
    return rows.map(({ id }) => id);
  }

  if (!Object.hasOwn(movie, 'genre')) return null;
  const name = typeof movie.genre === 'string' ? movie.genre.trim() : '';
  const names = name ? [name] : [];
  if (names.length === 0) return [];

  await connection.query(
    `INSERT IGNORE INTO genre (name) VALUES ${names.map(() => '(?)').join(', ')}`,
    names
  );
  const placeholders = names.map(() => '?').join(', ');
  const [rows] = await connection.execute(
    `SELECT id FROM genre WHERE name IN (${placeholders})`,
    names
  );
  return rows.map(({ id }) => id);
}

async function writeGenreAssignments(connection, movieId, genreIds) {
  if (genreIds === null) return;

  await connection.execute('DELETE FROM movie_genre WHERE movie_id = ?', [movieId]);
  if (genreIds.length > 0) {
    await connection.query(
      `INSERT INTO movie_genre (movie_id, genre_id) VALUES ${genreIds.map(() => '(?, ?)').join(', ')}`,
      genreIds.flatMap((genreId) => [movieId, genreId])
    );
  }

  const [rows] = genreIds.length > 0
    ? await connection.execute(
      `SELECT name FROM genre WHERE id IN (${genreIds.map(() => '?').join(', ')}) ORDER BY name`,
      genreIds
    )
    : [[]];
  await connection.execute(
    'UPDATE movie SET genre = ? WHERE id = ?',
    [rows.map(({ name }) => name).join(', '), movieId]
  );
}

async function create(movie) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const genreIds = await resolveGenreIds(connection, movie);
    const fields = editableFields.filter((field) => Object.hasOwn(movie, field));
    if (genreIds !== null) fields.push('genre');
    const columns = fields.map((field) => `\`${field}\``).join(', ');
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map((field) => field === 'genre' ? '' : movie[field]);
    const [result] = await connection.execute(
      `INSERT INTO movie (${columns}) VALUES (${placeholders})`,
      values
    );
    await writeGenreAssignments(connection, result.insertId, genreIds);
    await connection.commit();
    return findById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function update(id, movie) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const genreIds = await resolveGenreIds(connection, movie);
    const fields = editableFields.filter((field) => Object.hasOwn(movie, field));
    if (fields.length > 0) {
      const assignments = fields.map((field) => `\`${field}\` = ?`).join(', ');
      const values = fields.map((field) => movie[field]);
      await connection.execute(
        `UPDATE movie SET ${assignments} WHERE id = ?`,
        [...values, id]
      );
    }
    await writeGenreAssignments(connection, id, genreIds);
    await connection.commit();
    return findById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function remove(id) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM movie_genre WHERE movie_id = ?', [id]);
    const [result] = await connection.execute('DELETE FROM movie WHERE id = ?', [id]);
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { findAll, findById, search, create, update, remove };