import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/listas.css";

const ListaPrecios = ({ volverAHome }) => {
  const [productos, setProductos] = useState([]);
  const [panelAbierto, setPanelAbierto] = useState({});
  const [ediciones, setEdiciones] = useState({});

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/productos");
        setProductos(res.data);
      } catch (err) {
        console.error("Error al obtener productos", err);
      }
    };

    obtenerProductos();
  }, []);

  const toggleEditar = (id) => {
    setPanelAbierto((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    setEdiciones((prev) => ({
      ...prev,
      [id]: {
        precio_base: productos.find(p => p.id === id)?.precio_base || 0,
        margen: calcularMargen(id),
      }
    }));
  };

  const calcularMargen = (id) => {
    const prod = productos.find(p => p.id === id);
    if (!prod || !prod.precio_base || !prod.precio_venta) return 0;
    return (((prod.precio_venta - prod.precio_base) / prod.precio_base) * 100).toFixed(2);
  };

  const handleInputChange = (id, field, value) => {
    setEdiciones((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const guardarCambios = async (id) => {
    const datos = ediciones[id];
    const precio_venta = (datos.precio_base * (1 + datos.margen / 100)).toFixed(2);

    try {
      await axios.put(`http://localhost:3001/api/productos/${id}/precio-base`, {
        precio_base: datos.precio_base,
      });
      await axios.put(`http://localhost:3001/api/productos/${id}/margen`, {
        precio_venta,
      });

      // Refrescar productos después de guardar
      const res = await axios.get("http://localhost:3001/api/productos");
      setProductos(res.data);
      alert("Producto actualizado");
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      alert("Error al guardar");
    }
  };

  return (
    <div className="contenedor-listas">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button className="btn btn-outline-secondary" onClick={volverAHome}>
          ← Volver
        </button>
        <h4>Listas de Precios</h4>
      </div>

      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Precio Base</th>
            <th>Precio Venta</th>
            <th>Margen (%)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((prod) => (
            <React.Fragment key={prod.id}>
              <tr>
                <td>{prod.codigo}</td>
                <td>{prod.nombre}</td>
                <td>${parseFloat(prod.precio_base).toLocaleString("es-AR")}</td>
                <td>${parseFloat(prod.precio_venta).toLocaleString("es-AR")}</td>
                <td>{calcularMargen(prod.id)}%</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => toggleEditar(prod.id)}
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>

              {panelAbierto[prod.id] && (
                <tr className="fila-edicion">
                  <td colSpan="6">
                    <div className="edicion-panel p-3 border rounded bg-light">
                      <div className="row g-2 align-items-center">
                        <div className="col-md-4">
                          <label>Nuevo Precio Base</label>
                          <input
                            type="number"
                            className="form-control"
                            value={ediciones[prod.id]?.precio_base || ""}
                            onChange={(e) =>
                              handleInputChange(prod.id, "precio_base", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-4">
                          <label>Margen (%)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={ediciones[prod.id]?.margen || ""}
                            onChange={(e) =>
                              handleInputChange(prod.id, "margen", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                          <button
                            className="btn btn-success w-100"
                            onClick={() => guardarCambios(prod.id)}
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaPrecios;
