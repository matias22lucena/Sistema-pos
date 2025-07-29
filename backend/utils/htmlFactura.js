// backend/utils/htmlFactura.js
const dayjs = require("dayjs");
const numeral = require("numeral");

module.exports = function htmlFactura(fact, items) {
  const fmt = (n) => `$${numeral(n).format("0,0.00")}`;

  // Calcular porcentaje de ajuste
  const ajustePct =
    fact.subtotal && fact.total
      ? Math.round(((fact.total - fact.subtotal) / fact.subtotal) * 100)
      : 0;

  // Mostrar "descuento" si es efectivo, "recargo" en otros casos
  let leyenda = "";
  if (ajustePct !== 0) {
    if (fact.metodo_pago === "efectivo" && ajustePct < 0) {
      leyenda = ` (descuento ${Math.abs(ajustePct)}%)`;
    } else if (ajustePct > 0) {
      leyenda = ` (recargo ${ajustePct}%)`;
    }
  }

  const filas = items
    .map(
      (i) => `<tr>
        <td style="width:8%;text-align:center">${i.cantidad}</td>
        <td style="width:18%">${i.codigo}</td>
        <td style="width:36%">${i.nombre}</td>
        <td style="width:19%;text-align:right">${fmt(i.precio_unitario)}</td>
        <td style="width:19%;text-align:right">${fmt(
          i.cantidad * i.precio_unitario
        )}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;font-size:13px;color:#000;">
    <h3 style="margin:0 0 4px 0;">Factura #${String(fact.id).padStart(6, "0")}</h3>
    <small style="color:#555">Fecha: ${dayjs(fact.fecha).format(
      "DD/MM/YYYY HH:mm"
    )}</small><br/>
    <small style="color:#555;text-decoration:underline">COMPROBANTE NO VALIDO COMO FACTURA</small>
    <hr style="margin:10px 0"/>

    <p style="margin:0 0 8px 0;">
      <strong>Cliente:</strong> ${fact.nombre}<br/>
      <strong>DNI:</strong> ${fact.dni} &nbsp; <strong>Tel:</strong> ${fact.telefono}<br/>
      <strong>Método de pago:</strong> ${fact.metodo_pago}${leyenda}<br/>
      ${fact.cuotas ? `<strong>Cuotas:</strong> ${fact.cuotas}<br/>` : ""}
    </p>

    <table width="100%" cellpadding="4" cellspacing="0" border="1"
           style="border-collapse:collapse;border:1px solid #999;">
      <thead style="background:#f2f2f2;">
        <tr>
          <th style="width:8%;text-align:center">Cant.</th>
          <th style="width:18%;text-align:left">Código</th>
          <th style="width:36%;text-align:left">Descripción</th>
          <th style="width:19%;text-align:right">Precio</th>
          <th style="width:19%;text-align:right">Importe</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <p style="text-align:right;margin-top:10px;margin-bottom:0;">
      Subtotal: ${fmt(fact.subtotal)}<br/>
      <strong>Total: ${fmt(fact.total)}</strong>
    </p>
  </div>`;
};
