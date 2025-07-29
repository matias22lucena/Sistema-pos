import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/productos.css';

function GestionProductos({ volverAHome }) {
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState({});
  const [pantalla, setPantalla] = useState('lista');
  const [nuevoProducto, setNuevoProducto] = useState({});
  const [productoEditando, setProductoEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const productosBajoStock = productos.filter(p => Number(p.stock) <= Number(p.stock_minimo));
  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toString().includes(busqueda)
  );

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    try {
      const resProd = await axios.get('http://localhost:3001/api/productos');
      const resResumen = await axios.get('http://localhost:3001/api/productos/resumen');
      setProductos(resProd.data);
      setResumen(resResumen.data);
    } catch (err) {
      console.error("Error al cargar productos/resumen", err);
    }
  };

  const handleChange = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/productos', nuevoProducto);
      await obtenerDatos();
      setPantalla('lista');
      setNuevoProducto({});
    } catch (error) {
      console.error('Error al guardar producto', error);
    }
  };

  const handleEditChange = (e) => {
    setProductoEditando({ ...productoEditando, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const productoParaActualizar = { ...productoEditando };
      delete productoParaActualizar.marca;

      await axios.put(
        `http://localhost:3001/api/productos/${productoEditando.id}`,
        productoParaActualizar
      );
      await obtenerDatos();
      setPantalla('lista');
      setProductoEditando(null);
    } catch (err) {
      console.error("Error al actualizar producto", err);
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Eliminar este producto?")) {
      try {
        await axios.delete(`http://localhost:3001/api/productos/${id}`);
        await obtenerDatos();
      } catch (err) {
        console.error("Error al eliminar producto", err);
      }
    }
  };

  const renderFormulario = (titulo, producto, handleChangeFn, handleSubmitFn) => (
    <>
      <div className="fondo-modal" onClick={() => setPantalla('lista')}></div>
      <div className="modal-formulario animate__animated animate__fadeInDown">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">{titulo}</h4>
          <button className="btn-close" onClick={() => setPantalla('lista')} style={{ cursor: 'pointer' }}></button>
        </div>
        <form onSubmit={handleSubmitFn}>
          <div className="mb-3">
            <label className="form-label">Código</label>
            <input type="text" className="form-control" name="codigo" value={producto.codigo || ''} onChange={handleChangeFn} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input type="text" className="form-control" name="nombre" value={producto.nombre || ''} onChange={handleChangeFn} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Precio</label>
            <input type="number" className="form-control" name="precio_base" value={producto.precio_base || ''} onChange={handleChangeFn} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Stock</label>
            <input type="number" className="form-control" name="stock" value={producto.stock || ''} onChange={handleChangeFn} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Stock Mínimo</label>
            <input type="number" className="form-control" name="stock_minimo" value={producto.stock_minimo || ''} onChange={handleChangeFn} required />
          </div>
          <button className="btn btn-primary w-100 mt-2" type="submit">Guardar</button>
        </form>
      </div>
    </>
  );

  return (
    <div className="contenedor-productos">
      <div className="titulo">
        <button className="btn btn-outline-secondary" onClick={volverAHome}>&larr; Volver</button>
        <h2>Gestión de Productos</h2>
      </div>

      <div className="resumen">
        <div><strong>{resumen.total ?? '-'}</strong><br />Total Productos</div>
        <div><strong>{resumen.stock_bajo ?? '-'}</strong><br />Stock Bajo</div>
        <div><strong>${resumen.valor_total?.toLocaleString("es-AR", { minimumFractionDigits: 2 }) ?? '-'}</strong><br />Valor Total Stock</div>
      </div>

      {productosBajoStock.length > 0 && (
        <div className="alerta-stock">
          <div className="d-flex align-items-center gap-2 mb-2">
            <strong>Productos con Stock Bajo</strong>
          </div>
          <div className="lista-bajos">
            {productosBajoStock.map(p => (
              <div className="producto-bajo" key={p.id}>
                <strong>{p.nombre}</strong>
                <div>Stock: {p.stock} / Mín: {p.stock_minimo}</div>
                <span className="badge bg-danger mt-1">Bajo</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="d-flex justify-content-end mb-3">
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: '300px' }}
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="tabla-productos">
        <h4>Lista de Productos</h4>
        <table className="table table-hover align-middle">
          <thead className="table-light">
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
            {productosFiltrados.map(p => (
              <tr key={p.id}>
                <td className="text-danger">{p.codigo}</td>
                <td>{p.nombre}</td>
                <td>${p.precio_base}</td>
                <td className={Number(p.stock) < Number(p.stock_minimo) ? 'text-danger' : ''}>{p.stock}</td>
                <td>
                  {Number(p.stock) <= Number(p.stock_minimo) ? (
                    <span className="badge bg-danger">Stock Bajo</span>
                  ) : Number(p.stock) <= Number(p.stock_minimo) + 5 ? (
                    <span className="badge bg-warning text-dark">Medio</span>
                  ) : (
                    <span className="badge bg-success">Normal</span>
                  )}
                </td>
                <td className="d-flex gap-2">
                  <button className="btn btn-outline-primary btn-sm" onClick={() => {
                    setProductoEditando(p);
                    setPantalla('editar');
                  }}>
                    Editar
                  </button>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleEliminar(p.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        className="btn btn-lg boton-flotante rounded-circle"
        onClick={() => setPantalla('formulario')}
        title="Agregar producto"
      >
        +
      </button>

      {pantalla === 'formulario' && renderFormulario('Nuevo Producto', nuevoProducto, handleChange, handleSubmit)}
      {pantalla === 'editar' && productoEditando && renderFormulario('Editar Producto', productoEditando, handleEditChange, handleEditSubmit)}
    </div>
  );
}

export default GestionProductos;