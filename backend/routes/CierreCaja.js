const express = require("express");
const router = express.Router();
const db = require("../db");
const dayjs = require("dayjs");
const ExcelJS = require("exceljs");
const puppeteer = require("puppeteer");

// Estado actual de la caja
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

// Resumen del día
router.get("/resumen", async (req, res) => {
  try {
    const [[totales]] = await db.query(`
      SELECT 
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) AS total_efectivo,
        SUM(CASE WHEN metodo_pago LIKE 'tarjeta%' THEN total ELSE 0 END) AS total_tarjeta,
        SUM(total) AS total_general,
        COUNT(*) AS total_facturas
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
    `);

    const [[productos]] = await db.query(`
      SELECT SUM(cantidad) AS total_productos
      FROM detalle_ventas dv
      JOIN ventas v ON v.id = dv.venta_id
      WHERE DATE(v.fecha) = CURDATE()
    `);

    const [[promedio]] = await db.query(`
      SELECT AVG(total) AS ticket_promedio
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
    `);

    res.json({
      ...totales,
      total_productos: productos.total_productos || 0,
      ticket_promedio: Number(promedio.ticket_promedio || 0).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener resumen" });
  }
});

// Ventas por hora
router.get("/ventas/por-hora", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        HOUR(fecha) AS hora,
        COUNT(*) AS facturas,
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) AS contado,
        SUM(CASE WHEN metodo_pago LIKE 'tarjeta%' THEN total ELSE 0 END) AS tarjeta,
        SUM(total) AS total
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
      GROUP BY HOUR(fecha)
      ORDER BY hora ASC
    `);

    const resultado = rows.map(r => ({
      hora: `${r.hora.toString().padStart(2, '0')}:00`,
      ...r
    }));

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener ventas por hora" });
  }
});

// Cierre de caja
router.post("/cierre-caja", async (req, res) => {
  const { total_efectivo, total_tarjeta, total_general, observaciones } = req.body;

  try {
    const [[estadoHoy]] = await db.query("SELECT estado FROM estado_caja WHERE fecha = CURDATE()");
    if (estadoHoy && estadoHoy.estado === "cerrada") {
      return res.status(400).json({ error: "La caja ya fue cerrada hoy." });
    }

    const [[yaCerrado]] = await db.query("SELECT id FROM cierres_caja WHERE DATE(fecha_cierre) = CURDATE() LIMIT 1");
    if (yaCerrado) {
      console.warn("Ya existe un cierre de caja registrado hoy.");
      // Se permite continuar igual
    }

    await db.query(
      "INSERT INTO cierres_caja (total_efectivo, total_tarjeta, total_general, observaciones) VALUES (?,?,?,?)",
      [total_efectivo, total_tarjeta, total_general, observaciones]
    );
    await db.query("UPDATE estado_caja SET estado = 'cerrada' WHERE fecha = CURDATE()");

    res.json({ mensaje: "Cierre de caja registrado correctamente." });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar cierre de caja." });
  }
});

// Reabrir caja
router.post("/abrir-caja", async (req, res) => {
  const { saldo_inicial } = req.body;
  try {
    const [[existe]] = await db.query("SELECT id FROM estado_caja WHERE fecha = CURDATE() LIMIT 1");

    if (existe) {
      await db.query("UPDATE estado_caja SET estado = 'abierta', saldo_inicial = ? WHERE fecha = CURDATE()", [saldo_inicial]);
    } else {
      await db.query("INSERT INTO estado_caja (fecha, estado, saldo_inicial) VALUES (CURDATE(), 'abierta', ?)", [saldo_inicial]);
    }

    res.json({ mensaje: "Caja reabierta correctamente." });
  } catch (err) {
    res.status(500).json({ error: "Error al reabrir caja." });
  }
});

// Descargar Excel
router.get("/descargar-excel", async (req, res) => {
  try {
    const [[resumen]] = await db.query(`
      SELECT 
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) AS efectivo,
        SUM(CASE WHEN metodo_pago LIKE 'tarjeta%' THEN total ELSE 0 END) AS tarjeta,
        SUM(total) AS total,
        COUNT(*) AS facturas
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
    `);

    const [productosVendidos] = await db.query(`
      SELECT SUM(cantidad) AS total_productos
      FROM detalle_ventas dv
      JOIN ventas v ON v.id = dv.venta_id
      WHERE DATE(v.fecha) = CURDATE()
    `);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Cierre de Caja");

    sheet.addRow(["Resumen del Cierre de Caja"]);
    sheet.addRow(["Fecha", dayjs().format("YYYY-MM-DD")]);
    sheet.addRow([]);
    sheet.addRow(["Ventas en efectivo", resumen.efectivo]);
    sheet.addRow(["Ventas con tarjeta", resumen.tarjeta]);
    sheet.addRow(["Total general", resumen.total]);
    sheet.addRow(["Facturas del día", resumen.facturas]);
    sheet.addRow(["Productos vendidos", productosVendidos[0].total_productos]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=cierre_caja_${dayjs().format("YYYY-MM-DD")}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: "No se pudo generar el Excel." });
  }
});

// Descargar PDF
router.get("/descargar-pdf", async (req, res) => {
  try {
    const [[resumen]] = await db.query(`
      SELECT 
        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) AS efectivo,
        SUM(CASE WHEN metodo_pago LIKE 'tarjeta%' THEN total ELSE 0 END) AS tarjeta,
        SUM(total) AS total,
        COUNT(*) AS facturas
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
    `);

    const [productosVendidos] = await db.query(`
      SELECT SUM(cantidad) AS total_productos
      FROM detalle_ventas dv
      JOIN ventas v ON v.id = dv.venta_id
      WHERE DATE(v.fecha) = CURDATE()
    `);

    const html = `
      <html>
        <head><style>body { font-family: Arial; padding: 20px; }</style></head>
        <body>
          <h2>Resumen del Cierre de Caja</h2>
          <p><strong>Fecha:</strong> ${dayjs().format("YYYY-MM-DD")}</p>
          <p><strong>Ventas en efectivo:</strong> $${resumen.efectivo}</p>
          <p><strong>Ventas con tarjeta:</strong> $${resumen.tarjeta}</p>
          <p><strong>Total general:</strong> $${resumen.total}</p>
          <p><strong>Facturas del día:</strong> ${resumen.facturas}</p>
          <p><strong>Productos vendidos:</strong> ${productosVendidos[0].total_productos}</p>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=cierre_caja_${dayjs().format("YYYY-MM-DD")}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: "No se pudo generar el PDF." });
  }
});

module.exports = router;
