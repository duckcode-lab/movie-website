const account = require('../models/auth/accounts');
const user = require('../models/auth/users');
const {hashPassword, comparePassword} = require('../utils/password');
const token = require('../utils/token');

async function register(email, password, username, fullname)
{
    if (!email || !password || !username || !fullname) {
        throw new Error('Email, password, username, and fullname are required');
    }

    const existingAccount = await account.findByEmail(email);
    if(existingAccount){
        throw new Error('Email already exists');
    }

     const existingUser = await user.findByUsername(username);
     if(existingUser){
         throw new Error('Username already exists');
     }
    
    // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
    const hashedPassword = await hashPassword(password);
    
    const accountId = await account.createAccount(
        email,
        hashedPassword
    );

    await user.createUser(accountId, username, fullname);

    return {
        accountId,
        username,
        email,
        fullname
    };
}

async function login(email, password) {
    const exitsAccount = await account.findByEmail(email);
    if(!exitsAccount) {
        throw new Error('Email does not exist');
    }
    const isMatch = await comparePassword(password, exitsAccount.password_hash);
    if(!isMatch) {
        throw new Error('Invalid email or password');
    }

    // Lấy thông tin người dùng
    const exitsUser = await user.findByAccountId(exitsAccount.id);
    if(!exitsUser) {
        throw new Error('User does not exist');
    }

    return {
        ...exitsUser,
        accountId: exitsAccount.id,
        role: exitsAccount.role
    };
}
// Tạo accessToken và refreshToken
async function generateTokens(accountId, role) {
    const accessToken = token.generateAccessToken({ id: accountId, role });
    const refreshToken = token.generateRefreshToken({ id: accountId, role });
    return { accessToken, refreshToken };
}

// Lấy lại accessToken
async function refreshToken(refreshToken) {
    // Kiểm tra refreshToken
    const decoded = token.verifyRefreshToken(refreshToken);
    console.log(decoded);
    if (!decoded) {
        throw new Error('Invalid refresh token');
    }
    if (!decoded.id) {
        throw new Error('Refresh token does not contain an account ID. Please log in again.');
    }

    const accessToken = token.generateAccessToken({ id: decoded.id, role: decoded.role });
    return accessToken;
}

// Lấy thông tin cá nhân
async function getProfile(accessToken){
    const decoded =  token.verifyAccessToken(accessToken);
    if(!decoded){
        throw new Error('Invalid access token');
    }
    if (!decoded.id) {
        throw new Error('Access token does not contain an account ID. Please log in again.');
    }

    const exitsUser = await user.findByAccountId(decoded.id);
    if(!exitsUser) {
        throw new Error('User does not exist');
    }
    return exitsUser;
}
  

module.exports = { register, login, generateTokens, refreshToken, getProfile };