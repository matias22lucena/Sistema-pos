// src/components/NuevaVenta.jsx
import React, { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/venta.css";
import { BiSearch, BiBarcode, BiCartAlt, BiTrash, BiPlus, BiMinus } from "react-icons/bi";

const NuevaVenta = () => {
  const [busqueda, setBusqueda] = useState("");
  const [codigo, setCodigo] = useState("");
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [ajuste, setAjuste] = useState(0); // puede ser recargo o descuento
  const codigoRef = useRef(null);


  const [cliente, setCliente] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    cuotas: "",
  });

  // Post-venta
  const [ventaExitosa, setVentaExitosa] = useState(false);
  const [ventaId, setVentaId] = useState(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailDest, setEmailDest] = useState("");
  const [snapshot, setSnapshot] = useState(null);

  const navigate = useNavigate();

  // Helpers
  const toNumber = (v) => (typeof v === "number" ? v : Number(v) || 0);
  const reproducirSonido = () => new Audio("/sounds/beep.mp3").play();

  // Cargar productos
  useEffect(() => {
    axios
      .get("http://localhost:3001/api/productos")
      .then((res) => setProductos(res.data))
      .catch(console.error);
  }, []);
  useEffect(() => {
  if (codigoRef.current) {
    codigoRef.current.focus();
  }
}, []);


  // Escaneo código → agrega al carrito
useEffect(() => {
  const prod = productos.find((p) => p.codigo === codigo.trim());
  if (!codigo.trim()) return;

  if (prod && prod.stock > 0) {
    agregarAlCarrito(prod);
    reproducirSonido();
  } else if (prod && prod.stock <= 0) {
    alert("❌ Este producto no tiene stock disponible.");
  }

  setCodigo("");
}, [codigo, productos]);


  // ---------- Carrito ----------
const agregarAlCarrito = (prod) => {
  if (prod.stock <= 0) {
    alert("❌ No hay stock disponible para este producto.");
    return;
  }

  setCarrito((c) => {
    const existe = c.find((i) => i.id === prod.id);
    if (existe) {
      if (existe.cantidad < prod.stock) {
        return c.map((i) =>
          i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      } else {
        alert("⚠️ Stock máximo alcanzado.");
        return c;
      }
    }
    return [...c, { ...prod, cantidad: 1 }];
  });
};


  const eliminarDelCarrito = (id) =>
    setCarrito((c) => c.filter((i) => i.id !== id));

  const aumentarCantidad = (id) =>
    setCarrito((c) =>
      c.map((i) =>
        i.id === id && i.cantidad < productos.find((p) => p.id === id).stock
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      )
    );

  const disminuirCantidad = (id) =>
    setCarrito((c) =>
      c.map((i) =>
        i.id === id && i.cantidad > 1 ? { ...i, cantidad: i.cantidad - 1 } : i
      )
    );

  // ---------- Filtros / Totales ----------
const productosFiltrados = productos.filter(
  (p) =>
    p.stock > 0 && // ✅ Solo si tiene stock
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    p.codigo.includes(codigo)
);

  const subtotal = carrito.reduce(
    (acc, i) => acc + toNumber(i.precio_venta) * i.cantidad,
    0
  );

const total =
  metodoPago === "efectivo"
    ? subtotal - (subtotal * toNumber(ajuste)) / 100
    : subtotal + (subtotal * toNumber(ajuste)) / 100;

  // ---------- Procesar Venta ----------
  const procesarVenta = async () => {
    if (!carrito.length) return alert("Agregá productos.");
    if (!cliente.nombre || !cliente.dni || !cliente.telefono)
      return alert("Completá los datos del cliente.");

    try {
      const payload = {
        productos: carrito.map((i) => ({
          producto_id: i.id,
          cantidad: i.cantidad,
          precio_unitario: toNumber(i.precio_venta),
        })),
        total,
        metodo_pago: metodoPago,
        recargo: toNumber(ajuste),
        cliente,
      };

      const res = await axios.post("http://localhost:3001/api/ventas", payload);

      if (res.data.success) {
        const snap = {
          numero: res.data.venta_id,
          fecha: new Date().toLocaleString(),
          cliente: { ...cliente },
          metodoPago,
          recargo: toNumber(ajuste),
          items: carrito.map((i) => ({
            nombre: i.nombre,
            codigo: i.codigo,
            cantidad: i.cantidad,
            precio: toNumber(i.precio_venta),
            total: toNumber(i.precio_venta) * i.cantidad,
          })),
          subtotal,
          total,
        };

        setSnapshot(snap);
        setVentaId(res.data.venta_id);
        setVentaExitosa(true);
      }
    } catch (e) {
      console.error(e);
      alert("❌ Error al registrar la venta");
    }
  };

  // ---------- Imprimir (iframe oculto, evita popup en blanco) ----------
  const imprimirFactura = () => {
    if (!snapshot) return;

    const html = generarHTMLFactura(snapshot);

    // 1) Crear iframe oculto
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    // 2) Escribir HTML
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    // 3) Imprimir cuando cargue
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // quitar iframe después de imprimir
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  const generarHTMLFactura = (data) => {
    const filas = data.items
      .map(
        (i) => `
      <tr>
        <td style="padding:4px;border:1px solid #ccc;">${i.cantidad}</td>
        <td style="padding:4px;border:1px solid #ccc;">${i.codigo}</td>
        <td style="padding:4px;border:1px solid #ccc;">${i.nombre}</td>
        <td style="padding:4px;border:1px solid #ccc;text-align:right;">$${toNumber(
          i.precio
        ).toFixed(2)}</td>
        <td style="padding:4px;border:1px solid #ccc;text-align:right;">$${toNumber(
          i.total
        ).toFixed(2)}</td>
      </tr>`
      )
      .join("");

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Factura ${data.numero}</title>
        <style>
          body{font-family:Arial,sans-serif;font-size:12px;margin:20px;}
          table{border-collapse:collapse;width:100%;}
          th,td{border:1px solid #ccc;padding:4px;}
          th{text-align:left;background:#f2f2f2;}
        </style>
      </head>
      <body>
        <h2>Factura #${String(data.numero).padStart(6, "0")}</h2>
        <small>Fecha: ${data.fecha}</small><br/>
        <small>COMPROBANTE NO VALIDO COMO FACTURA</small>
        <hr/>
        <strong>Cliente:</strong> ${data.cliente.nombre}<br/>
        <strong>DNI:</strong> ${data.cliente.dni} - <strong>Tel:</strong> ${data.cliente.telefono}<br/>
        <strong>Método de pago:</strong> ${data.metodoPago}${
  data.recargo
    ? data.metodoPago === "efectivo"
      ? ` (descuento ${data.recargo}%)`
      : ` (recargo ${data.recargo}%)`
    : ""
}<br/>

        ${data.cliente.cuotas ? `<strong>Cuotas:</strong> ${data.cliente.cuotas}<br/>` : ""}
        <br/>

        <table>
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Código</th>
              <th>Descripción</th>
              <th style="text-align:right;">Precio</th>
              <th style="text-align:right;">Importe</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>

        <div style="margin-top:12px;text-align:right;">
          <p><strong>Subtotal:</strong> $${toNumber(data.subtotal).toFixed(2)}</p>
          <p><strong>Total:</strong> $${toNumber(data.total).toFixed(2)}</p>
        </div>
      </body>
    </html>`;
  };

  // ---------- Email ----------
  const enviarPorGmail = async () => {
    if (!emailDest) return alert("Ingresá un email");
    try {
      await axios.post(`http://localhost:3001/api/ventas/${ventaId}/email`, {
        to: emailDest,
      });
      alert("📧 Email enviado");
    } catch (e) {
      console.error(e);
      alert("No se pudo enviar el email");
    }
  };

  // ---------- Overlay ----------
  const Overlay = () => (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
      style={{ zIndex: 2000 }}
    >
      <div className="bg-white rounded p-4 shadow" style={{ maxWidth: 380, width: "100%" }}>
        <h5 className="mb-2">Venta #{String(ventaId).padStart(6, "0")} registrada</h5>
        <p className="mb-3">¿Qué querés hacer ahora?</p>

        <button className="btn btn-primary w-100 mb-2" onClick={imprimirFactura}>
          🖨️ Imprimir
        </button>
        <button
          className="btn btn-outline-secondary w-100 mb-2"
          onClick={() => setShowEmailInput((v) => !v)}
        >
          📧 Enviar por Gmail
        </button>
        <button className="btn btn-light w-100" onClick={() => navigate("/home")}>
          Volver al inicio
        </button>

        {showEmailInput && (
<div
  className="mt-3"
  style={{ display: showEmailInput ? "block" : "none" }}
>
  <input
    type="email"
    className="form-control mb-2"
    placeholder="email@cliente.com"
    value={emailDest}
    onChange={(e) => setEmailDest(e.target.value)}
    autoFocus
  />
  <button className="btn btn-success w-100" onClick={enviarPorGmail}>
    Enviar ahora
  </button>
</div>

        )}
      </div>
    </div>
  );

  // ---------- Render ----------
  return (
    <div className="container mt-4">
      {ventaExitosa && <Overlay />}

      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-link me-3" onClick={() => navigate("/home")}>
          ← Volver
        </button>
        <h4 className="mb-0">Facturación</h4>
        <span className="ms-auto badge bg-success">Factura #000001</span>
      </div>

      <div className="row">
        {/* Productos */}
        <div className="col-md-8">
          <div className="card p-3 mb-3">
            <h6>
              <BiSearch className="me-2" /> Buscar Productos
            </h6>
            <div className="row g-2 mb-3">
              <div className="col-6">
                <input
                  className="form-control"
                  placeholder="Nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="col-6 d-flex">
                <input
                  className="form-control"
                  placeholder="Código..."
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  ref={codigoRef}
                />

                <button className="btn btn-outline-secondary ms-2" onClick={() => setCodigo("")}>
                  <BiBarcode />
                </button>
              </div>
            </div>

            <div className="row g-3">
              {productosFiltrados.map((p) => (
                <div className="col-6" key={p.id}>
                  <div className="card shadow-sm p-3">
                    <h6 className="mb-1">{p.nombre}</h6>
                    <small className="text-muted d-block mb-1">{p.codigo}</small>
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="fw-bold">${p.precio_venta}</div>
                        <small className="text-muted">Stock: {p.stock}</small>
                      </div>
                      <button className="btn btn-primary" onClick={() => agregarAlCarrito(p)}>
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!productosFiltrados.length && (
                <div className="text-center text-muted mt-3 w-100">
                  No se encontraron productos.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carrito & Pago */}
        <div className="col-md-4">
          <div className="card p-3 h-100">
            <h6>
              <BiCartAlt className="me-2" /> Carrito
            </h6>

            {!carrito.length ? (
              <div className="text-center text-muted mt-4">
                <BiCartAlt size={48} className="mb-2" />
                No hay productos
              </div>
            ) : (
              <>
                {carrito.map((i) => (
                  <div
                    key={i.id}
                    className="d-flex justify-content-between align-items-center border-bottom py-2"
                  >
                    <div>
                      <strong>{i.nombre}</strong>
                      <br />
                      <small>${toNumber(i.precio_venta).toFixed(2)} c/u</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => disminuirCantidad(i.id)}
                      >
                        <BiMinus />
                      </button>
                      <span className="px-2">{i.cantidad}</span>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => aumentarCantidad(i.id)}
                      >
                        <BiPlus />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={() => eliminarDelCarrito(i.id)}
                      >
                        <BiTrash />
                      </button>
                    </div>
                    <div>${(toNumber(i.precio_venta) * i.cantidad).toFixed(2)}</div>
                  </div>
                ))}

                <hr />
                <div className="text-end mb-2">
                  <strong>Subtotal: ${subtotal.toFixed(2)}</strong>
                </div>

{(metodoPago === "efectivo" ||
  metodoPago === "transferencia" ||
  metodoPago === "tarjeta_debito" ||
  metodoPago === "tarjeta_credito") && (
  <div className="mb-2">
    <label>
      {metodoPago === "efectivo" ? "Descuento (%)" : "Recargo (%)"}
    </label>
    <input
      type="number"
      className="form-control"
      min="0"
      max="100"
      value={ajuste}
      onChange={(e) => setAjuste(+e.target.value)}
    />
  </div>
)}


                <div className="mb-2">
                  <label>Nombre y Apellido</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cliente.nombre}
                    onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label>DNI</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cliente.dni}
                    onChange={(e) => setCliente({ ...cliente, dni: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cliente.telefono}
                    onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                  />
                </div>
                {metodoPago === "tarjeta_credito" && (
                  <div className="mb-2">
                    <label>Cuotas</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: 3"
                      value={cliente.cuotas}
                      onChange={(e) => setCliente({ ...cliente, cuotas: e.target.value })}
                    />
                  </div>
                )}

                <div className="mb-2">
                  <label>Método de Pago</label>
                  <select
                    className="form-select"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta_debito">Tarjeta Débito</option>
                    <option value="tarjeta_credito">Tarjeta Crédito</option>
                  </select>
                </div>

                <h5 className="text-end mt-3">Total: ${total.toFixed(2)}</h5>
                <button className="btn btn-success w-100" onClick={procesarVenta}>
                  Procesar Venta – ${total.toFixed(2)}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevaVenta;
