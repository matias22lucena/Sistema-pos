import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/venta.css";
import {
  BiSearch,
  BiBarcode,
  BiCartAlt,
  BiTrash,
  BiPlus,
  BiMinus,
} from "react-icons/bi";

const NuevaVenta = () => {
  const [busqueda, setBusqueda] = useState("");
  const [codigo, setCodigo] = useState("");
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [descuento, setDescuento] = useState(0);
  const [recargo, setRecargo] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/productos");
        setProductos(res.data);
      } catch (error) {
        console.error("Error al obtener productos:", error);
      }
    };

    obtenerProductos();
  }, []);
const reproducirSonido = () => {
  const sonido = new Audio("/sounds/beep.mp3");
  sonido.play();
};

  // ✅ Escanear código → agregar al carrito automáticamente
useEffect(() => {
  if (codigo.trim().length > 0) {
    const productoEncontrado = productos.find(p => p.codigo === codigo.trim());
    if (productoEncontrado) {
      agregarAlCarrito(productoEncontrado);
      reproducirSonido(); // ✅ reproducir sonido al escanear
      setCodigo(""); // limpiar el input
    }
  }
}, [codigo, productos]);

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find((item) => item.id === producto.id);
    if (existe) {
      if (existe.cantidad < producto.stock) {
        setCarrito(
          carrito.map((item) =>
            item.id === producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          )
        );
      }
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  const aumentarCantidad = (id) => {
    const producto = productos.find((p) => p.id === id);
    setCarrito(
      carrito.map((item) =>
        item.id === id && item.cantidad < producto.stock
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  const disminuirCantidad = (id) => {
    setCarrito(
      carrito.map((item) =>
        item.id === id && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
    );
  };

  const productosFiltrados = productos.filter(
    (prod) =>
      prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
      prod.codigo.includes(codigo)
  );

  const subtotal = carrito.reduce(
    (acc, item) => acc + item.precio_venta * item.cantidad,
    0
  );

  const total =
    metodoPago === "efectivo"
      ? subtotal - (subtotal * descuento) / 100
      : subtotal + (subtotal * recargo) / 100;

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-3">
        <button
          className="btn btn-link text-decoration-none me-3"
          onClick={() => navigate("/home")}
        >
          ← Volver
        </button>
        <h4 className="mb-0">Facturación</h4>
        <span className="ms-auto badge bg-success">Factura #000001</span>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card p-3 mb-3">
            <h6 className="mb-3">
              <BiSearch className="me-2" />
              Buscar Productos
            </h6>

            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="col-md-6 d-flex">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por código..."
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
                <button
                  className="btn btn-outline-secondary ms-2"
                  onClick={() => setCodigo("")}
                >
                  <BiBarcode />
                </button>
              </div>
            </div>

            <div className="row g-3">
              {productosFiltrados.map((prod) => (
                <div className="col-md-6" key={prod.id}>
                  <div className="card shadow-sm p-3">
                    <h6 className="fw-bold mb-1">{prod.nombre}</h6>
                    <div className="text-muted small mb-1">{prod.codigo}</div>
                    <span className="badge bg-secondary mb-2">
                      {prod.categoria || "Sin categoría"}
                    </span>
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="text-primary fw-bold">
                          ${prod.precio_venta}
                        </div>
                        <small className="text-muted">
                          Costo: ${prod.precio_base} | Stock: {prod.stock}
                        </small>
                      </div>
                      <button
                        className="btn btn-primary align-self-end"
                        onClick={() => agregarAlCarrito(prod)}
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {productosFiltrados.length === 0 && (
                <div className="text-muted text-center mt-4">
                  No se encontraron productos.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card p-3 h-100">
            <h6>
              <BiCartAlt className="me-2" />
              Carrito de Compras
            </h6>

            {carrito.length === 0 ? (
              <div className="text-center text-muted mt-4">
                <BiCartAlt size={48} className="mb-2" />
                <div>No hay productos en el carrito</div>
              </div>
            ) : (
              <div>
                {carrito.map((item) => (
                  <div
                    key={item.id}
                    className="d-flex justify-content-between align-items-center border-bottom py-2"
                  >
                    <div className="flex-grow-1">
                      <strong>{item.nombre}</strong>
                      <br />
                      <small>${item.precio_venta} c/u</small>
                      <br />
                      <div className="input-group mt-1 w-75">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => disminuirCantidad(item.id)}
                        >
                          <BiMinus />
                        </button>
                        <input
                          type="text"
                          value={item.cantidad}
                          className="form-control text-center"
                          readOnly
                        />
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => aumentarCantidad(item.id)}
                          disabled={item.cantidad >= item.stock}
                        >
                          <BiPlus />
                        </button>
                      </div>
                    </div>
                    <div className="text-end">
                      <small>Total:</small>
                      <div>
                        <strong>
                          ${(item.precio_venta * item.cantidad).toFixed(2)}
                        </strong>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger mt-1"
                        onClick={() => eliminarDelCarrito(item.id)}
                      >
                        <BiTrash />
                      </button>
                    </div>
                  </div>
                ))}

                <hr />
                <div className="mb-2 text-end">
                  <div>Subtotal: ${subtotal.toFixed(2)}</div>
                </div>

                {metodoPago === "efectivo" && (
                  <div className="mb-2">
                    <label>Descuento (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="100"
                      value={descuento}
                      onChange={(e) => setDescuento(Number(e.target.value))}
                    />
                  </div>
                )}

                {metodoPago === "tarjeta" && (
                  <div className="mb-2">
                    <label>Recargo (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="100"
                      value={recargo}
                      onChange={(e) => setRecargo(Number(e.target.value))}
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
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

                <h5 className="text-end mt-3">
                  Total: ${total.toFixed(2)}
                </h5>

                <button className="btn btn-success w-100 mt-2">
                  Procesar Venta – ${total.toFixed(2)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevaVenta;
