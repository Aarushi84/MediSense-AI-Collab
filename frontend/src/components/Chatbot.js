import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are MediSense AI, a friendly and professional health assistant. You help users understand health conditions, interpret symptoms, give general wellness recommendations, and explain medical concepts in simple language. 

Guidelines:
- Always be empathetic and supportive
- Give evidence-based information  
- For serious symptoms, always recommend consulting a doctor
- Keep responses concise but informative (2-4 sentences usually)
- You can discuss: symptoms, conditions, nutrition, lifestyle, medications (general info), mental health, preventive care
- Never diagnose specific conditions — suggest consulting a healthcare professional for diagnosis
- Format with brief paragraphs, no excessive markdown`;

const suggestions = [
  "What does high blood pressure mean?",
  "How can I improve my BMI?",
  "What are symptoms of diabetes?",
  "Tips for better sleep quality",
  "What foods reduce inflammation?",
];

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm MediSense AI 👋 I'm here to help answer your health questions. You can ask me about symptoms, conditions, lifestyle improvements, or general wellness advice. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "I apologize, I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow shadow-blue-500/30">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">MediSense AI Assistant</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs">Online · Powered by Claude AI</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0 shadow shadow-blue-500/20">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-sm"
                : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only on first message) */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-xs hover:border-blue-500/40 hover:text-blue-400 transition">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-slate-600 text-xs text-center mb-3">
        ⚕️ For informational purposes only. Always consult a licensed healthcare professional for medical advice.
      </p>

      {/* Input */}
      <div className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 focus-within:border-blue-500/40 transition">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about symptoms, conditions, or health tips..."
          className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-slate-600"
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white hover:from-blue-500 hover:to-cyan-400 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
    </div>
  );
}