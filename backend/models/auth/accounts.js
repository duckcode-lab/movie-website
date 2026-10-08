const db = require('../../config/database');

// Tìm kiếm người dùng bằng email 
async function findByEmail(email) {
    const [row] = await db.execute('SELECT * FROM accounts WHERE email = ? LIMIT 1', [email]);
    return row[0] || null;
}

// Tìm kiếm người dùng bằng ID
async function findById(id) {
    const [row] = await db.execute('SELECT * FROM accounts WHERE id = ? LIMIT 1', [id]);
    return row[0] || null;
}

// Tạo người dùng mới
async function createAccount(email, passwordHash) {
    const[result] = await db.execute(
         `INSERT INTO accounts (email, password_hash, role, created_at, updated_at)  
         VALUES (?, ?, ?, NOW(), NOW())`,
        [email, passwordHash, 'user']
    );
    return result.insertId;
}

module.exports = { findByEmail, findById, createAccount };