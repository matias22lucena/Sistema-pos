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
    porcentaje_ventas: 0
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState("");

  const beep = new Audio("/sounds/beep.mp3");
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

  const buscarProducto = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/productos`);
      const encontrado = res.data.find(p => p.codigo === codigo);
      if (encontrado) {
        beep.play();
        if (navigator.vibrate) navigator.vibrate(100);
        setProducto(encontrado);
        setCodigo(""); // 🔄 limpiar input si se encuentra
        setError("");
      } else {
        if (navigator.vibrate) navigator.vibrate([150, 100, 150]);
        setProducto(null);
        setError("Producto no encontrado");
      }
    } catch (err) {
      console.error(err);
      setError("Error al buscar producto");
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-cart3 me-2"></i> Sistema POS</h2>
        <div>
<span className={`badge me-2 ${data.estado_caja === 'abierta' ? 'bg-success' : 'bg-danger'}`}>
  {data.estado_caja === 'abierta' ? 'Caja Abierta' : 'Caja Cerrada'}
</span>
          <button className="btn btn-outline-dark" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {/* tarjetas de dashboard */}
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
        {/* acciones rápidas */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header fw-bold">Acciones Rápidas</div>
            <div className="card-body">
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
                <button className="btn btn-outline-dark" onClick={() => navigate("/ventas")}>
                  <i className="bi bi-clock-history me-2"></i>Historial
                </button>
                <button className="btn btn-outline-dark" onClick={() => navigate("/caja")}>
                  <i className="bi bi-graph-up me-2"></i>Cierre Caja
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* alertas y consultar precio */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header fw-bold">Alertas del Sistema</div>
            <div className="card-body">
              <div className="alert alert-warning d-flex align-items-center" role="alert">
                <i className="bi bi-box-seam me-2"></i>
                Stock Bajo – {data.productos_stock_bajo} productos necesitan reposición
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header fw-bold">Consulta de Precios</div>
            <div className="card-body text-center">
              <button className="btn btn-outline-dark w-100" onClick={() => {
                setMostrarModal(true);
                setCodigo("");
                setProducto(null);
                setError("");
              }}>
                <i className="bi bi-search me-2"></i>Consultar Precio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* modal */}
      {mostrarModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Consultar Precio</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setMostrarModal(false);
                  setCodigo("");
                  setProducto(null);
                  setError("");
                }}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Escaneá o escribí el código del producto"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarProducto()}
                  autoFocus
                />
                <button className="btn btn-primary w-100 mb-2" onClick={buscarProducto}>
                  Buscar
                </button>

                {producto && (
                  <div className="alert alert-success text-center">
                    <i className="bi bi-check-circle-fill fs-4 text-success me-2"></i><br />
                    <strong className="fs-5">{producto.nombre}</strong><br />
                    <span className="fs-4">Precio: <strong>${producto.precio_venta}</strong></span>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger text-center">
                    <i className="bi bi-x-circle-fill me-2"></i>
                    {error}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => {
                  setMostrarModal(false);
                  setCodigo("");
                  setProducto(null);
                  setError("");
                }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
