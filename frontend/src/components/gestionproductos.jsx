import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/productos.css';

function GestionProductos({ volverAHome }) {
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState({});
  const [nuevoProducto, setNuevoProducto] = useState({});
  const [pantalla, setPantalla] = useState('lista'); // 'lista' o 'formulario'

  // ✅ Stock bajo incluye <=
  const productosBajoStock = productos.filter(p => p.stock <= p.stock_minimo);

  useEffect(() => {
    axios.get('http://localhost:3001/api/productos')
      .then(res => setProductos(res.data))
      .catch(console.error);

    axios.get('http://localhost:3001/api/productos/resumen')
      .then(res => setResumen(res.data))
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/productos', nuevoProducto);
      const res = await axios.get('http://localhost:3001/api/productos');
      setProductos(res.data);
      setPantalla('lista'); // volver a lista
      setNuevoProducto({});
    } catch (error) {
      console.error('Error al guardar producto', error);
    }
  };

  // Pantalla del formulario
  if (pantalla === 'formulario') {
    return (
      <div className="contenedor-productos">
        <div className="titulo">
          <button className="btn btn-outline-secondary" onClick={() => setPantalla('lista')}>
            &larr; Volver
          </button>
          <h2>Nuevo Producto</h2>
        </div>

        <form className="form-nuevo-producto" onSubmit={handleSubmit}>
          <input type="text" className="form-control mb-2" name="codigo" placeholder="Código (manual o escáner)" required onChange={handleChange} />
          <input type="text" className="form-control mb-2" name="nombre" placeholder="Nombre" required onChange={handleChange} />
          <input type="text" className="form-control mb-2" name="marca" placeholder="Marca" onChange={handleChange} />
          <input type="number" className="form-control mb-2" name="precio_base" placeholder="Precio" required onChange={handleChange} />
          <input type="number" className="form-control mb-2" name="stock" placeholder="Stock" required onChange={handleChange} />
          <input type="number" className="form-control mb-2" name="stock_minimo" placeholder="Stock mínimo" required onChange={handleChange} />
          <button className="btn btn-primary mt-2" type="submit">Guardar Producto</button>
        </form>
      </div>
    );
  }

  // Pantalla de listado de productos
  return (
    <div className="contenedor-productos">
      <div className="titulo">
        <button className="btn btn-outline-secondary" onClick={volverAHome}>
          &larr; Volver
        </button>
        <h2>Gestión de Productos</h2>
        <button className="btn btn-success" onClick={() => setPantalla('formulario')}>
          Nuevo Producto
        </button>
      </div>

      <div className="resumen">
        <div>Total Productos<br /><strong>{resumen.total ?? '-'}</strong></div>
        <div>Stock Bajo<br /><strong>{resumen.stock_bajo ?? '-'}</strong></div>
        <div>Valor Total Stock<br /><strong>${resumen.valor_total?.toLocaleString("es-AR", { minimumFractionDigits: 2 }) ?? '-'}</strong></div>
      </div>

      {productosBajoStock.length > 0 && (
        <div className="alerta-stock">
          <span> Productos con Stock Bajo</span>
          <div className="lista-bajos">
            {productosBajoStock.map(p => (
              <div className="producto-bajo" key={p.id}>
                <strong>{p.nombre}</strong>
                <span>Stock: {p.stock} / Mín: {p.stock_minimo}</span>
                <span className="badge bg-danger">Bajo</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tabla-productos">
        <h4>Lista de Productos</h4>
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.nombre}<br /><small>{p.marca}</small></td>
                <td>${p.precio_base}</td>
                <td className={p.stock <= p.stock_minimo ? 'text-danger' : ''}>{p.stock}</td>
                <td>
                  {p.stock <= p.stock_minimo ? (
                    <span className="badge bg-danger">Stock Bajo</span>
                  ) : p.stock <= p.stock_minimo + 5 ? (
                    <span className="badge bg-warning text-dark">Medio</span>
                  ) : (
                    <span className="badge bg-success">Normal</span>
                  )}
                </td>
                <td><button className="btn btn-outline-primary btn-sm">✏️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionProductos;
