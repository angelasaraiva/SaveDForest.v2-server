const bcrypt = require('bcrypt');

// Hash a password
async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

// Verify a password
async function verifyPassword(password, hashedPassword) {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
}

module.exports = { hashPassword, verifyPassword }