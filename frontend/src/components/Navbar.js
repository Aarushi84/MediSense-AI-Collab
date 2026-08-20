import { useState } from "react";

const patientNav = [
  { id: "dashboard", label: "My Health", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  { id: "analyze", label: "Analyze Symptom", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, highlight: true },
  { id: "reports", label: "My Reports", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { id: "chat", label: "AI Assistant", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
];

const doctorNav = [
  { id: "dashboard", label: "Dashboard", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { id: "patient", label: "Patient Form", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { id: "results", label: "Results", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { id: "upload", label: "Upload Docs", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> },
  { id: "chatbot", label: "AI Assistant", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
];

export default function Navbar({ role, activePage, setPage, onLogout }) {
  const [open, setOpen] = useState(false);
 const items = role === "patient" ? patientNav : doctorNav;

const user = JSON.parse(localStorage.getItem("user")) || {};

const name = user.name || (role === "patient" ? "Patient" : "Doctor");

const initial = name?.charAt(0)?.toUpperCase() || "?";

const badge = role === "patient" ? "Patient" : "Doctor";
  const badgeCls = role === "patient" ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : "text-violet-400 bg-violet-400/10 border-violet-400/20";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060B18]/90 backdrop-blur-xl border-b border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow shadow-blue-500/30">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            </div>
            <span className="text-white font-bold text-sm tracking-tight">MediSense <span className="text-cyan-400">AI</span></span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeCls}`}>{badge}</span>
          </div>

          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-1">
            {items.map(item => (
              <button key={item.id} onClick={() => setPage(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activePage === item.id
                    ? item.highlight ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow shadow-blue-500/25" : "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                    : item.highlight ? "text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}>
                {item.icon}{item.label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-2.5 py-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-xs text-white font-bold">{initial}</div>
              <span className="text-slate-300 text-xs">{name}</span>
            </div>
            <button onClick={onLogout} title="Logout" className="text-slate-500 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-500/10">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
            <button onClick={() => setOpen(!open)} className="md:hidden text-slate-400 hover:text-white p-1.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      {open && (
        <div className="md:hidden border-t border-white/6 bg-[#060B18]/95 px-4 py-2 space-y-1">
          {items.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activePage === item.id ? "bg-blue-500/15 text-blue-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}