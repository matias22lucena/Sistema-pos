// backend/routes/notadecredito.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/notas-credito
router.post("/", async (req, res) => {
  const { venta_id } = req.body;

  if (!venta_id) return res.status(400).json({ error: "Falta el ID de la venta" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar si ya existe una nota de crédito
    const [yaExiste] = await conn.query(
      `SELECT COUNT(*) AS total FROM notas_credito WHERE venta_id = ?`,
      [venta_id]
    );
    if (yaExiste[0].total > 0)
      return res.status(400).json({ error: "Ya existe una nota de crédito para esta venta" });

    // Obtener los productos de la venta
    const [items] = await conn.query(
      `SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?`,
      [venta_id]
    );

    // Crear nota de crédito
    const [nc] = await conn.query(
      `INSERT INTO notas_credito (venta_id, fecha) VALUES (?, NOW())`,
      [venta_id]
    );
    const nota_id = nc.insertId;

    // Agregar detalle y devolver productos al stock
    for (const item of items) {
      await conn.query(
        `INSERT INTO detalle_notas_credito (nota_id, producto_id, cantidad)
         VALUES (?, ?, ?)`,
        [nota_id, item.producto_id, item.cantidad]
      );
      await conn.query(
        `UPDATE productos SET stock = stock + ? WHERE id = ?`,
        [item.cantidad, item.producto_id]
      );
    }

    await conn.commit();
    res.json({ ok: true, nota_id });
  } catch (error) {
    await conn.rollback();
    console.error("Error al crear nota de crédito:", error);
    res.status(500).json({ error: "Error al generar la nota de crédito" });
  } finally {
    conn.release();
  }
});

module.exports = router;
