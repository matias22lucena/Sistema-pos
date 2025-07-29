const express = require("express");
const router = express.Router();
const db = require("../db");

// Obtener estado actual de la caja
router.get("/estado-caja", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM estado_caja WHERE fecha = CURDATE() LIMIT 1"
    );
    res.json(rows[0] || { estado: "abierta", saldo_inicial: 0 });
  } catch (error) {
    res.status(500).json({ error: "Error al consultar estado de caja" });
  }
});

// Registrar cierre de caja
router.post("/cierre-caja", async (req, res) => {
  const { total_efectivo, total_tarjeta, total_general, observaciones } = req.body;

  try {
    const [[estadoHoy]] = await db.query(
      "SELECT estado FROM estado_caja WHERE fecha = CURDATE()"
    );

    const [[yaCerrado]] = await db.query(
      "SELECT id FROM cierres_caja WHERE DATE(fecha) = CURDATE() LIMIT 1"
    );

    if (estadoHoy?.estado === "cerrada" || yaCerrado) {
      return res.status(400).json({ error: "La caja ya fue cerrada hoy." });
    }

    await db.query(
      "INSERT INTO cierres_caja (total_efectivo, total_tarjeta, total_general, observaciones) VALUES (?,?,?,?)",
      [total_efectivo, total_tarjeta, total_general, observaciones]
    );

    await db.query("UPDATE estado_caja SET estado = 'cerrada' WHERE fecha = CURDATE()");

    res.json({ mensaje: "Cierre de caja registrado correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar cierre de caja." });
  }
});

// Reabrir o abrir caja
router.post("/abrir-caja", async (req, res) => {
  const { saldo_inicial } = req.body;
  try {
    const [[existeCaja]] = await db.query(
      "SELECT * FROM estado_caja WHERE fecha = CURDATE()"
    );

    if (existeCaja) {
      await db.query(
        "UPDATE estado_caja SET estado = 'abierta', saldo_inicial = ? WHERE fecha = CURDATE()",
        [saldo_inicial || 0]
      );
      return res.json({ mensaje: "Caja reabierta correctamente." });
    }

    await db.query(
      "INSERT INTO estado_caja (fecha, estado, saldo_inicial) VALUES (CURDATE(), 'abierta', ?)",
      [saldo_inicial || 0]
    );

    res.json({ mensaje: "Caja abierta correctamente." });
  } catch (error) {
    res.status(500).json({ error: "Error al abrir la caja." });
  }
});

// Ventas por hora
router.get("/ventas/por-hora", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        HOUR(v.fecha) AS hora,
        COUNT(*) AS facturas,
        SUM(CASE WHEN v.metodo_pago = 'efectivo' THEN v.total ELSE 0 END) AS contado,
        SUM(CASE WHEN v.metodo_pago LIKE 'tarjeta%' OR v.metodo_pago = 'transferencia' THEN v.total ELSE 0 END) AS tarjeta,
        SUM(v.total) AS total
      FROM ventas v
      WHERE DATE(v.fecha) = CURDATE()
      GROUP BY HOUR(v.fecha)
      ORDER BY hora;
    `);
    res.json(rows.map(r => ({
      hora: `${r.hora.toString().padStart(2, '0')}:00`,
      ...r
    })));
  } catch (error) {
    res.status(500).json({ error: "Error al obtener ventas por hora" });
  }
});

// Resumen del día
router.get("/resumen", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [resumen] = await conn.query(`
      SELECT 
        COUNT(*) AS total_facturas,
        SUM(total) AS total_general,
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) AS total_efectivo,
        SUM(CASE WHEN metodo_pago LIKE 'tarjeta%' THEN total ELSE 0 END) AS total_tarjeta
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
    `);

    const [productosVendidos] = await conn.query(`
      SELECT SUM(cantidad) AS total_productos
      FROM detalle_ventas dv
      JOIN ventas v ON v.id = dv.venta_id
      WHERE DATE(v.fecha) = CURDATE()
    `);

    const totalFacturas = resumen[0].total_facturas || 0;
    const totalGeneral = parseFloat(resumen[0].total_general || 0);
    const ticketPromedio = totalFacturas > 0 ? (totalGeneral / totalFacturas).toFixed(2) : 0;

    res.json({
      total_facturas: totalFacturas,
      total_efectivo: parseFloat(resumen[0].total_efectivo || 0),
      total_tarjeta: parseFloat(resumen[0].total_tarjeta || 0),
      total_general: totalGeneral,
      total_productos: productosVendidos[0].total_productos || 0,
      ticket_promedio: parseFloat(ticketPromedio)
    });
  } catch (err) {
    console.error("Error al generar resumen de caja:", err);
    res.status(500).json({ error: "Error al generar resumen" });
  } finally {
    conn.release();
  }
});

module.exports = router;
