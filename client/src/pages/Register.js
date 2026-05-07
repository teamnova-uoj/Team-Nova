import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";
import "./Register.css";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is not valid";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        await axios.post("http://localhost:5000/api/register", form);
        alert("Registration successful! Check your email.");
      } catch (error) {
        alert("Error registering user");
      }
    }
  };

  return (
    <div className="register-page">

      <Navbar />

      <div
        className="hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        {/* Register Box (same as login-box style) */}
        <div className="register-box">

          <h2>User Register</h2>

          <form onSubmit={handleSubmit}>

            <label>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter Name"
              value={form.name}
              onChange={handleChange}
            />
            <span className="error">{errors.name}</span>

            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={form.email}
              onChange={handleChange}
            />
            <span className="error">{errors.email}</span>

            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={form.password}
              onChange={handleChange}
            />
            <span className="error">{errors.password}</span>

            <button type="submit" className="register-btn">
              Register
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}

export default Register;