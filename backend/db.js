// backend/db.js
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'matute', // Cambiá esto si tenés contraseña
  database: 'sistema_pos'
});

module.exports = db;
