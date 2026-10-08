const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const mysql = require('mysql2/promise');

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim());

if (missingEnv.length > 0) {
    throw new Error(`Missing database configuration in ${envPath}: ${missingEnv.join(', ')}`);
}

const sslCaPath = process.env.DB_SSL_CA
    ? path.resolve(__dirname, process.env.DB_SSL_CA)
    : null;

const db = mysql.createPool({
    host: process.env.DB_HOST.trim(),
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER.trim(),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME.trim(),
    ...(process.env.DB_SSL === 'true' && {
        ssl: {
            rejectUnauthorized: true,
            ...(sslCaPath && { ca: fs.readFileSync(sslCaPath, 'utf8') })
        }
    }),
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = db;
