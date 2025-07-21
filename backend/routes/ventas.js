// backend/routes/ventas.js
//REGISTRAR VENTA Y ACTUALIZAR STOCK
const express = require('express');
const router = express.Router();
const db = require('../db');

// Registrar una venta
router.post('/', async (req, res) => {
  const { productos, total, metodo_pago } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [ventaResult] = await conn.query(
      'INSERT INTO ventas (total, metodo_pago) VALUES (?, ?)',
      [total, metodo_pago]
    );
    const venta_id = ventaResult.insertId;

    for (const item of productos) {
      const { producto_id, cantidad, precio_unitario } = item;

      await conn.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [venta_id, producto_id, cantidad, precio_unitario]
      );

      await conn.query(
        'UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [cantidad, producto_id, cantidad]
      );
    }

    await conn.commit();
    res.json({ venta_id });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
