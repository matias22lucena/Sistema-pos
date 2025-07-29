import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/listas.css";

const ListaPrecios = ({ volverAHome }) => {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [pantalla, setPantalla] = useState("lista");
  const [productoEditando, setProductoEditando] = useState(null);
  const [formulario, setFormulario] = useState({ precio_base: "", margen: "" });
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    obtenerProductos();
  }, []);

  const obtenerProductos = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/productos");
      setProductos(res.data);
      setProductosFiltrados(res.data);
    } catch (err) {
      console.error("Error al obtener productos", err);
    }
  };

  const calcularMargen = (producto) => {
    if (!producto.precio_base || !producto.precio_venta) return 0;
    return (((producto.precio_venta - producto.precio_base) / producto.precio_base) * 100).toFixed(2);
  };

  const editarProducto = (producto) => {
    setProductoEditando(producto);
    setFormulario({
      precio_base: producto.precio_base,
      margen: calcularMargen(producto),
    });
    setPantalla("editar");
  };

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const guardarCambios = async () => {
    const precio_venta = (formulario.precio_base * (1 + formulario.margen / 100)).toFixed(2);
    try {
      await axios.put(`http://localhost:3001/api/productos/${productoEditando.id}/precio-base`, {
        precio_base: formulario.precio_base,
      });
      await axios.put(`http://localhost:3001/api/productos/${productoEditando.id}/margen`, {
        precio_venta,
      });
      await obtenerProductos();
      alert("Producto actualizado");
      setPantalla("lista");
      setProductoEditando(null);
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      alert("Error al guardar");
    }
  };

  const filtrarProductos = (texto) => {
    setBusqueda(texto);
    const resultado = productos.filter(p =>
      p.nombre.toLowerCase().includes(texto.toLowerCase()) ||
      p.codigo.toLowerCase().includes(texto.toLowerCase())
    );
    setProductosFiltrados(resultado);
  };

  return (
    <div className="contenedor-listas">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-outline-secondary" onClick={volverAHome}>
          ← Volver
        </button>
        <h4 className="m-0">Listas de Precios</h4>
        <input
          type="text"
          placeholder="Buscar precios..."
          value={busqueda}
          onChange={(e) => filtrarProductos(e.target.value)}
          className="form-control buscador-productos"
        />
      </div>

      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Precio Base</th>
            <th>Precio Venta</th>
            <th>Margen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((prod) => (
            <tr key={prod.id}>
              <td className="text-danger">{prod.codigo}</td>
              <td>{prod.nombre}</td>
              <td>${parseFloat(prod.precio_base).toLocaleString("es-AR")}</td>
              <td><strong>${parseFloat(prod.precio_venta).toLocaleString("es-AR")}</strong></td>
              <td>{calcularMargen(prod)}%</td>
              <td>
                <button className="btn btn-outline-primary btn-sm" onClick={() => editarProducto(prod)}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pantalla === "editar" && productoEditando && (
        <div className="modal-backdrop">
          <div className="modal-contenido">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button className="btn btn-outline-secondary" onClick={() => setPantalla("lista")}>
                ← Cancelar
              </button>
              <h5 className="m-0">Editar Producto</h5>
              <div></div>
            </div>

            <div className="modal-formulario">
              <div className="mb-2"><strong>Código:</strong> {productoEditando.codigo}</div>
              <div className="mb-2"><strong>Nombre:</strong> {productoEditando.nombre}</div>

              <div className="mb-3">
                <label>Nuevo Precio Base</label>
                <input
                  type="number"
                  name="precio_base"
                  className="form-control"
                  value={formulario.precio_base}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label>Margen (%)</label>
                <input
                  type="number"
                  name="margen"
                  className="form-control"
                  value={formulario.margen}
                  onChange={handleChange}
                />
              </div>

              <div className="d-flex gap-2">
  <button className="btn btn-secondary w-50" onClick={guardarCambios}>
    Guardar Cambios
  </button>
  <button className="btn btn-outline-danger w-50" onClick={() => setPantalla("lista")}>
    Cancelar
  </button>
</div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaPrecios;
