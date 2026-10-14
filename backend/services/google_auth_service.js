const { OAuth2Client } = require('google-auth-library');
const accountProvider = require('../models/auth/account_providers');
const account = require('../models/auth/accounts');
const user = require('../models/auth/users');
const {generateTokens} = require('./auth_service');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Đăng nhập bằng tài khoản Liên kết
async function loginWithLinkedAccount(credential) {
    const payload = await verifyGoogleCredential(credential);

    // Kiểm tra xem tài khoản Google đã được liên kết với tài khoản PhimHD chưa
    let linkedAccount = await findAccountProvider(payload.googleId);
    let accountId;

    if (!linkedAccount) {
        // Nếu chưa, tạo tài khoản mới và liên kết với tài khoản PhimHD
        accountId = await createAccountProvider(payload);
    } else {
        accountId = linkedAccount.account_id;
    }

    const accountProfile = await account.findById(accountId);
    if (!accountProfile) {
        throw new Error('Google account is not linked to an account');
    }

    const userProfile = await user.findByAccountId(accountId);
    if (!userProfile) {
        throw new Error('User does not exist');
    }

    const exitsUser = {
        ...userProfile,
        role: accountProfile.role
    };

    // Tạo token cho người dùng
    const tokens = await generateTokens(accountId, accountProfile.role);
    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        exitsUser
    };
}



// Xác thực Google ID Token và lấy thông tin người dùng
async function verifyGoogleCredential(credential) {
    if (!credential || typeof credential !== 'string') {
        throw new Error('Google credential is required');
    }

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
        throw new Error('Invalid Google account information');
    }

    if (payload.email_verified !== true) {
        throw new Error('Google email is not verified');
    }

    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || '',
        picture: payload.picture || ''
    };
}

// Tìm liên kết Google bằng Google ID (sub)
async function findAccountProvider(providerId){
    return await accountProvider.findByGoogleId(providerId);
}

// Tạo tài khoản Google mới và liên kết với tài khoản PhimHD
async function createAccountProvider(payload) {
    // Tạo tài khoản mới trong bảng accounts
    const accountId = await account.createAccount(payload.email, null);

    // Tạo tài khoản liên kết trong bảng account_provider
    await accountProvider.create({
        accountId: accountId,
        provider: 'GOOGLE',
        providerUserId: payload.googleId,
        providerEmail: payload.email
    });

    // Tạo người dùng mới trong bảng users
    await user.createUser({
        accountId: accountId,
        username: payload.name || payload.email.split('@')[0],
        fullname: payload.name || payload.email.split('@')[0],
        avatar_url: payload.picture
    });

    return accountId;
}






module.exports = { verifyGoogleCredential, loginWithLinkedAccount };