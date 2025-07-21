import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Registro from "./components/registro";
import Home from "./components/home";
import GestionProductos from "./components/gestionproductos";
import NuevaVenta from "./components/NuevaVenta";

function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route
          path="/"
          element={
            usuario ? (
              <Navigate to="/home" />
            ) : (
              <Login
                onLogin={(usuario) => setUsuario(usuario)}
                mostrarRegistro={() => window.location.replace("/registro")}
              />
            )
          }
        />

        {/* Registro */}
        <Route
          path="/registro"
          element={
            usuario ? (
              <Navigate to="/home" />
            ) : (
              <Registro onRegistrado={() => window.location.replace("/")} />
            )
          }
        />

        {/* Home principal */}
        <Route
          path="/home"
          element={
            usuario ? (
              <Home usuario={usuario} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Gestión de productos */}
        <Route
          path="/productos"
          element={
            usuario ? (
              <GestionProductos volverAHome={() => {}} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Nueva venta */}
<Route path="/ventas/nueva" element={<NuevaVenta />} />

      </Routes>
    </Router>
  );
}

export default App;
