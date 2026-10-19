const db = require('../../config/database');

// Tìm kiếm người dùng bằng account_id
async function findByAccountId(accountId) {
    const [rows] = await db.execute(
        "SELECT * FROM users WHERE account_id = ? LIMIT 1",
        [accountId]
    );

    return rows[0] || null;
}


// Tìm kiếm người dùng bằng username
async function findByUsername(username) {
    const [rows] = await db.execute(
        "SELECT * FROM users WHERE username = ? LIMIT 1",
        [username]
    );

    return rows[0] || null;
}

async function isUsernameTaken(username, accountId) {
    const [rows] = await db.execute(
        `SELECT id
         FROM users
         WHERE username = ? AND account_id <> ?
         LIMIT 1`,
        [username, accountId]
    );

    return rows.length > 0;
}

async function updateProfile(accountId, profile) {
    const fields = {
        username: 'username',
        full_name: 'full_name',
        avatar_url: 'avatar_url',
        date_of_birth: 'date_of_birth',
        gender: 'gender',
        bio: 'bio'
    };
    const updates = Object.keys(profile);
    const assignments = updates.map((field) => `\`${fields[field]}\` = ?`).join(', ');
    const values = updates.map((field) => profile[field]);

    await db.execute(
        `UPDATE users
         SET ${assignments}, updated_at = NOW()
         WHERE account_id = ?`,
        [...values, accountId]
    );
}

// Tạo người dùng mới
async function createUser({ accountId, username, fullname, avatar_url = null, date_of_birth = null, gender = null, bio = null }) {
    const [result] = await db.execute(
        `INSERT INTO users
        (account_id, username, full_name, avatar_url, date_of_birth, gender, bio, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [accountId, username, fullname, avatar_url, date_of_birth, gender, bio]
    );

    return result.insertId;
}

module.exports = {
    findByAccountId,
    findByUsername,
    isUsernameTaken,
    updateProfile,
    createUser
};
