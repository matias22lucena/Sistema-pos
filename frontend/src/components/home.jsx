// ✅ Home.jsx actualizado con botón adicional para listas de precios
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/home.css";
import { useNavigate } from "react-router-dom";

const Home = ({ usuario, onLogout }) => {
  const [data, setData] = useState({
    total_ventas: 0,
    total_efectivo: 0,
    total_tarjeta: 0,
    productos_vendidos: 0,
    productos_stock_bajo: 0,
    porcentaje_ventas: 0,
    meta_diaria: {
      porcentaje: 0,
      restante: 0,
      meta: 0,
    },
    notas_pendientes: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Error al cargar dashboard:", err);
      }
    };

    obtenerDatos();
  }, []);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-cart3 me-2"></i> Sistema POS
        </h2>
        <div>
          <span className="badge bg-success me-2">Caja Abierta</span>
          <button className="btn btn-outline-dark" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6>Ventas Hoy</h6>
              <h4>${data.total_ventas.toLocaleString("es-AR")}</h4>
              <small className={data.porcentaje_ventas >= 0 ? "text-success" : "text-danger"}>
                {data.porcentaje_ventas >= 0 ? "+" : ""}
                {data.porcentaje_ventas}% respecto a ayer
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6>Venta Contado</h6>
              <h5>${data.total_efectivo.toLocaleString("es-AR")}</h5>
              <small>
                {((data.total_efectivo / (data.total_ventas || 1)) * 100).toFixed(1)}% del total
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6>Venta Tarjeta</h6>
              <h5>${data.total_tarjeta.toLocaleString("es-AR")}</h5>
              <small>
                {((data.total_tarjeta / (data.total_ventas || 1)) * 100).toFixed(1)}% del total
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6>Productos Vendidos</h6>
              <h4>{data.productos_vendidos}</h4>
              <small>{data.productos_stock_bajo} con stock bajo</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header fw-bold">Acciones Rápidas</div>
            <div className="card-body">
              <p className="text-muted">Funciones principales del sistema</p>
              <div className="d-grid gap-2">
                <button className="btn btn-dark" onClick={() => navigate("/ventas/nueva")}>
                  <i className="bi bi-cart4 me-2"></i>Nueva Venta
                </button>
                <button className="btn btn-outline-dark" onClick={() => navigate("/productos")}>
                  <i className="bi bi-box me-2"></i>Productos
                </button>
                <button className="btn btn-outline-dark" onClick={() => navigate("/listas-precios")}>
                  <i className="bi bi-currency-dollar me-2"></i>Listas de Precios
                </button>
                <button className="btn btn-outline-dark">
                  <i className="bi bi-clock-history me-2"></i>Historial
                </button>
                <button className="btn btn-outline-dark">
                  <i className="bi bi-graph-up me-2"></i>Cierre Caja
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header fw-bold">Alertas del Sistema</div>
            <div className="card-body">
              <div className="alert alert-warning d-flex align-items-center" role="alert">
                <i className="bi bi-box-seam me-2"></i>
                Stock Bajo – {data.productos_stock_bajo} productos necesitan reposición
              </div>
              <div className="alert alert-success d-flex align-items-center" role="alert">
                <i className="bi bi-cash-coin me-2"></i>
                Meta Diaria – {data.meta_diaria.porcentaje}% completada – $
                {parseFloat(data.meta_diaria.restante).toLocaleString("es-AR")} restantes
              </div>
              <div className="alert alert-primary d-flex align-items-center" role="alert">
                <i className="bi bi-receipt-cutoff me-2"></i>
                Facturas Pendientes – {data.notas_pendientes} notas de crédito por procesar
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
