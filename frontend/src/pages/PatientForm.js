import { useState } from "react";
import { API_URL } from "../config";

const symptoms = [
  "Chest Pain", "Shortness of Breath", "Fatigue", "Dizziness",
  "Headache", "Nausea", "Joint Pain", "Back Pain", "Fever", "Cough",
  "Insomnia", "Loss of Appetite",
];

export default function PatientForm({ onSubmit }) {
    const [step, setStep] = useState(1);
  const [form, setForm] = useState({
  patientId: "",
  patientName: "",
  age: "",
  gender: "",
  image: "",
  area: "",
  description: "",
  duration: "",
  height: "",
  weight: "",
  bloodPressure: "",
  bloodSugar: "",
  symptoms: [],
  notes: ""
});
  const [saved, setSaved] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleSymptom = (s) => {
    setForm({ ...form, symptoms: form.symptoms.includes(s) ? form.symptoms.filter(x => x !== s) : [...form.symptoms, s] });
  };

  const bmi = form.height && form.weight ? (form.weight / ((form.height / 100) ** 2)).toFixed(1) : null;
  const bmiCategory = bmi ? bmi < 18.5 ? { label: "Underweight", color: "text-blue-400" } : bmi < 25 ? { label: "Normal", color: "text-emerald-400" } : bmi < 30 ? { label: "Overweight", color: "text-amber-400" } : { label: "Obese", color: "text-red-400" } : null;

const handleSubmit = async () => {
  setSaved(true);

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const reportData = {
      ...form,
      patientId: user._id || "",
    };

    const res = await fetch(`${API_URL}/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(reportData),
    });

    const data = await res.json();

    console.log(data);

    setTimeout(() => {
      setSaved(false);

      if (onSubmit) {
        onSubmit(data);
      }
    }, 1500);

  } catch (err) {
    console.log(err);
    setSaved(false);
  }
};
 return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Patient Intake Form</h1>
        <p className="text-slate-400 text-sm mt-0.5">Record patient details for AI-powered health analysis</p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s)}
              className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${step === s ? "bg-blue-500 text-white scale-110" : step > s ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400"}`}
            >
              {step > s ? "✓" : s}
            </button>
            <span className={`text-xs hidden sm:block ${step === s ? "text-white" : "text-slate-500"}`}>
              {s === 1 ? "Personal Info" : s === 2 ? "Vitals" : "Symptoms"}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 w-12 rounded ${step > s ? "bg-emerald-500" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-white font-semibold">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ label: "Full Name", name: "patientName", type: "text", placeholder: "Patient full name" },
                { label: "Age", name: "age", type: "number", placeholder: "Years" },
              { label: "Area", name: "area", type: "text", placeholder: "e.g. Skin / Rash" },
              { label: "Description", name: "description", type: "text", placeholder: "e.g. red itchy rash" },
              { label: "Duration", name: "duration", type: "text", placeholder: "e.g. 2 days" }].map(f => (
                <div key={f.name}>
                  <label className="text-slate-400 text-sm mb-1.5 block">{f.label}</label>
                  <input name={f.name} type={f.type} value={form[f.name]} onChange={handle} placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-600" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Gender</label>
              <div className="flex gap-3">
                {["Male", "Female", "Other"].map(g => (
                  <button key={g} onClick={() => setForm({ ...form, gender: g })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.gender === g ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20">
              Continue to Vitals →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-white font-semibold">Vitals & Measurements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Height (cm)", name: "height", placeholder: "e.g. 170" },
                { label: "Weight (kg)", name: "weight", placeholder: "e.g. 70" },
                { label: "Blood Pressure (mmHg)", name: "bloodPressure", placeholder: "e.g. 120/80" },
                { label: "Blood Sugar (mg/dL)", name: "bloodSugar", placeholder: "e.g. 95" },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-slate-400 text-sm mb-1.5 block">{f.label}</label>
                  <input name={f.name} type="text" value={form[f.name]} onChange={handle} placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-600" />
                </div>
              ))}
            </div>
            {bmi && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-xs mb-0.5">Calculated BMI</div>
                  <div className={`text-2xl font-bold ${bmiCategory.color}`}>{bmi}</div>
                </div>
                <div className={`text-sm font-medium px-3 py-1.5 rounded-xl ${bmiCategory.color} bg-current/10`} style={{ backgroundColor: 'rgba(var(--tw-rgb), 0.1)' }}>
                  <span className={bmiCategory.color}>{bmiCategory.label}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-medium hover:bg-white/10 transition">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20">Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-white font-semibold">Symptoms & Notes</h2>
            <div>
              <label className="text-slate-400 text-sm mb-3 block">Select all applicable symptoms</label>
              <div className="flex flex-wrap gap-2">
                {symptoms.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.symptoms.includes(s) ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Additional Notes</label>
              <textarea name="notes" value={form.notes} onChange={handle} rows={4} placeholder="Describe any other relevant medical history, allergies, or concerns..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-600 resize-none" />
            </div>
            {saved && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Patient data saved successfully!
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-medium hover:bg-white/10 transition">← Back</button>
              <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold text-sm hover:from-emerald-500 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20">
                Submit Patient Record ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}