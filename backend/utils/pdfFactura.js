// backend/utils/pdfFactura.js
const PDFDocument = require("pdfkit");
const dayjs = require("dayjs");
const numeral = require("numeral");

function generarPdfFactura(fact, items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fmt = (n) => `$${numeral(n).format("0,0.00")}`;

    // Calcular porcentaje de ajuste
    const ajustePct =
      fact.subtotal && fact.total
        ? Math.round(((fact.total - fact.subtotal) / fact.subtotal) * 100)
        : 0;

    let leyenda = "";
    if (ajustePct !== 0) {
      if (fact.metodo_pago === "efectivo" && ajustePct < 0) {
        leyenda = ` (descuento ${Math.abs(ajustePct)}%)`;
      } else if (ajustePct > 0) {
        leyenda = ` (recargo ${ajustePct}%)`;
      }
    }

    // -------- Cabecera --------
    doc.fontSize(16).text(`Factura #${String(fact.id).padStart(6, "0")}`);
    doc.moveDown(0.2);
    doc.fontSize(10).text(`Fecha: ${dayjs(fact.fecha).format("DD/MM/YYYY HH:mm")}`);
    doc.text("COMPROBANTE NO VALIDO COMO FACTURA", { underline: true });
    doc.moveDown();

    // -------- Datos cliente --------
    doc.fontSize(11).text("Cliente:", { continued: false });
    doc.text(`Nombre: ${fact.nombre}`);
    doc.text(`DNI: ${fact.dni}   Tel: ${fact.telefono}`);
    if (fact.cuotas) doc.text(`Cuotas: ${fact.cuotas}`);
    doc.text(`Método de pago: ${fact.metodo_pago}${leyenda}`);
    doc.moveDown();

    // -------- Tabla --------
    const startX = 36;
    let y = doc.y;
    const rowH = 18;

    const cols = [
      { title: "Cant.", width: 45, align: "left" },
      { title: "Código", width: 105, align: "left" },
      { title: "Descripción", width: 230, align: "left" },
      { title: "Precio", width: 80, align: "right" },
      { title: "Importe", width: 80, align: "right" },
    ];

    const drawCell = (x, yPos, w, h, txt, align = "left") => {
      doc.rect(x, yPos, w, h).stroke();
      doc.text(txt, x + 3, yPos + 4, { width: w - 6, align });
    };

    // Encabezado tabla
    let x = startX;
    cols.forEach((c) => {
      drawCell(x, y, c.width, rowH, c.title, c.align);
      x += c.width;
    });
    y += rowH;

    // Filas
    items.forEach((it) => {
      if (y + rowH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.y;
        x = startX;
        cols.forEach((c) => {
          drawCell(x, y, c.width, rowH, c.title, c.align);
          x += c.width;
        });
        y += rowH;
      }

      const row = [
        it.cantidad,
        it.codigo,
        it.nombre,
        fmt(it.precio_unitario),
        fmt(it.cantidad * it.precio_unitario),
      ];

      x = startX;
      cols.forEach((c, idx) => {
        drawCell(x, y, c.width, rowH, row[idx], c.align);
        x += c.width;
      });
      y += rowH;
    });

    // -------- Totales --------
    doc.moveDown(2);
    doc.text(`Subtotal: ${fmt(fact.subtotal)}`, { align: "right" });
    doc.text(`Total: ${fmt(fact.total)}`, { align: "right" });

    doc.end();
  });
}

module.exports = generarPdfFactura;
