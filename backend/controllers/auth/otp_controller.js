
const otpService = require('../../services/otp_service');

// Gửi OTP
async function sendOtp(req, res) {
    try {
        const { email, purpose } = req.body;

        const result = await otpService.sendOtp(
            email,
            purpose
        );

        return res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Invalid email') {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.message === 'Invalid OTP purpose') {
            return res.status(400).json({
                message: error.message
            });
        }

        if (
            error.message ===
            'Please wait before requesting another OTP'
        ) {
            return res.status(429).json({
                message: error.message
            });
        }

        console.error('Send OTP error:', error);

        return res.status(500).json({
            message: 'Unable to send OTP'
        });
    }
}


module.exports = { sendOtp};