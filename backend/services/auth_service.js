const account = require('../models/auth/accounts');
const user = require('../models/auth/users');
const db = require('../config/database');
const {hashPassword, comparePassword} = require('../utils/password');
const otp = require('../utils/otp');
const token = require('../utils/token');

async function register(email, password, username, fullname)
{
    if (!email || !password || !username || !fullname) {
        throw new Error('Email, password, username, and fullname are required');
    }

    email = String(email).trim().toLowerCase();

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

    await user.createUser({ accountId, username, fullname });

    return {
        accountId,
        username,
        email,
        fullname
    };
}

async function changePassword(email, newPassword) {
    email = String(email || '').trim().toLowerCase();

    if (!email || !newPassword) {
        throw new Error('Email and new password are required');
    }

    const existingAccount = await account.findByEmail(email);
    if (!existingAccount) {
        throw new Error('Email does not exist');
    }

    const passwordHash = await hashPassword(newPassword);
    const updated = await account.updatePassword(
        existingAccount.id,
        passwordHash
    );

    if (!updated) {
        throw new Error('Unable to update password');
    }

    return { email };
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
async function getProfile(accountId) {
    const profile = await user.findByAccountId(accountId);
    if (!profile) {
        throw new Error('User does not exist');
    }

    const accountProfile = await account.findById(accountId);
    if (!accountProfile) {
        throw new Error('Account does not exist');
    }

    return {
        ...profile,
        accountId: accountProfile.id,
        email: accountProfile.email,
        role: accountProfile.role
    };
}

async function updateProfile(accountId, changes) {
    const currentProfile = await user.findByAccountId(accountId);
    if (!currentProfile) {
        throw new Error('User does not exist');
    }

    if (
        Object.hasOwn(changes, 'username') &&
        await user.isUsernameTaken(changes.username, accountId)
    ) {
        throw new Error('Username already exists');
    }

    await user.updateProfile(accountId, changes);
    return getProfile(accountId);
}

async function createProfile(accountId, profile) {
    const currentProfile = await user.findByAccountId(accountId);
    if (currentProfile) {
        throw new Error('Profile already exists');
    }

    if (await user.findByUsername(profile.username)) {
        throw new Error('Username already exists');
    }

    await user.createUser({
        accountId,
        username: profile.username,
        fullname: profile.full_name,
        avatar_url: profile.avatar_url,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        bio: profile.bio
    });

    return getProfile(accountId);
}

async function deleteProfile(accountId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT a.email, u.id AS userId
             FROM accounts a
             LEFT JOIN users u ON u.account_id = a.id
             WHERE a.id = ?
             FOR UPDATE`,
            [accountId]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return false;
        }

        if (rows[0].userId) {
            await connection.execute(
                'DELETE FROM movie_comment WHERE user_id = ?',
                [rows[0].userId]
            );
        }
        await connection.execute('DELETE FROM email_otps WHERE email = ?', [rows[0].email]);
        await connection.execute('DELETE FROM account_providers WHERE account_id = ?', [accountId]);
        await connection.execute('DELETE FROM users WHERE account_id = ?', [accountId]);
        const [result] = await connection.execute(
            'DELETE FROM accounts WHERE id = ?',
            [accountId]
        );

        await connection.commit();
        return result.affectedRows === 1;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

  

module.exports = {
    register,
    changePassword,
    login,
    generateTokens,
    refreshToken,
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile
};