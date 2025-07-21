const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// LOGIN
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = rows[0];
    const passwordMatch = await bcrypt.compare(password, usuario.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    delete usuario.password; // No enviamos la contraseña
    res.json(usuario);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REGISTRO
router.post('/register', async (req, res) => {
  const { nombre, correo, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)',
      [nombre, correo, hashedPassword]
    );

    res.json({ id: result.insertId, nombre, correo });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Correo ya registrado' });
    }

    console.error("ERROR REGISTRO:", err); // ← esto te mostrará el problema real
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

module.exports = router;
