import { useState, useEffect } from "react";
import { API_URL } from "../config";

const riskColors = {
  Low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Moderate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  High: "text-red-400 bg-red-400/10 border-red-400/20",
};

function computeHealthScore(p) {
  let score = 100;

  if (p.risk === "Low") score -= 10;
  else if (p.risk === "Moderate") score -= 35;
  else if (p.risk === "High") score -= 65;

  const h = parseFloat(p.height);
  const w = parseFloat(p.weight);
  if (h > 0 && w > 0) {
    const bmi = w / Math.pow(h / 100, 2);
    if (bmi < 16 || bmi > 35) score -= 20;
    else if (bmi < 18.5 || bmi > 25) score -= 10;
  }

  const bpMatch = /^(\d+)\/(\d+)$/.exec((p.bloodPressure || "").trim());
  if (bpMatch) {
    const [, sys, dia] = bpMatch;
    if (parseInt(sys) >= 140 || parseInt(dia) >= 90) score -= 10;
  }

  const sugar = parseFloat(p.bloodSugar);
  if (!isNaN(sugar) && sugar >= 140) score -= 10;

  score -= Math.min((p.warnings?.length || 0) * 3, 15);

  return Math.max(Math.round(score), 0);
}

function scoreLabel(score) {
  if (score >= 80) return { label: "Good", color: "#10b981" };
  if (score >= 55) return { label: "Fair", color: "#f59e0b" };
  return { label: "Needs Attention", color: "#ef4444" };
}

export default function Result() {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingSymptoms, setEditingSymptoms] = useState(false);
  const [otherSymptomsDraft, setOtherSymptomsDraft] = useState("");
  const [savingSymptoms, setSavingSymptoms] = useState(false);

  const loadPatients = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?._id) {
      setError("Please login again");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/doctor/patients/all`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reports");
      setPatients(data.allPatients || []);
      if (data.allPatients?.length > 0 && !selectedId) {
        setSelectedId(data.allPatients[0].id);
      }
    } catch (err) {
      console.log("RESULTS LOAD ERROR:", err.message);
      setError("Failed to load reports");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveOtherSymptoms = async () => {
    setSavingSymptoms(true);
    try {
      const res = await fetch(`${API_URL}/doctor/report/${selectedId}/other-symptoms`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ otherSymptoms: otherSymptomsDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setEditingSymptoms(false);
      loadPatients();
    } catch (err) {
      console.log("SAVE OTHER SYMPTOMS ERROR:", err.message);
    }
    setSavingSymptoms(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading reports...</div>;
  }
  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-400 text-sm">{error}</div>;
  }
  if (patients.length === 0) {
    return <div className="flex items-center justify-center h-64 text-slate-500 text-sm">No patient reports yet</div>;
  }

  const p = patients.find((x) => x.id === selectedId) || patients[0];
  const isAiRecord = !!(p.image || (p.condition && p.condition !== "-") || p.summary);
  const score = computeHealthScore(p);
  const scoreInfo = scoreLabel(score);
  const circumference = 2 * Math.PI * 15.9;
  const dash = (score / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Health Analysis Results</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {isAiRecord ? "AI-powered insights for" : "Patient record for"} {p.name} · {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          {patients.map((pt) => (
            <option key={pt.id} value={pt.id} className="bg-slate-900">
              {pt.name} · {new Date(pt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border border-blue-500/20 rounded-2xl p-6 flex flex-wrap items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={scoreInfo.color} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-bold text-white">{score}</span>
            <span className="text-slate-400 text-xs">/100</span>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-white font-bold text-xl mb-1">
            {isAiRecord ? p.condition : p.name} · <span style={{ color: scoreInfo.color }}>{scoreInfo.label}</span>
          </div>
          <p className="text-slate-400 text-xs mb-2">
            Heuristic score based on severity, vitals, and warnings — not a clinical diagnosis.
          </p>
          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${riskColors[p.risk] || riskColors.Moderate}`}>
            {p.risk} Risk
          </span>
        </div>
      </div>

      {isAiRecord && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-2">AI Summary</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{p.summary || "No AI summary available for this report."}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-slate-400 text-xs mb-1">BMI</div>
          <div className="text-white text-xl font-bold">{p.bmi}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-slate-400 text-xs mb-1">Blood Pressure</div>
          <div className="text-white text-xl font-bold">{p.bloodPressure}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-slate-400 text-xs mb-1">Blood Sugar</div>
          <div className="text-white text-xl font-bold">{p.bloodSugar}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-slate-400 text-xs mb-1">Age</div>
          <div className="text-white text-xl font-bold">{p.age}</div>
        </div>
      </div>

      {(p.area !== "-" || p.description !== "-" || p.symptoms?.length > 0) && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Reported Symptoms</h3>
          {p.area !== "-" && <p className="text-slate-300 text-sm mb-1"><b className="text-white">Area:</b> {p.area}</p>}
          {p.description !== "-" && <p className="text-slate-300 text-sm mb-1"><b className="text-white">Description:</b> {p.description}</p>}
          {p.duration !== "-" && <p className="text-slate-300 text-sm mb-1"><b className="text-white">Duration:</b> {p.duration}</p>}
          {p.symptoms?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {p.symptoms.map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Other Symptoms (Doctor Notes)</h3>
          {!editingSymptoms && (
            <button
              onClick={() => { setOtherSymptomsDraft(p.otherSymptoms || ""); setEditingSymptoms(true); }}
              className="text-blue-400 text-xs hover:text-blue-300 transition"
            >
              {p.otherSymptoms ? "Edit" : "Add"}
            </button>
          )}
        </div>
        {editingSymptoms ? (
          <div className="space-y-2">
            <textarea
              value={otherSymptomsDraft}
              onChange={(e) => setOtherSymptomsDraft(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Note any additional symptoms observed during examination..."
            />
            <div className="flex gap-2">
              <button
                onClick={saveOtherSymptoms}
                disabled={savingSymptoms}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition disabled:opacity-50"
              >
                {savingSymptoms ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditingSymptoms(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-300 text-sm">{p.otherSymptoms || "No additional symptoms recorded."}</p>
        )}
      </div>

      {p.image && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Uploaded Image</h3>
          <img
            src={`${API_URL}/uploads/${p.image}`}
            alt={`${p.name} report`}
            className="w-48 rounded-xl border border-white/10"
          />
        </div>
      )}

      {isAiRecord ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">AI Findings</h3>
          {p.abnormalities.length === 0 && p.treatments.length === 0 && p.warnings.length === 0 && !p.seeDoctorReason ? (
            <p className="text-slate-500 text-sm">No AI analysis available for this record.</p>
          ) : (
            <div className="space-y-4">
              {p.abnormalities.length > 0 && (
                <div>
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Abnormalities</div>
                  {p.abnormalities.map((a, i) => <div key={i} className="text-slate-300 text-sm py-1">• {a}</div>)}
                </div>
              )}
              {p.treatments.length > 0 && (
                <div>
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Treatments</div>
                  {p.treatments.map((t, i) => <div key={i} className="text-slate-300 text-sm py-1">• {t}</div>)}
                </div>
              )}
              {p.warnings.length > 0 && (
                <div>
                  <div className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-2">Warnings</div>
                  {p.warnings.map((w, i) => <div key={i} className="text-yellow-400 text-sm py-1">⚠ {w}</div>)}
                </div>
              )}
              {p.seeDoctorReason && (
                <div>
                  <div className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">Follow-up</div>
                  <p className="text-red-400 text-sm">{p.seeDoctorReason}</p>
                </div>
              )}
            </div>
          )}
          {p.notes && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Doctor Notes</div>
              <p className="text-slate-300 text-sm">{p.notes}</p>
            </div>
          )}
        </div>
      ) : (
        p.notes && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-2">Doctor Notes</h3>
            <p className="text-slate-300 text-sm">{p.notes}</p>
          </div>
        )
      )}
    </div>
  );
}