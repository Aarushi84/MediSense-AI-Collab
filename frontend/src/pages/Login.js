import { useState } from "react";
import { API_URL } from "../config";

export default function Login({ onLogin }) {
  const [role, setRole] = useState("patient");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handle = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        setLoading(false);
        return;
      }

      if (!data.user || !data.user._id) {
        alert("Login error: missing user id from backend");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      onLogin(role);

    } catch (err) {
      console.log(err);
      alert("Server error");
    }

    setLoading(false);
  };

  const register = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.email.split("@")[0],
          email: form.email,
          password: form.password,
          role: role.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Register failed");
        setLoading(false);
        return;
      }

      alert("Registered successfully. Now login!");
      setIsRegistering(false);
    } catch (err) {
      alert("Register failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060B18] relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[280px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-5">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span className="text-white text-sm font-bold tracking-wide">
              MediSense AI
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-1">
            {isRegistering ? "Create account" : "Welcome back"}
          </h1>
          <p className="text-slate-500 text-sm">
            {isRegistering ? "Register on your health portal" : "Sign in to your health portal"}
          </p>
        </div>

        <div className="flex bg-white/5 border border-white/8 rounded-2xl p-1 mb-5">
          {[
            { key: "patient", label: "Patient" },
            { key: "doctor", label: "Doctor" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold ${
                role === r.key ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
          <form
            onSubmit={(e) => {
              if (isRegistering) {
                e.preventDefault();
                register();
              } else {
                submit(e);
              }
            }}
            className="space-y-4"
          >
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handle}
              placeholder="Email"
              className="w-full bg-white/5 border border-white/8 text-white rounded-xl px-4 py-3 text-sm"
            />

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handle}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/8 text-white rounded-xl px-4 py-3 text-sm"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold"
            >
              {loading ? "Loading..." : isRegistering ? "Register" : "Login"}
            </button>
          </form>

          <p className="text-center text-xs mt-4 text-slate-500">
            {!isRegistering ? (
              <>
                Don't have an account?{" "}
                <span onClick={() => setIsRegistering(true)} className="text-blue-400 cursor-pointer">
                  Register
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span onClick={() => setIsRegistering(false)} className="text-blue-400 cursor-pointer">
                  Login
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}