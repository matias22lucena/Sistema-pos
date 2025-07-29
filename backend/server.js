// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const productosRoutes = require('./routes/productos');
const ventasRoutes = require('./routes/ventas');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const notaCreditoRoutes = require("./routes/notadecredito");
const cierreCajaRoutes = require("./routes/CierreCaja");


app.use("/api/cierre-caja", cierreCajaRoutes);
app.use("/api/notas-credito", notaCreditoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/dashboard', dashboardRoutes);



app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
