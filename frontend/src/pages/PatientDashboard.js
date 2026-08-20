import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import { API_URL } from "../config";

export default function PatientDashboard({ setPage }) {
  const [reports, setReports] = useState([]);
  const [documents, setDocuments] = useState([]);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!user?._id) {
      console.log("No user found");
      return;
    }

    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_URL}/reports`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (!res.ok) {
          console.log("ERROR:", await res.text());
          return;
        }
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log(err);
      }
    };

    const fetchDocuments = async () => {
      try {
        const res = await fetch(`${API_URL}/patient/documents`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) {
          console.log("DOCS ERROR:", await res.text());
          return;
        }
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchReports();
    fetchDocuments();
  }, [user?._id]);

  const downloadDocument = async (docId, fileName) => {
    try {
      const res = await fetch(`${API_URL}/patient/document/${docId}/download`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert(err.message);
    }
  };

  const bmiData = useMemo(() => {
    return (reports || [])
      .filter(r => r.height && r.weight)
      .map(r => ({
        month: new Date(r.date || Date.now()).toLocaleString("default", { month: "short" }),
        bmi: Number(r.weight / ((r.height / 100) ** 2)).toFixed(1)
      }));
  }, [reports]);

  const scoreData = useMemo(() => {
    return (reports || []).map(r => {
      let score = 100;
      if (r.severity === "High") score -= 30;
      else if (r.severity === "Moderate") score -= 15;
      return {
        month: new Date(r.date || Date.now()).toLocaleString("default", { month: "short" }),
        score
      };
    });
  }, [reports]);

  const bpData = useMemo(() => {
    return (reports || [])
      .filter(r => r.bloodPressure)
      .map(r => {
        const parts = r.bloodPressure.split("/");
        const sys = Number(parts[0]) || 0;
        const dia = Number(parts[1]) || 0;
        return {
          month: new Date(r.date || Date.now()).toLocaleString("default", { month: "short" }),
          sys,
          dia
        };
      });
  }, [reports]);

  return (
    <div className="space-y-5">
      <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Health Score</h3>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={scoreData}>
            <XAxis dataKey="month" hide />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f6" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">BMI Trend</h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={bmiData}>
            <XAxis dataKey="month" hide />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="bmi" stroke="#06b6d4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Blood Pressure</h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={bpData}>
            <XAxis dataKey="month" hide />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="sys" stroke="#f87171" />
            <Line type="monotone" dataKey="dia" stroke="#fb923c" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Documents from Your Doctor</h3>

        {documents.length === 0 ? (
          <p className="text-slate-500 text-xs">No documents shared yet</p>
        ) : (
          <div className="space-y-3">
            {documents.map((d) => (
              <div key={d.id} className="p-3 rounded-xl border border-white/6 bg-white/3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium text-sm truncate">{d.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-blue-400 text-xs">{d.type}</span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-slate-500 text-xs">Dr. {d.doctorName}</span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-slate-500 text-xs">
                        {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {d.message && (
                      <div className="text-slate-400 text-xs mt-2 bg-white/5 rounded-lg p-2 border border-white/6">
                        {d.message}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => downloadDocument(d.id, d.name)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium flex-shrink-0 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Visit History</h3>
        <div className="space-y-3">
          {reports.map((r, i) => (
            <div
              key={r._id}
              onClick={() => {
                localStorage.setItem("selectedReportId", r._id);
                setPage("reports");
              }}
              className="p-3 rounded-xl border border-white/6 bg-white/3 cursor-pointer"
            >
              <div className="text-white font-medium">
                {r.disease || r.area || "Medical Report"}
              </div>
              <div className="text-xs text-slate-400">
                {r.patientName || user?.name || "Patient"} · {r.area || "Symptom Analysis"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}