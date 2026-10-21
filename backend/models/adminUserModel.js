const db = require('../config/database');

const userSelect = `
  SELECT
    a.id AS accountId,
    a.email,
    a.role,
    a.created_at AS accountCreatedAt,
    a.updated_at AS accountUpdatedAt,
    u.id AS profileId,
    u.username,
    u.full_name AS fullName,
    u.avatar_url AS avatarUrl,
    u.date_of_birth AS dateOfBirth,
    u.gender,
    u.bio,
    u.created_at AS profileCreatedAt,
    u.updated_at AS profileUpdatedAt
  FROM accounts a
  LEFT JOIN users u ON u.account_id = a.id
`;

async function findAll({ query, role, limit, offset }) {
  const conditions = [];
  const values = [];

  if (query) {
    conditions.push('(a.email LIKE ? OR u.username LIKE ? OR u.full_name LIKE ?)');
    const search = `%${query}%`;
    values.push(search, search, search);
  }

  if (role) {
    conditions.push('LOWER(a.role) = ?');
    values.push(role);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `${userSelect}
     ${where}
     ORDER BY a.id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return rows;
}

async function countAll({ query, role }) {
  const conditions = [];
  const values = [];

  if (query) {
    conditions.push('(a.email LIKE ? OR u.username LIKE ? OR u.full_name LIKE ?)');
    const search = `%${query}%`;
    values.push(search, search, search);
  }

  if (role) {
    conditions.push('LOWER(a.role) = ?');
    values.push(role);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM accounts a
     LEFT JOIN users u ON u.account_id = a.id
     ${where}`,
    values
  );

  return rows[0].total;
}

async function findById(accountId) {
  const [rows] = await db.execute(
    `${userSelect}
     WHERE a.id = ?
     LIMIT 1`,
    [accountId]
  );

  return rows[0] || null;
}

async function updateRole(accountId, role) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [admins] = await connection.execute(
      `SELECT id
       FROM accounts
       WHERE LOWER(role) = 'admin'
       ORDER BY id
       FOR UPDATE`
    );
    const [accounts] = await connection.execute(
      'SELECT id, role FROM accounts WHERE id = ? LIMIT 1 FOR UPDATE',
      [accountId]
    );

    if (!accounts.length) {
      await connection.rollback();
      return { notFound: true };
    }

    if (
      String(accounts[0].role).toLowerCase() === 'admin' &&
      role === 'user' &&
      admins.length <= 1
    ) {
      await connection.rollback();
      return { lastAdmin: true };
    }

    await connection.execute(
      'UPDATE accounts SET role = ?, updated_at = NOW() WHERE id = ?',
      [role, accountId]
    );
    await connection.commit();

    return { user: await findById(accountId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function remove(accountId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [admins] = await connection.execute(
      `SELECT id
       FROM accounts
       WHERE LOWER(role) = 'admin'
       ORDER BY id
       FOR UPDATE`
    );
    const [accounts] = await connection.execute(
      `SELECT a.id, a.email, a.role, u.id AS userId
       FROM accounts a
       LEFT JOIN users u ON u.account_id = a.id
       WHERE a.id = ?
       LIMIT 1
       FOR UPDATE`,
      [accountId]
    );

    if (!accounts.length) {
      await connection.rollback();
      return { notFound: true };
    }

    const account = accounts[0];
    if (
      String(account.role).toLowerCase() === 'admin' &&
      admins.length <= 1
    ) {
      await connection.rollback();
      return { lastAdmin: true };
    }

    if (account.userId) {
      await connection.execute(
        'DELETE FROM movie_comment WHERE user_id = ?',
        [account.userId]
      );
    }
    await connection.execute('DELETE FROM email_otps WHERE email = ?', [account.email]);
    await connection.execute('DELETE FROM account_providers WHERE account_id = ?', [accountId]);
    await connection.execute('DELETE FROM users WHERE account_id = ?', [accountId]);
    await connection.execute('DELETE FROM accounts WHERE id = ?', [accountId]);

    await connection.commit();
    return { deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { findAll, countAll, findById, updateRole, remove };
