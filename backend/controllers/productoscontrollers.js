import db from '../db.js';

export const obtenerProductos = (req, res) => {
  const sql = 'SELECT * FROM productos';
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
};

export const obtenerResumen = (req, res) => {
  const sql = `SELECT 
    COUNT(*) AS total,
    SUM(CASE WHEN stock < stock_minimo THEN 1 ELSE 0 END) AS stock_bajo,
    SUM(stock * precio) AS valor_total,
    (SELECT COUNT(DISTINCT categoria) FROM productos) AS categorias
  FROM productos`;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
};

export const crearProducto = (req, res) => {
  const { codigo, nombre, marca, categoria, precio, stock, stock_minimo } = req.body;
  const sql = `
    INSERT INTO productos (codigo, nombre, marca, categoria, precio, stock, stock_minimo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [codigo, nombre, marca, categoria, precio, stock, stock_minimo], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ message: 'Producto creado correctamente' });
  });
};
import db from '../db.js';

export const obtenerProductos = (req, res) => {
  const sql = 'SELECT * FROM productos';
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
};

export const obtenerResumen = (req, res) => {
  const sql = `SELECT 
    COUNT(*) AS total,
    SUM(CASE WHEN stock < stock_minimo THEN 1 ELSE 0 END) AS stock_bajo,
    SUM(stock * precio) AS valor_total,
    (SELECT COUNT(DISTINCT categoria) FROM productos) AS categorias
  FROM productos`;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result[0]);
  });
};

export const crearProducto = (req, res) => {
  const { codigo, nombre, marca, categoria, precio, stock, stock_minimo } = req.body;
  const sql = `
    INSERT INTO productos (codigo, nombre, marca, categoria, precio, stock, stock_minimo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [codigo, nombre, marca, categoria, precio, stock, stock_minimo], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ message: 'Producto creado correctamente' });
  });
};