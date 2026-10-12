const db = require('../../config/database');

// Kiểm tra đã gửi OTP gần đây chưa
async function hasRecentOtp(email, purpose, cooldownSeconds) {
    const [rows] = await db.execute(
        `SELECT id
         FROM email_otps
         WHERE email = ?
           AND purpose = ?
           AND created_at >= DATE_SUB(
               NOW(), INTERVAL ? SECOND
           )
         ORDER BY created_at DESC
         LIMIT 1`,
        [email, purpose, cooldownSeconds]
    );

    return rows.length > 0;
}

// Tạo OTP mới trong database
async function createOtp(email, otpHash, purpose) {
    const [result] = await db.execute(
        `INSERT INTO email_otps (
            email, otp_hash, purpose, expires_at
        )
        VALUES (
            ?, ?, ?,
            DATE_ADD(
                NOW(),
                INTERVAL ? MINUTE
            )
        )`,
        [ email, otpHash, purpose,
            Number(process.env.OTP_EXPIRES_MINUTES || 5)
        ]
    );

    return result.insertId;
}

// Lấy OTP mới nhất chưa sử dụng
async function findLatestOtp(email, purpose) {
    const [rows] = await db.execute(
        `SELECT *,
                expires_at > NOW() AS is_valid
         FROM email_otps
         WHERE email = ? AND purpose = ? AND used_at IS NULL
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        [email, purpose]
    );

    return rows[0] || null;
}

// Tăng số lần nhập sai
async function incrementAttempts(id) {
    const [result] = await db.execute(
        `UPDATE email_otps
         SET attempts = attempts + 1
         WHERE id = ?
           AND used_at IS NULL
           AND expires_at > NOW()
           AND attempts < ?`,
        [
            id,
            Number(process.env.OTP_MAX_ATTEMPTS || 5)
        ]
    );

    return result.affectedRows;
}

// Đánh dấu OTP đã sử dụng nếu hợp lệ
async function consumeOtp(id, otpHash) {
    const [result] = await db.execute(
        `UPDATE email_otps
         SET used_at = NOW()
         WHERE id = ?
           AND otp_hash = ?
           AND used_at IS NULL
           AND expires_at > NOW()
           AND attempts < ?`,
        [
            id,
            otpHash,
            Number(process.env.OTP_MAX_ATTEMPTS || 5)
        ]
    );

    return result.affectedRows === 1;
}

// Vô hiệu hóa OTP
async function invalidateOtp(id) {
    const [result] = await db.execute(
        `UPDATE email_otps
         SET used_at = NOW()
         WHERE id = ?
           AND used_at IS NULL`,
        [id]
    );

    return result.affectedRows;
}

// Vô hiệu hóa các OTP cũ chưa sử dụng
async function invalidatePreviousOtps(email, purpose) {
    const [result] = await db.execute(
        `UPDATE email_otps
         SET used_at = NOW()
         WHERE email = ?
           AND purpose = ?
           AND used_at IS NULL`,
        [email, purpose]
    );

    return result.affectedRows;
}

module.exports = { hasRecentOtp, createOtp, findLatestOtp, incrementAttempts, consumeOtp, invalidateOtp, invalidatePreviousOtps };
