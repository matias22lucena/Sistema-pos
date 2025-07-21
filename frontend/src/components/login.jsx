import React, { useState } from "react";
import axios from "axios";
import "../styles/login.css";

const Login = ({ onLogin, mostrarRegistro }) => {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/api/auth/login", {
        correo,
        password,
      });
      localStorage.setItem("usuario", JSON.stringify(res.data));
      setError("");
      onLogin(res.data);
    } catch {
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <div className="login-wrapper d-flex justify-content-center align-items-center vh-100">
      <div className="login-card p-4 shadow rounded">
        <h4 className="text-center mb-4">Iniciar sesión</h4>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="form-control mb-3"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <div className="input-group mb-3">
            <input
              type={mostrar ? "text" : "password"}
              className="form-control"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setMostrar(!mostrar)}
            >
              {mostrar ? "Ocultar" : "Ver"}
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button className="btn btn-primary w-100">Ingresar</button>
        </form>

        <p className="text-center mt-3 mb-0">
          ¿No tenés cuenta?{" "}
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={mostrarRegistro}
          >
            Registrate
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
