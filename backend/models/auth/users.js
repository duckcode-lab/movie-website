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

    return rows;
}

// Tạo người dùng mới
async function createUser(accountId, username, fullname) {
    const [result] = await db.execute(
        `INSERT INTO users
        (account_id, username, full_name, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())`,
        [accountId, username, fullname]
    );

    return result.insertId;
}

module.exports = {
    findByAccountId,
    findByUsername,
    createUser
};
