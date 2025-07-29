const express = require("express");
const router = express.Router();
const db = require("../db");
const transporter = require("../utils/mailer");
const generarPdfFactura = require("../utils/pdfFactura");
const htmlFactura = require("../utils/htmlFactura");
const dayjs = require("dayjs");

// POST /api/ventas
router.post("/", async (req, res) => {
  const { productos, total, metodo_pago, recargo, cliente } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ Verificar si la caja está cerrada hoy
    const [[estadoCaja]] = await conn.query(
      "SELECT estado FROM estado_caja WHERE fecha = CURDATE() LIMIT 1"
    );
    if (estadoCaja?.estado === "cerrada") {
      await conn.rollback();
      return res
        .status(403)
        .json({ error: "La caja ya fue cerrada hoy. No se pueden registrar más ventas." });
    }

    const [ventaRes] = await conn.query(
      `INSERT INTO ventas (total, metodo_pago) VALUES (?,?)`,
      [total, metodo_pago]
    );
    const ventaId = ventaRes.insertId;

    await conn.query(
      `INSERT INTO datos_clientes (venta_id, nombre, dni, telefono, cuotas)
       VALUES (?,?,?,?,?)`,
      [ventaId, cliente.nombre, cliente.dni, cliente.telefono, cliente.cuotas || null]
    );

    for (const item of productos) {
      await conn.query(
        `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
         VALUES (?,?,?,?)`,
        [ventaId, item.producto_id, item.cantidad, item.precio_unitario]
      );
      await conn.query(
        `UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?`,
        [item.cantidad, item.producto_id, item.cantidad]
      );
    }

    await conn.commit();
    res.json({ success: true, venta_id: ventaId });
  } catch (err) {
    await conn.rollback();
    console.error("Error al procesar la venta:", err);
    res.status(500).json({ error: "Error al procesar la venta" });
  } finally {
    conn.release();
  }
});

// GET /api/ventas/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    const [enc] = await conn.query(
      `SELECT v.id, v.fecha, v.total, v.metodo_pago,
              dc.nombre, dc.dni, dc.telefono, dc.cuotas
         FROM ventas v
         LEFT JOIN datos_clientes dc ON dc.venta_id = v.id
        WHERE v.id = ?`,
      [id]
    );
    if (!enc.length) return res.status(404).json({ error: "No existe venta" });
    const factura = enc[0];

    const [items] = await conn.query(
      `SELECT dv.producto_id, dv.cantidad, dv.precio_unitario,
              p.nombre, p.codigo
         FROM detalle_ventas dv
         JOIN productos p ON p.id = dv.producto_id
        WHERE dv.venta_id = ?`,
      [id]
    );

    const subtotal = items.reduce(
      (acc, it) => acc + it.cantidad * it.precio_unitario,
      0
    );
    factura.subtotal = subtotal;

    res.json({ factura, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al recuperar factura" });
  } finally {
    conn.release();
  }
});

// POST /api/ventas/:id/email
router.post("/:id/email", async (req, res) => {
  const { id } = req.params;
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: "Falta 'to'" });

  const conn = await db.getConnection();
  try {
    const [enc] = await conn.query(
      `SELECT v.id, v.fecha, v.total, v.metodo_pago,
              dc.nombre, dc.dni, dc.telefono, dc.cuotas
         FROM ventas v
         LEFT JOIN datos_clientes dc ON dc.venta_id = v.id
        WHERE v.id = ?`,
      [id]
    );
    if (!enc.length) return res.status(404).json({ error: "No existe venta" });
    const factura = enc[0];

    const [items] = await conn.query(
      `SELECT dv.cantidad, dv.precio_unitario, p.nombre, p.codigo
         FROM detalle_ventas dv
         JOIN productos p ON p.id = dv.producto_id
        WHERE dv.venta_id = ?`,
      [id]
    );

    factura.subtotal = items.reduce(
      (acc, it) => acc + it.cantidad * it.precio_unitario,
      0
    );

    const pdfBuffer = await generarPdfFactura(factura, items);
    const html = htmlFactura(factura, items);

    await transporter.sendMail({
      from: `"POS" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Factura #${String(id).padStart(6, "0")}`,
      html,
      attachments: [
        {
          filename: `Factura_${String(id).padStart(6, "0")}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo enviar el mail" });
  } finally {
    conn.release();
  }
});

// GET /api/ventas
router.get("/", async (req, res) => {
  const { fecha } = req.query;
  const conn = await db.getConnection();
  try {
    const filtroFecha = fecha || dayjs().format("YYYY-MM-DD");

    const [ventas] = await conn.query(
      `SELECT v.id, v.fecha, v.total, v.metodo_pago,
              dc.nombre, dc.dni, dc.telefono, dc.cuotas
       FROM ventas v
       LEFT JOIN datos_clientes dc ON dc.venta_id = v.id
       WHERE DATE(v.fecha) = ?
       ORDER BY v.fecha DESC`,
      [filtroFecha]
    );

    for (const venta of ventas) {
      const [items] = await conn.query(
        `SELECT dv.cantidad, dv.precio_unitario, p.nombre
         FROM detalle_ventas dv
         JOIN productos p ON p.id = dv.producto_id
         WHERE dv.venta_id = ?`,
        [venta.id]
      );
      venta.items = items;

      const [notas] = await conn.query(
        `SELECT COUNT(*) AS total FROM notas_credito WHERE venta_id = ?`,
        [venta.id]
      );
      venta.tieneNotaCredito = notas[0].total > 0;
    }

    const [resDia] = await conn.query(
      `SELECT 
         COUNT(*) AS total_facturas,
         SUM(total) AS total,
         SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) AS contado,
         SUM(CASE WHEN metodo_pago LIKE 'tarjeta%' THEN total ELSE 0 END) AS tarjeta
       FROM ventas
       WHERE DATE(fecha) = ?`,
      [filtroFecha]
    );

    const [notas] = await conn.query(
      `SELECT COUNT(*) AS pendientes
       FROM notas_credito
       WHERE motivo IS NULL OR motivo = ''`
    );

    const total = resDia[0].total || 0;
    const contado = resDia[0].contado || 0;
    const tarjeta = resDia[0].tarjeta || 0;

    res.json({
      ventas,
      resumen: {
        total: total,
        contado: contado,
        tarjeta: tarjeta,
        total_facturas: resDia[0].total_facturas || 0,
        notas_credito: notas[0].pendientes || 0,
        pct_contado: total > 0 ? ((contado / total) * 100).toFixed(1) : 0,
        pct_tarjeta: total > 0 ? ((tarjeta / total) * 100).toFixed(1) : 0
      }
    });
  } catch (err) {
    console.error("Error al obtener historial de ventas:", err);
    res.status(500).json({ error: "Error al obtener historial de ventas" });
  } finally {
    conn.release();
  }
});

// GET /api/ventas/:id/pdf
router.get("/:id/pdf", async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    const [enc] = await conn.query(
      `SELECT v.id, v.fecha, v.total, v.metodo_pago,
              dc.nombre, dc.dni, dc.telefono, dc.cuotas
         FROM ventas v
         LEFT JOIN datos_clientes dc ON dc.venta_id = v.id
        WHERE v.id = ?`,
      [id]
    );
    if (!enc.length) return res.status(404).send("Venta no encontrada");
    const factura = enc[0];

    const [items] = await conn.query(
      `SELECT dv.cantidad, dv.precio_unitario, p.nombre, p.codigo
         FROM detalle_ventas dv
         JOIN productos p ON p.id = dv.producto_id
        WHERE dv.venta_id = ?`,
      [id]
    );

    factura.subtotal = items.reduce(
      (acc, it) => acc + it.cantidad * it.precio_unitario,
      0
    );

    const pdfBuffer = await generarPdfFactura(factura, items);
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error al generar factura PDF:", err);
    res.status(500).send("Error al generar factura PDF");
  } finally {
    conn.release();
  }
});

module.exports = router;
