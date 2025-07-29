// frontend/components/HistorialVentas.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import "../styles/historial.css";

const HistorialVentas = ({ volverAHome }) => {
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState({});
  const [filtroTexto, setFiltroTexto] = useState("");
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [email, setEmail] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState(dayjs().format("YYYY-MM-DD"));

  useEffect(() => {
    obtenerVentas();
  }, [fechaFiltro]);

  const obtenerVentas = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/ventas", {
        params: { fecha: fechaFiltro }
      });
      setVentas(res.data.ventas);
      setResumen(res.data.resumen);
    } catch (err) {
      console.error("Error al cargar ventas:", err);
    }
  };

  const imprimirFactura = async (id) => {
    const res = await axios.get(`http://localhost:3001/api/ventas/${id}/pdf`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  };

  const enviarPorEmail = async (id) => {
    try {
      await axios.post(`http://localhost:3001/api/ventas/${id}/email`, { to: email });
      alert("Factura enviada correctamente.");
    } catch (err) {
      alert("Error al enviar el correo.");
    }
  };

  const crearNotaCredito = async (venta) => {
    const confirmacion = window.confirm("¿Estás seguro que querés emitir una nota de crédito?");
    if (!confirmacion) return;
    try {
      await axios.post("http://localhost:3001/api/notas-credito", { venta_id: venta.id });
      alert("Nota de crédito generada correctamente.");
      setVentaSeleccionada(null);
      obtenerVentas();
    } catch (error) {
      alert("Error al generar la nota de crédito.");
      console.error(error);
    }
  };

  const ventasFiltradas = ventas.filter((v) => {
    const str = `${v.id} ${v.nombre} ${v.dni} ${v.telefono}`.toLowerCase();
    return str.includes(filtroTexto.toLowerCase());
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button onClick={volverAHome} className="btn btn-outline-secondary">
          ← Volver
        </button>
        <input
          type="date"
          className="form-control w-auto"
          value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
          title="Filtrar por fecha"
        />
      </div>

      <h3>Historial de Ventas</h3>

      <div className="row g-3 my-3">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6>Total Ventas</h6>
              <h4>${(resumen.total || 0).toLocaleString("es-AR")}</h4>
              <small>{resumen.total_facturas || 0} facturas</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6>Contado</h6>
              <h5>${(resumen.contado || 0).toLocaleString("es-AR")}</h5>
              <small>{resumen.pct_contado || 0}% del total</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6>Tarjeta</h6>
              <h5>${(resumen.tarjeta || 0).toLocaleString("es-AR")}</h5>
              <small>{resumen.pct_tarjeta || 0}% del total</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6>Notas de Crédito</h6>
              <h5>{resumen.notas_credito || 0}</h5>
              <small>Pendientes de proceso</small>
            </div>
          </div>
        </div>
      </div>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar por número, cliente o teléfono..."
        value={filtroTexto}
        onChange={(e) => setFiltroTexto(e.target.value)}
      />

      <table className="table table-hover">
        <thead>
          <tr>
            <th>Número</th>
            <th>Fecha/Hora</th>
            <th>Cliente</th>
            <th>Items</th>
            <th>Método Pago</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventasFiltradas.map((v) => (
            <tr key={v.id}>
              <td>FAC-{String(v.id).padStart(6, "0")}</td>
              <td>{dayjs(v.fecha).format("YYYY-MM-DD HH:mm")}</td>
              <td>{v.nombre}</td>
              <td>{v.items.length} productos</td>
              <td>{v.metodo_pago}</td>
              <td>${v.total}</td>
              <td><span className="badge bg-success">Completada</span></td>
              <td>
                <i
                  className="bi bi-eye me-2 text-primary"
                  role="button"
                  onClick={() => setVentaSeleccionada(v)}
                ></i>
                {!v.tieneNotaCredito && (
                  <i
                    className="bi bi-arrow-repeat text-warning ms-2"
                    role="button"
                    title="Crear Nota de Crédito"
                    onClick={() => crearNotaCredito(v)}
                  ></i>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {ventaSeleccionada && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Detalle de Venta - FAC-{String(ventaSeleccionada.id).padStart(6, "0")}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setVentaSeleccionada(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Fecha y Hora:</strong> {dayjs(ventaSeleccionada.fecha).format("YYYY-MM-DD HH:mm")}<br />
                  <strong>Cliente:</strong> {ventaSeleccionada.nombre}<br />
                  <strong>Método de Pago:</strong> {ventaSeleccionada.metodo_pago}<br />
                  <strong>Total:</strong> ${ventaSeleccionada.total}<br />
                </p>
                <h6>Productos Vendidos</h6>
                <ul>
                  {ventaSeleccionada.items.map((item, idx) => (
                    <li key={idx}>
                      {item.cantidad} x {item.nombre} (${item.precio_unitario})
                    </li>
                  ))}
                </ul>

                <input
                  type="email"
                  placeholder="Email del cliente"
                  className="form-control my-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setVentaSeleccionada(null)}
                >
                  Cerrar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => imprimirFactura(ventaSeleccionada.id)}
                >
                  Imprimir
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => enviarPorEmail(ventaSeleccionada.id)}
                >
                  Enviar por Email
                </button>
                {!ventaSeleccionada.tieneNotaCredito && (
                  <button
                    className="btn btn-danger"
                    onClick={() => crearNotaCredito(ventaSeleccionada)}
                  >
                    Crear Nota de Crédito
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialVentas;
