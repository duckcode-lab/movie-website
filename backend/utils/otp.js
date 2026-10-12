const crypto = require('crypto');

// Tạo mã OTP ngẫu nhiên 6 chữ số
function generateOtp() {
    return crypto.randomInt(0, 1_000_000)
        .toString()
        .padStart(6, '0');
}

// Băm OTP bằng HMAC-SHA256 với secret từ biến môi trường
function hashOtp(otp) {
    const secret = process.env.OTP_SECRET;

    if (!secret) {
        throw new Error('OTP_SECRET is not configured');
    }

    return crypto
        .createHmac('sha256', secret)
        .update(otp)
        .digest('hex');
}

// So sánh OTP nhập vào với OTP đã băm
function compareOtp(otp, storedHash) {
    const inputHash = hashOtp(otp);

    const inputBuffer = Buffer.from(inputHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (inputBuffer.length !== storedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(inputBuffer, storedBuffer);
}

module.exports = { generateOtp, hashOtp, compareOtp };