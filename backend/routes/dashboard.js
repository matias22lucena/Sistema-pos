const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    // Ventas hoy
    const [ventasHoy] = await db.query(`
      SELECT 
        SUM(total) AS total_ventas, 
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) AS total_efectivo,
        SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) AS total_tarjeta
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
    `);

    // Ventas ayer
    const [ventasAyer] = await db.query(`
      SELECT SUM(total) AS total FROM ventas WHERE DATE(fecha) = CURDATE() - INTERVAL 1 DAY
    `);

    // Productos vendidos hoy
    const [productosVendidos] = await db.query(`
      SELECT SUM(cantidad) AS total_vendidos
      FROM detalle_ventas
      JOIN ventas ON ventas.id = detalle_ventas.venta_id
      WHERE DATE(ventas.fecha) = CURDATE()
    `);

    // Productos con stock bajo
    const [stockBajo] = await db.query(`
      SELECT COUNT(*) AS productos_bajo
      FROM productos
      WHERE stock <= stock_minimo
    `);

    // Notas de crédito pendientes
    const [notasPendientes] = await db.query(`
      SELECT COUNT(*) AS total FROM notas_credito WHERE motivo IS NULL OR motivo = ''
    `);

    // Estado de la caja (modificación agregada)
    const [estadoCaja] = await db.query(`
      SELECT estado FROM estado_caja WHERE fecha = CURDATE()
    `);

    // Porcentaje de cambio respecto a ayer
    const hoy = ventasHoy[0].total_ventas || 0;
    const ayer = ventasAyer[0].total || 0;
    const porcentaje = ayer === 0 ? 0 : ((hoy - ayer) / ayer) * 100;

    // Meta diaria
    const meta = 18000;
    const progreso = hoy >= meta ? 100 : (hoy / meta) * 100;
    const restante = Math.max(0, meta - hoy);

    res.json({
      total_ventas: hoy,
      total_efectivo: ventasHoy[0].total_efectivo || 0,
      total_tarjeta: ventasHoy[0].total_tarjeta || 0,
      productos_vendidos: productosVendidos[0].total_vendidos || 0,
      productos_stock_bajo: stockBajo[0].productos_bajo || 0,
      porcentaje_ventas: porcentaje.toFixed(1),
      meta_diaria: {
        porcentaje: progreso.toFixed(1),
        restante: restante.toFixed(2),
        meta: meta
      },
      notas_pendientes: notasPendientes[0].total,
      estado_caja: estadoCaja[0]?.estado || 'desconocido'  // <- agregado
    });
  } catch (err) {
    console.error("Error en dashboard:", err);
    res.status(500).json({ error: "Error al obtener los datos del dashboard" });
  }
});

module.exports = router;
