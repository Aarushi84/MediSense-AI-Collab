import { useState, useRef, useEffect } from "react";
import { API_URL } from "../config";

const authHeader = () => ({ "Authorization": `Bearer ${localStorage.getItem("token")}` });

const QUICK_Q = [
  "Is my blood pressure improving?",
  "What foods should I avoid with hypertension?",
  "Why do I feel tired often?",
  "How do I lower my BMI faster?",
  "Is my blood sugar level normal?",
];

export default function PatientChatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi 👋 I'm your MediSense AI assistant. Ask me anything about your health." },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ message: msg }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Server did not return JSON (check backend)");
      }

      if (!res.ok) throw new Error(data?.error || "Chat failed");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "No response" }]);
    } catch (err) {
      console.log(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Server error. Try again later." }]);
    }

    setLoading(false);
  };

  const handlePDFUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/reports/upload-pdf`, {
        method: "POST",
        headers: authHeader(),
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid PDF response from server");
      }

      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            ` PDF processed successfully\n\n` +
            ` File: ${file.name}\n\n` +
            ` Summary:\n${data.summary || "No summary available"}\n\n` +
            ` Severity: ${data.severity || "Moderate"}`,
        },
      ]);
    } catch (err) {
      console.log(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ PDF upload failed" }]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow shadow-blue-500/30">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-bold">Your AI Health Assistant</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs">Online · Connected to backend AI</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
              m.role === "user" ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10 text-slate-200"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-400 text-sm">AI is thinking...</div>}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_Q.map((q, i) => (
            <button key={i} onClick={() => send(q)} className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-2xl p-3">
        <button onClick={() => fileInputRef.current.click()} className="text-white text-lg px-2 hover:text-blue-400">
          📎
        </button>
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => handlePDFUpload(e.target.files[0])}
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything about your health..."
          className="flex-1 bg-transparent text-white outline-none text-sm"
        />
        <button onClick={() => send()} className="bg-blue-600 text-white px-4 py-2 rounded-xl">
          Send
        </button>
      </div>
    </div>
  );
}