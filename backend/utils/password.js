const bcrypt = require('bcryptjs');

const saltRounds = 12;

// Mã hóa mật khẩu
async function hashPassword(password) {
    const hashPassword = await bcrypt.hash(password, saltRounds);
    return hashPassword;
}

// So sánh mật khẩu
async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
    
}


module.exports = {
    hashPassword,
    comparePassword
};
