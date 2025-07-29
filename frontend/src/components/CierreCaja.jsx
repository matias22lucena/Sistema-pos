import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/caja.css";
import { BiArrowBack, BiTrendingUp } from "react-icons/bi";

function CierreCaja({ volverAHome }) {
  const [efectivoContado, setEfectivoContado] = useState(0);
  const [resumen, setResumen] = useState(null);
  const [ventasPorHora, setVentasPorHora] = useState([]);
  const [estadoCaja, setEstadoCaja] = useState({});
  const [horaActual, setHoraActual] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [res1, res2, res3] = await Promise.all([
        axios.get("http://localhost:3001/api/cierre-caja/resumen"),
        axios.get("http://localhost:3001/api/cierre-caja/ventas/por-hora"),
        axios.get("http://localhost:3001/api/cierre-caja/estado-caja"),
      ]);

      setResumen(res1.data);
      setVentasPorHora(res2.data);
      setEstadoCaja(res3.data);
    } catch (error) {
      console.error("Error cargando datos del cierre de caja:", error);
    }
  };

  useEffect(() => {
    fetchData();

    const timer = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString("es-AR", { hour12: false }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!resumen || !estadoCaja) return <div>Cargando datos...</div>;

  const diferencia = (efectivoContado - resumen.total_efectivo).toFixed(2);
  const totalGeneral = resumen.total_general.toFixed(2);

  const realizarCierre = async () => {
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:3001/api/cierre-caja/cierre-caja", {
        total_efectivo: resumen.total_efectivo,
        total_tarjeta: resumen.total_tarjeta,
        total_general: resumen.total_general,
        observaciones: `Efectivo contado: ${efectivoContado}, Diferencia: ${diferencia}`,
      });
      alert(res.data.mensaje || "Cierre realizado correctamente.");
      await fetchData(); // Recarga estado actualizado
    } catch (err) {
      alert(err?.response?.data?.error || "Error al realizar el cierre.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reabrirCaja = async () => {
    const saldo = prompt("¿Saldo inicial al reabrir la caja?", "0") || "0";
    try {
      const res = await axios.post("http://localhost:3001/api/cierre-caja/abrir-caja", {
        saldo_inicial: parseFloat(saldo),
      });
      alert(res.data.mensaje);
      await fetchData(); // Recarga estado
    } catch (err) {
      alert("Error al reabrir la caja.");
      console.error(err);
    }
  };

  return (
    <div className="cierre-caja-container">
      <div className="top-bar">
        <div className="volver" onClick={volverAHome}>
          <BiArrowBack />
          <span>Volver</span>
        </div>
        <h2><BiTrendingUp /> Cierre de Caja</h2>
        <div className="estado-caja">
          {estadoCaja.estado === "cerrada" ? "Caja Cerrada" : "Caja Abierta"}
        </div>
      </div>

      <div className="contenido-cierre">
        <div className="resumen-dia">
          <h4>$ Resumen del Día</h4>
          <div className="tarjetas-resumen">
            <div className="tarjeta tarjeta-contado">
              <p>Contado</p>
              <h3>${resumen.total_efectivo}</h3>
            </div>
            <div className="tarjeta tarjeta-tarjeta">
              <p>Tarjeta</p>
              <h3>${resumen.total_tarjeta}</h3>
            </div>
            <div className="tarjeta tarjeta-facturas">
              <p>Facturas</p>
              <h3>{resumen.total_facturas}</h3>
            </div>
            <div className="tarjeta tarjeta-promedio">
              <p>Promedio</p>
              <h3>${resumen.ticket_promedio}</h3>
            </div>
          </div>
          <div className="total-general">
            <strong>Total General:</strong> ${totalGeneral}
          </div>
        </div>

        <div className="panel-cierre">
          <h4>Cierre de Caja</h4>
          <label>Efectivo Contado Físicamente</label>
          <input
            type="number"
            value={efectivoContado}
            onChange={(e) => setEfectivoContado(parseFloat(e.target.value) || 0)}
          />
          <p>Ventas en Efectivo: <strong>${resumen.total_efectivo}</strong></p>
          <p>Efectivo Contado: <strong>${efectivoContado}</strong></p>
          <p className="diferencia">
            Diferencia: <strong style={{ color: "red" }}>{diferencia}</strong>
          </p>
          <hr />
          <h5>Resumen Final</h5>
          <p>Efectivo en caja: ${efectivoContado}</p>
          <p>Ventas con tarjeta: ${resumen.total_tarjeta}</p>
          <p><strong>Total del día:</strong> ${totalGeneral}</p>

          <button
            onClick={realizarCierre}
            disabled={estadoCaja.estado === "cerrada" || loading}
          >
            Realizar Cierre
          </button>

          {estadoCaja.estado === "cerrada" && (
            <button onClick={reabrirCaja} style={{ marginTop: "10px", backgroundColor: "#555" }}>
              Reabrir Caja
            </button>
          )}
        </div>
      </div>

      <div className="tablas-inferiores">
        <div className="tabla-horaria">
          <h4>Ventas por Hora</h4>
          <table>
            <thead>
              <tr>
                <th>Horario</th>
                <th>Facturas</th>
                <th>Contado</th>
                <th>Tarjeta</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasPorHora.map((h, i) => (
                <tr key={i}>
                  <td>{h.hora}</td>
                  <td>{h.facturas}</td>
                  <td>${h.contado}</td>
                  <td>${h.tarjeta}</td>
                  <td>${h.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="info-adicional">
          <h4>Información Adicional</h4>
          <p>Productos vendidos: {resumen.total_productos}</p>
          <p>Ticket promedio: ${resumen.ticket_promedio}</p>
          <p>Hora de apertura: {estadoCaja?.creado_en?.split("T")[1]?.slice(0, 5) || "00:00"}</p>
          <p>Hora actual: {horaActual}</p>
        </div>
      </div>
    </div>
  );
}

export default CierreCaja;
