
const otpModel = require('../models/auth/otp');
const emailService = require('./email_service');

const { generateOtp, hashOtp, compareOtp } = require('../utils/otp');

const ALLOWED_PURPOSES = ['REGISTER', 'RESET_PASSWORD'];

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePurpose(purpose) {
    return ALLOWED_PURPOSES.includes(purpose);
}

// Gửi OTP
async function sendOtp(email, purpose) {
    email = normalizeEmail(email);

    if (!validateEmail(email)) {
        throw new Error('Invalid email');
    }

    if (!validatePurpose(purpose)) {
        throw new Error('Invalid OTP purpose');
    }

    const cooldownSeconds = Number(
        process.env.OTP_RESEND_COOLDOWN_SECONDS || 60
    );

    const hasRecent = await otpModel.hasRecentOtp(
        email,
        purpose,
        cooldownSeconds
    );

    if (hasRecent) {
        throw new Error('Please wait before requesting another OTP');
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await otpModel.invalidatePreviousOtps(email, purpose);

    const otpId = await otpModel.createOtp(
        email,
        otpHash,
        purpose
    );

    try {
        await emailService.sendOtpEmail(email, otp, purpose);
    } catch (error) {
        await otpModel.invalidateOtp(otpId);

        throw new Error('Unable to send OTP email');
    }

    return {
        message: 'OTP sent successfully'
    };
}

// Xác minh OTP
async function verifyOtp(email, otp, purpose) {
    email = normalizeEmail(email);
    otp = String(otp || '');

    if (!validateEmail(email)) {
        throw new Error('Invalid email');
    }

    if (!/^\d{6}$/.test(otp)) {
        throw new Error('Invalid or expired OTP');
    }

    if (!validatePurpose(purpose)) {
        throw new Error('Invalid OTP purpose');
    }

    const record = await otpModel.findLatestOtp(
        email,
        purpose
    );

    const maxAttempts = Number(
        process.env.OTP_MAX_ATTEMPTS || 5
    );

    if ( !record || !record.is_valid || record.attempts >= maxAttempts) {
        throw new Error('Invalid or expired OTP');
    }

    const isCorrect = compareOtp(otp, record.otp_hash);

    if (!isCorrect) {
        await otpModel.incrementAttempts(record.id);

        throw new Error('Invalid or expired OTP');
    }

    return {
        id: record.id,
        otpHash: record.otp_hash
    };
}

async function completeOtpAction(verification, action) {
    try {
        const result = await action();
        const consumed = await otpModel.consumeOtp(
            verification.id,
            verification.otpHash
        );

        if (!consumed) {
            throw new Error('Invalid or expired OTP');
        }

        return result;
    } catch (error) {
        await otpModel.incrementAttempts(verification.id);
        throw error;
    }
}

module.exports = {
    sendOtp,
    verifyOtp,
    completeOtpAction
};