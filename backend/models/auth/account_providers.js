const db = require('../../config/database');

// 1. Tìm liên kết Google bằng Google ID (sub)
async function findByGoogleId(Id) {
    const [rows] = await db.execute(
        `SELECT *
         FROM account_providers
         WHERE provider = 'GOOGLE'
           AND provider_user_id = ?
         LIMIT 1`,
        [Id]
    );

    return rows[0] || null;
}

// 2. Lấy tất cả nhà cung cấp đã liên kết với một tài khoản
async function findByAccountId(accountId) {
    const [rows] = await db.execute(
        `SELECT id, account_id, provider,
                provider_user_id, provider_email,
                created_at, updated_at
         FROM account_providers
         WHERE account_id = ?`,
        [accountId]
    );

    return rows;
}

// 3. Tìm liên kết theo ID bản ghi
async function findById(id) {
    const [rows] = await db.execute(
        `SELECT *
         FROM account_providers
         WHERE id = ?
         LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

// 4. Tạo liên kết Google cho tài khoản PhimHD
async function create({
    accountId,
    provider,
    providerUserId,
    providerEmail
}) {
    const [result] = await db.execute(
        `INSERT INTO account_providers
            (account_id, provider, provider_user_id, provider_email, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [accountId, provider, providerUserId, providerEmail]
    );

    return findById(result.insertId);
}

// 5. Cập nhật email Google của liên kết
async function updateGoogleEmail(id, googleEmail) {
    const [result] = await db.execute(
        `UPDATE account_providers
         SET provider_email = ?
         WHERE id = ?
           AND provider = 'GOOGLE'`,
        [googleEmail, id]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return findById(id);
}

// 6. Xóa liên kết Google bằng ID bản ghi
async function deleteById(id) {
    const [result] = await db.execute(
        `DELETE FROM account_providers
         WHERE id = ?
           AND provider = 'GOOGLE'`,
        [id]
    );

    return result.affectedRows > 0;
}

// 7. Hủy liên kết Google khỏi tài khoản PhimHD
async function deleteByAccountId(accountId) {
    const [result] = await db.execute(
        `DELETE FROM account_providers
         WHERE account_id = ?
           AND provider = 'GOOGLE'`,
        [accountId]
    );

    return result.affectedRows > 0;
}

module.exports = {
    findByGoogleId,
    findByAccountId,
    findById,
    create,
    updateGoogleEmail,
    deleteById,
    deleteByAccountId
};
