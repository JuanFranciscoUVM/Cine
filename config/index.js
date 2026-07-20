require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'cine_user',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'cine',
    path: process.env.DB_PATH || './database/cine.sqlite'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secreto_inseguro_cambiar',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  }
};

module.exports = config;
