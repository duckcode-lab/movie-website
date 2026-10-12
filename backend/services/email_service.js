
const transporter = require('../config/mailer');

async function sendOtpEmail(email, otp, purpose) {
    const action = purpose === 'REGISTER'
        ? 'xác minh đăng ký tài khoản'
        : 'đặt lại mật khẩu';

    const expiresMinutes = Number(
        process.env.OTP_EXPIRES_MINUTES || 5
    );

    await transporter.sendMail({
        from: process.env.SMTP_FROM ||
            `"PhimHD" <${process.env.SMTP_USER}>`,

        to: email,

        subject: '[PhimHD] Mã xác minh tài khoản',

        text: `Mã OTP của bạn là: ${otp}

Mã được dùng để ${action}.
Mã có hiệu lực trong ${expiresMinutes} phút.

Nếu bạn không yêu cầu mã này, hãy bỏ qua email.

Trân trọng,
Đội ngũ PhimHD`
    });
}

module.exports = { sendOtpEmail };