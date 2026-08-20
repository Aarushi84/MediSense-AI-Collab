import { useState, useEffect, useRef } from "react";
import { API_URL } from "../config";

const authHeader = () => ({ "Authorization": `Bearer ${localStorage.getItem("token")}` });

const drugSuggestions = [
  "Interactions between metformin and lisinopril",
  "Standard adult dosing for amoxicillin",
  "Contraindications for ibuprofen in renal impairment",
  "Differential for elevated BP with headache",
];

export default function DoctorAIAssistant() {
  const [tab, setTab] = useState("summary");

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Clinical reference assistant ready. Ask about drug interactions, dosing, contraindications, or differentials." }
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await fetch(`${API_URL}/doctor/patients-list`, {
          headers: authHeader(),
        });
        const data = await res.json();
        setPatients(data.patients || []);
      } catch (err) {
        console.log("PATIENTS LIST ERROR:", err.message);
      }
    };
    loadPatients();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const generateSummary = async () => {
    if (!selectedPatient) return;
    setSummaryLoading(true);
    setSummaryError("");
    setSummary("");

    try {
      const patientName = patients.find((p) => p.id === selectedPatient)?.name;
      const res = await fetch(
        `${API_URL}/doctor/patient-reports?name=${encodeURIComponent(patientName)}`,
        { headers: authHeader() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reports");

      if (!data.reports || data.reports.length === 0) {
        setSummaryError("No reports found for this patient.");
        setSummaryLoading(false);
        return;
      }

      const visitSummaries = await Promise.all(
        data.reports.map(async (r, i) => {
          const visitText =
            `Condition: ${r.disease || "-"}, Severity: ${r.severity || "-"}, ` +
            `BP: ${r.bloodPressure || "-"}, Sugar: ${r.bloodSugar || "-"}, ` +
            `Symptoms: ${(r.symptoms || []).join(", ") || "-"}, Notes: ${r.summary || "-"}`;

          const aiRes = await fetch(`${API_URL}/doctor/generate-summary`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader() },
            body: JSON.stringify({ text: visitText }),
          });
          const aiData = await aiRes.json();
          if (!aiRes.ok) throw new Error(aiData.error || "Summary generation failed");

          return `Visit ${i + 1} (${new Date(r.createdAt).toLocaleDateString()}) — ${r.disease}, Risk: ${aiData.riskLevel}\n${aiData.summary}`;
        })
      );

      setSummary(visitSummaries.join("\n\n"));
    } catch (err) {
      setSummaryError(err.message);
    }
    setSummaryLoading(false);
  };

  const sendChat = async (text) => {
    const msg = text || input.trim();
    if (!msg || chatLoading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/doctor/ai-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.log("AI LOOKUP FAILED:", data.error);
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error || "AI service failed"}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Empty response from AI." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setChatLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow shadow-blue-500/30">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">Clinical AI Assistant</h1>
          <span className="text-emerald-400 text-xs">For physician use · Not a replacement for clinical judgment</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("summary")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "summary" ? "bg-blue-500/15 border border-blue-500/40 text-blue-300" : "bg-white/5 border border-white/10 text-slate-400"
          }`}
        >
          Patient Summary
        </button>
        <button
          onClick={() => setTab("lookup")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === "lookup" ? "bg-blue-500/15 border border-blue-500/40 text-blue-300" : "bg-white/5 border border-white/10 text-slate-400"
          }`}
        >
          Drug & Clinical Lookup
        </button>
      </div>

      {tab === "summary" && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-3">Select Patient</h2>
            <select
              value={selectedPatient}
              onChange={(e) => { setSelectedPatient(e.target.value); setSummary(""); setSummaryError(""); }}
              className="w-full bg-white/5 border border-white/8 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60"
            >
              <option value="" className="bg-[#060B18] text-white">Choose a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#060B18] text-white">{p.name}</option>
              ))}
            </select>

            <button
              onClick={generateSummary}
              disabled={!selectedPatient || summaryLoading}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm disabled:opacity-40"
            >
              {summaryLoading ? "Generating summary..." : "Generate Summary"}
            </button>
          </div>

          {summaryError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
              {summaryError}
            </div>
          )}

          {summary && (
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
              <h2 className="text-white font-semibold text-sm mb-3">Summary</h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{summary}</p>
            </div>
          )}
        </div>
      )}

      {tab === "lookup" && (
        <>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-sm"
                    : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    {[0, 1, 2].map((d) => (
                      <div key={d} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {drugSuggestions.map((s, i) => (
                <button key={i} onClick={() => sendChat(s)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-xs hover:border-blue-500/40 hover:text-blue-400 transition">
                  {s}
                </button>
              ))}
            </div>
          )}

          <p className="text-slate-600 text-xs text-center mb-3">
            ⚕️ Cross-check against current official prescribing references before clinical use.
          </p>

          <div className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Ask about a drug, interaction, or clinical reference..."
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-slate-600"
              disabled={chatLoading}
            />
            <button
              onClick={() => sendChat()}
              disabled={!input.trim() || chatLoading}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}