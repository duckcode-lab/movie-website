const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});


function generateAccessToken(payload) {
    return jwt.sign(
        {
            ...payload,
            type: "access"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_TIME
        }
    );
}

function verifyAccessToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error("Invalid or expired access token");
    }
}

function generateRefreshToken(payload) {
    return jwt.sign(
        {
            ...payload,
            type: "refresh"
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_TIME
        }
    );
}

function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET
        );
        return decoded;
    } catch (error) {
        throw new Error("Invalid or expired refresh token");
    }
}

module.exports = {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    verifyRefreshToken
};