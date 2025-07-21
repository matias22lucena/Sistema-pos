import React, { useState } from "react";
import axios from "axios";
import "../styles/register.css";

const Registro = ({ onRegistrado }) => {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmar: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      await axios.post("http://localhost:3001/api/auth/register", {
        nombre: form.nombre,
        correo: form.correo,
        password: form.password,
      });

      setMensaje("✅ Usuario registrado correctamente.");
      setForm({
        nombre: "",
        correo: "",
        password: "",
        confirmar: "",
      });

      setTimeout(onRegistrado, 1500);
    } catch (err) {
      if (err.response?.status === 409) {
        setError("El correo ya está registrado.");
      } else {
        setError("Error al registrar el usuario.");
      }
    }
  };

  return (
    <div className="register-wrapper d-flex justify-content-center align-items-center vh-100">
      <div className="register-card p-4 shadow rounded">
        <h4 className="text-center mb-4">Crear cuenta</h4>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nombre"
            className="form-control mb-3"
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="correo"
            className="form-control mb-3"
            placeholder="Correo electrónico"
            value={form.correo}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            className="form-control mb-3"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmar"
            className="form-control mb-3"
            placeholder="Confirmar contraseña"
            value={form.confirmar}
            onChange={handleChange}
            required
          />

          {error && <div className="alert alert-danger">{error}</div>}
          {mensaje && <div className="alert alert-success">{mensaje}</div>}

          <button className="btn btn-success w-100" type="submit">
            Registrarse
          </button>
        </form>

        <p className="text-center mt-3 mb-0">
          ¿Ya tenés cuenta?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onRegistrado(); // Vuelve al login
            }}
          >
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
};

export default Registro;
