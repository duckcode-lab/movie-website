const db = require('../config/database');

async function initialize() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS genre (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_genre_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS movie_genre (
      movie_id INT UNSIGNED NOT NULL,
      genre_id INT UNSIGNED NOT NULL,
      PRIMARY KEY (movie_id, genre_id),
      KEY idx_movie_genre_genre (genre_id),
      CONSTRAINT fk_movie_genre_genre
        FOREIGN KEY (genre_id) REFERENCES genre (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [movies] = await connection.query(
      'SELECT id, genre FROM movie WHERE genre IS NOT NULL AND TRIM(genre) <> \'\''
    );
    const movieGenreNames = movies.map(({ id, genre: label }) => ({
      movieId: id,
      names: [...new Set(label.split(',').map((name) => name.trim()).filter(Boolean))]
    }));
    const allNames = [...new Set(movieGenreNames.flatMap(({ names }) => names))];

    for (const name of allNames) {
      await connection.execute('INSERT IGNORE INTO genre (name) VALUES (?)', [name]);
    }

    const genreIds = new Map();
    for (const name of allNames) {
      const [rows] = await connection.execute(
        `SELECT id, name
         FROM genre
         WHERE name COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci
         LIMIT 1`,
        [name]
      );
      if (rows.length === 0) {
        throw new Error(`Không thể tìm thấy thể loại sau khi tạo: ${name}`);
      }
      genreIds.set(name, rows[0].id);
    }

    await connection.query('DELETE FROM movie_genre');
    const assignments = movieGenreNames.flatMap(({ movieId, names }) =>
      names.map((name) => [movieId, genreIds.get(name)])
    );
    for (let offset = 0; offset < assignments.length; offset += 500) {
      const batch = assignments.slice(offset, offset + 500);
      await connection.query(
        `INSERT IGNORE INTO movie_genre (movie_id, genre_id)
         VALUES ${batch.map(() => '(?, ?)').join(', ')}`,
        batch.flat()
      );
    }

    await connection.query(`
      DELETE g FROM genre g
      LEFT JOIN movie_genre mg ON mg.genre_id = g.id
      WHERE g.name LIKE '%,%' AND mg.genre_id IS NULL
    `);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findAll() {
  const [rows] = await db.query(`
    SELECT g.id, g.name, COUNT(mg.movie_id) AS movieCount
    FROM genre g
    LEFT JOIN movie_genre mg ON mg.genre_id = g.id
    GROUP BY g.id, g.name
    ORDER BY g.name
  `);
  return rows;
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id, name FROM genre WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function create(name) {
  const [result] = await db.execute(
    'INSERT INTO genre (name) VALUES (?)',
    [name]
  );
  return findById(result.insertId);
}

async function update(id, name) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const movieIds = await findAffectedMovieIds(connection, id);
    await connection.execute('UPDATE genre SET name = ? WHERE id = ?', [name, id]);
    await syncMovieLabels(connection, movieIds);
    await connection.commit();
    return findById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findAffectedMovieIds(connection, genreId) {
  const [movies] = await connection.execute(
    'SELECT movie_id FROM movie_genre WHERE genre_id = ?',
    [genreId]
  );
  return movies.map(({ movie_id: movieId }) => movieId);
}

async function syncMovieLabels(connection, movieIds) {
  if (movieIds.length === 0) return;

  await connection.execute(
    `UPDATE movie m
     SET m.genre = COALESCE((
       SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ')
       FROM movie_genre mg
       JOIN genre g ON g.id = mg.genre_id
       WHERE mg.movie_id = m.id
     ), '')
     WHERE m.id IN (${movieIds.map(() => '?').join(', ')})`,
    movieIds
  );
}

async function remove(id) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [genres] = await connection.execute(
      'SELECT id FROM genre WHERE id = ? FOR UPDATE',
      [id]
    );
    if (genres.length === 0) {
      await connection.rollback();
      return false;
    }

    const [usage] = await connection.execute(
      'SELECT COUNT(*) AS movieCount FROM movie_genre WHERE genre_id = ?',
      [id]
    );
    const movieCount = Number(usage[0].movieCount);
    if (movieCount > 0) {
      const error = new Error('Không thể xóa thể loại đang được sử dụng');
      error.code = 'GENRE_IN_USE';
      error.movieCount = movieCount;
      throw error;
    }

    const [result] = await connection.execute('DELETE FROM genre WHERE id = ?', [id]);
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { initialize, findAll, findById, create, update, remove };
