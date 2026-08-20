import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { API_URL } from "../config";

const authHeader = () => ({ "Authorization": `Bearer ${localStorage.getItem("token")}` });

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"];

const riskColors = {
  Low: "text-emerald-400 bg-emerald-400/10",
  Moderate: "text-amber-400 bg-amber-400/10",
  High: "text-red-400 bg-red-400/10",
};

const statIcons = {
  "Total Patients": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  "Avg. BMI": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  ),
  "Reports Today": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ),
  "Risk Alerts": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  ),
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [otherSymptoms, setOtherSymptoms] = useState("");

  const [showAllModal, setShowAllModal] = useState(false);
  const [allPatients, setAllPatients] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login again");
        setLoading(false);
        return;
      }

      try {
        const [statsRes, patientsRes] = await Promise.all([
          fetch(`${API_URL}/doctor/stats`, { headers: authHeader() }),
          fetch(`${API_URL}/doctor/patients`, { headers: authHeader() }),
        ]);

        const statsData = await statsRes.json();
        const patientsData = await patientsRes.json();

        if (!statsRes.ok) throw new Error(statsData.error || "Failed to load stats");
        if (!patientsRes.ok) throw new Error(patientsData.error || "Failed to load patients");

        setStats(statsData);
        setRecentPatients(patientsData.recentPatients || []);
      } catch (err) {
        console.log("DASHBOARD LOAD ERROR:", err.message);
        setError("Failed to load dashboard data");
      }

      setLoading(false);
    };

    load();
  }, []);

  const openAllPatients = async () => {
    setShowAllModal(true);
    setLoadingAll(true);
    try {
      const res = await fetch(`${API_URL}/doctor/patients/all`, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAllPatients(data.allPatients || []);
    } catch (err) {
      console.log("ALL PATIENTS ERROR:", err.message);
    }
    setLoadingAll(false);
  };

  const saveOtherSymptoms = async (reportId) => {
    try {
      const res = await fetch(
        `${API_URL}/doctor/report/${reportId}/other-symptoms`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ otherSymptoms }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Saved successfully");
    } catch (err) {
      console.log(err);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  const statCards = [
    { label: "Total Patients", value: stats.totalPatients },
    { label: "Avg. BMI", value: stats.avgBmi },
    { label: "Reports Today", value: stats.reportsToday },
    { label: "Risk Alerts", value: stats.riskAlerts },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Health Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Overview of patient analytics & insights</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500/20 transition">
                {statIcons[s.label]}
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Condition Distribution</h3>
          {stats.conditionDistribution.length === 0 ? (
            <p className="text-slate-500 text-xs">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.conditionDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {stats.conditionDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {stats.conditionDistribution.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-white font-medium">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Weekly Patient Visits</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.weeklyPatients} barSize={24}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
              <Bar dataKey="patients" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Avg. BMI Trend</h3>
          {stats.bmiTrend.length === 0 ? (
            <p className="text-slate-500 text-xs">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.bmiTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} domain={[18, 32]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                <Line type="monotone" dataKey="bmi" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Recent Patients</h3>
          <span onClick={openAllPatients} className="text-blue-400 text-xs cursor-pointer hover:text-blue-300 transition">View all →</span>
        </div>
        {recentPatients.length === 0 ? (
          <p className="text-slate-500 text-xs">No reports yet</p>
        ) : (
          <div className="space-y-2">
            {recentPatients.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/3 rounded-xl px-2 transition cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-500/20 flex items-center justify-center text-blue-300 text-sm font-bold">
                    {p.name[0]}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium group-hover:text-blue-300 transition">{p.name}</div>
                    <div className="text-slate-500 text-xs">{p.condition} · Age {p.age}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center hidden sm:block">
                    <div className="text-white text-sm font-medium">{p.bmi}</div>
                    <div className="text-slate-500 text-xs">BMI</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${riskColors[p.risk] || riskColors.Moderate}`}>
                    {p.risk} Risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAllModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAllModal(false)}>
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">All Patients</h3>
              <button onClick={() => setShowAllModal(false)} className="text-slate-400 hover:text-white text-sm">Close ✕</button>
            </div>
            {loadingAll ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : allPatients.length === 0 ? (
              <p className="text-slate-500 text-sm">No reports yet</p>
            ) : (
              <div className="space-y-2">
                {allPatients.map((p) => (
                  <div key={p.id} className="border-b border-white/5 last:border-0">
                    <div
                      className="flex items-center justify-between py-3 cursor-pointer hover:bg-white/3 rounded-xl px-2 transition"
                      onClick={() => {
                        if (expandedId === p.id) {
                          setExpandedId(null);
                        } else {
                          setExpandedId(p.id);
                          setOtherSymptoms(p.otherSymptoms || "");
                        }
                      }}
                    >
                      <div>
                        <div className="text-white text-sm font-medium">{p.name}</div>
                        <div className="text-slate-500 text-xs">{p.condition} · Age {p.age}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-white text-sm">{p.bmi}</div>
                          <div className="text-slate-500 text-xs">BMI</div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${riskColors[p.risk] || riskColors.Moderate}`}>
                          {p.risk} Risk
                        </span>
                        <span className="text-slate-500 text-xs">{expandedId === p.id ? "▲" : "▼"}</span>
                      </div>
                    </div>

                    {expandedId === p.id && (
                      <div className="bg-white/3 rounded-xl p-4 mb-2 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          {p.gender && p.gender.trim() !== "" && p.gender !== "-" && (
                            <div>
                              <span className="text-slate-400">Gender:</span>
                              <p className="text-white">{p.gender}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-400">Height:</span>
                            <p className="text-white">{p.height ? `${p.height} cm` : "-"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Weight:</span>
                            <p className="text-white">{p.weight ? `${p.weight} kg` : "-"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Blood Pressure:</span>
                            <p className="text-white">{p.bloodPressure || "-"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Blood Sugar:</span>
                            <p className="text-white">{p.bloodSugar || "-"}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Duration:</span>
                            <p className="text-white">{p.duration || "-"}</p>
                          </div>
                        </div>

                        {p.area && (
                          <div>
                            <span className="text-slate-400">Affected Area:</span>
                            <p className="text-white">{p.area}</p>
                          </div>
                        )}

                        {p.description && (
                          <div>
                            <span className="text-slate-400">Description:</span>
                            <p className="text-white">{p.description}</p>
                          </div>
                        )}

                        {p.symptoms?.length > 0 && (
                          <div>
                            <span className="text-slate-400">Symptoms:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {p.symptoms.map((s, i) => (
                                <span key={i} className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-slate-400 block mb-2">Other Symptoms</label>
                          <textarea
                            rows={3}
                            value={expandedId === p.id ? otherSymptoms : ""}
                            onChange={(e) => setOtherSymptoms(e.target.value)}
                            placeholder="Enter additional symptoms..."
                            className="w-full rounded-lg bg-slate-800 border border-slate-600 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => saveOtherSymptoms(p.id)}
                          className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                        >
                          Save
                        </button>

                        {p.notes && (
                          <div>
                            <span className="text-slate-400">Doctor Notes:</span>
                            <p className="text-white">{p.notes}</p>
                          </div>
                        )}

                        {p.image && (
                          <div>
                            <span className="text-slate-400">Uploaded Image:</span>
                            <img
                              src={`${API_URL}/uploads/${p.image}`}
                              alt={p.name}
                              className="w-32 mt-2 rounded-lg border border-white/10"
                            />
                          </div>
                        )}

                        {p.recordType === "patient" && (
                          <>
                            {p.summary && (
                              <div>
                                <span className="text-slate-400">AI Summary:</span>
                                <p className="text-white">{p.summary}</p>
                              </div>
                            )}
                            {p.abnormalities?.length > 0 && (
                              <div>
                                <span className="text-slate-400">Abnormalities:</span>
                                {p.abnormalities.map((a, i) => <div key={i} className="text-white">• {a}</div>)}
                              </div>
                            )}
                            {p.treatments?.length > 0 && (
                              <div>
                                <span className="text-slate-400">Treatments:</span>
                                {p.treatments.map((t, i) => <div key={i} className="text-white">• {t}</div>)}
                              </div>
                            )}
                            {p.warnings?.length > 0 && (
                              <div className="text-yellow-400">
                                <span className="font-semibold">Warnings:</span>
                                {p.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                              </div>
                            )}
                            {p.seeDoctorReason && (
                              <div className="text-red-400">
                                <span className="font-semibold">Follow-up:</span>
                                <p>{p.seeDoctorReason}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}