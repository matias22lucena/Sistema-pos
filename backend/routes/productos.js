const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ Listar todos los productos
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos');
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Obtener resumen de productos
router.get('/resumen', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END) AS stock_bajo,
        SUM(stock * precio_base) AS valor_total
      FROM productos
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error en resumen:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Agregar nuevo producto
router.post('/', async (req, res) => {
  const { codigo, nombre, descripcion, precio_base, stock, stock_minimo } = req.body;

  try {
    const [existe] = await db.query('SELECT * FROM productos WHERE codigo = ?', [codigo]);
    if (existe.length > 0) {
      return res.status(400).json({ error: 'El código ya está registrado.' });
    }

    const [result] = await db.query(
      `INSERT INTO productos 
        (codigo, nombre, descripcion, precio_base, stock, stock_minimo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [codigo, nombre, descripcion, precio_base, stock, stock_minimo]
    );

    // ✅ AGREGADO: Precio de venta con margen predeterminado
    const margen = 30;
    const precio_venta = parseFloat(precio_base) * (1 + margen / 100);
    await db.query(
      'UPDATE productos SET precio_venta = ? WHERE id = ?',
      [precio_venta, result.insertId]
    );

    res.json({ id: result.insertId, message: 'Producto creado correctamente' });
  } catch (err) {
    console.error("Error al guardar producto:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Actualizar PRECIO BASE de un producto
router.put('/:id/precio-base', async (req, res) => {
  const { id } = req.params;
  const { precio_base } = req.body;

  try {
    await db.query('UPDATE productos SET precio_base = ? WHERE id = ?', [precio_base, id]);
    res.json({ success: true, message: 'Precio base actualizado correctamente' });
  } catch (err) {
    console.error("Error actualizando precio base:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Actualizar PRECIO VENTA de un producto (calculado desde margen)
router.put('/:id/margen', async (req, res) => {
  const { id } = req.params;
  const { precio_venta } = req.body;

  try {
    await db.query('UPDATE productos SET precio_venta = ? WHERE id = ?', [precio_venta, id]);
    res.json({ success: true, message: 'Precio de venta actualizado correctamente' });
  } catch (err) {
    console.error("Error actualizando precio venta:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
