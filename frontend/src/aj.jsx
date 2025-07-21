import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Registro from "./components/registro";
import Home from "./components/home";
import GestionProductos from "./components/gestionproductos"; // Vista de productos

function App() {
  const [usuario, setUsuario] = useState(null);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [vista, setVista] = useState('home'); // puede ser 'home' | 'productos'

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
    setVista('home');
  };

  // Navegación
  const irAProductos = () => setVista('productos');
  const volverAHome = () => setVista('home');

  return (
    <div className="App">
      {!usuario ? (
        mostrarRegistro ? (
          <Registro onRegistrado={() => setMostrarRegistro(false)} />
        ) : (
          <Login
            onLogin={(usuario) => setUsuario(usuario)}
            mostrarRegistro={() => setMostrarRegistro(true)}
          />
        )
      ) : vista === 'productos' ? (
        <GestionProductos volverAHome={volverAHome} />
      ) : (
        <Home usuario={usuario} onLogout={handleLogout} onIrAProductos={irAProductos} />
      )}
    </div>
  );
}

export default App;