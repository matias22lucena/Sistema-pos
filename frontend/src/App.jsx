import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Registro from "./components/registro";
import Home from "./components/home";
import GestionProductos from "./components/gestionproductos";
import NuevaVenta from "./components/NuevaVenta";
import ListaPrecios from "./components/ListaPrecios";
import HistorialVentas from "./components/HistorialVentas";
import CierreCaja from "./components/CierreCaja"; // ✅ renombrado correctamente

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

  const irAProductos = () => {
    window.location.replace("/productos");
  };

  const volverAHome = () => {
    window.location.replace("/home");
  };

  return (
    <Router>
      <Routes>
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
        <Route
          path="/home"
          element={
            usuario ? (
              <Home usuario={usuario} onLogout={handleLogout} onIrAProductos={irAProductos} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/productos"
          element={
            usuario ? <GestionProductos volverAHome={volverAHome} /> : <Navigate to="/" />
          }
        />
        <Route
          path="/ventas/nueva"
          element={usuario ? <NuevaVenta /> : <Navigate to="/" />}
        />
        <Route
          path="/listas-precios"
          element={usuario ? <ListaPrecios volverAHome={volverAHome} /> : <Navigate to="/" />}
        />
        <Route
          path="/ventas"
          element={usuario ? <HistorialVentas volverAHome={volverAHome} /> : <Navigate to="/" />}
        />
        <Route
          path="/caja"
          element={usuario ? <CierreCaja volverAHome={volverAHome} /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
