import { useState } from "react";
import { API_URL } from "../config";

export default function Register({ onRegister }) {
  const [role, setRole] = useState("patient");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handle = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        role
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Registered successfully");
      onRegister();
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060B18]">
      <div className="bg-white/5 p-6 rounded-xl w-96 space-y-4">

        <h2 className="text-white text-xl font-bold">Register</h2>

        <input
          name="name"
          placeholder="Name"
          onChange={handle}
          className="w-full p-2 bg-white/10 text-white"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handle}
          className="w-full p-2 bg-white/10 text-white"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handle}
          className="w-full p-2 bg-white/10 text-white"
        />

        <select
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 bg-white/10 text-white"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>

        <button
          onClick={submit}
          className="w-full bg-blue-500 p-2 text-white rounded"
        >
          Register
        </button>
      </div>
    </div>
  );
}