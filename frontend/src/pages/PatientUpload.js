import { useState, useRef } from "react";
import { API_URL } from "../config";

const SYMPTOM_AREAS = [
  { label: "Skin / Rash", icon: "🩹" },
  { label: "Wound / Injury", icon: "🤕" },
  { label: "Swelling", icon: "🫁" },
];

export default function PatientUpload() {
  const [patientName, setPatientName] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");

  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const inputRef = useRef();

  const handleImage = (file) => {
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const analyze = async () => {
    if (!image || !area || !description) {
      setError("Please fill required fields");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("patientName", patientName);
      formData.append("area", area);
      formData.append("description", description);
      formData.append("duration", duration);
      formData.append("age", age);
      formData.append("height", height);
      formData.append("weight", weight);
      formData.append("bloodPressure", bloodPressure);
      formData.append("bloodSugar", bloodSugar);

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user?._id) {
        setError("Please login again");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/reports/predict-image`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setResult({
        disease: data?.disease || "Unknown",
        severity: data?.severity || "Moderate",
        confidence: data?.confidence || 0,
        summary: data?.summary || "AI failed",
        treatments: data?.treatments || [],
        warnings: data?.warnings || [],
        abnormalities: data?.abnormalities || [],
        seeDoctorReason: data?.seeDoctorReason || ""
      });
    } catch (err) {
      console.log(err);
      setError("Server error while analyzing");
    }

    setLoading(false);
  };

  const reset = () => {
    setResult(null);
    setImage(null);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060B18] text-white px-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">AI Symptom Assistant</h1>
          <p className="text-slate-400 text-sm">
            Describe your symptoms like a conversation
          </p>
        </div>

        {!result ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-lg">
            <div
              onClick={() => inputRef.current.click()}
              className="border border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-white/5"
            >
              <input
                type="file"
                hidden
                ref={inputRef}
                onChange={(e) => handleImage(e.target.files[0])}
              />

              {imagePreview ? (
               <img src={imagePreview} alt="Uploaded symptom preview" className="w-32 mx-auto rounded-lg" />
              ) : (
                <p className="text-slate-400">Upload Symptom Image</p>
              )}
            </div>

            <div className="flex gap-2">
              {SYMPTOM_AREAS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => setArea(a.label)}
                  className={`flex-1 p-2 rounded-xl text-sm border ${
                    area === a.label
                      ? "bg-blue-600 border-blue-500"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  {a.icon} {a.label}
                </button>
              ))}
            </div>

            <input className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
              placeholder="Patient Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />

            <input className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <input className="p-3 rounded-xl bg-white/5 border border-white/10"
                placeholder="Height (cm)"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />

              <input className="p-3 rounded-xl bg-white/5 border border-white/10"
                placeholder="Weight (kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input className="p-3 rounded-xl bg-white/5 border border-white/10"
                placeholder="BP (120/80)"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
              />

              <input className="p-3 rounded-xl bg-white/5 border border-white/10"
                placeholder="Sugar"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
              />
            </div>

            <input className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
              placeholder="Describe symptoms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
              placeholder="Duration (e.g. 2 days)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={analyze}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-xl font-semibold"
            >
              {loading ? "Analyzing..." : "Analyze Symptom"}
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3">
            {imagePreview && (
             <img
  src={imagePreview}
  alt="Uploaded symptom"
  className="w-28 h-28 object-cover rounded-xl mx-auto border border-white/10"
/>
            )}

            <h2 className="text-xl font-bold">{result.disease}</h2>

            <p className="text-slate-300">Severity: {result.severity}</p>

            <p className="mt-2 text-slate-300">
              Summary: {result.summary}
            </p>

            {result.abnormalities.length > 0 && (
              <div className="mt-2">
                <b>Abnormalities:</b>
                {result.abnormalities.map((a, i) => (
                  <div key={i}>
                    • {typeof a === "string"
                      ? a
                      : `${a?.parameter || "-"}: ${a?.value || "-"} (${a?.issue || "-"})`}
                  </div>
                ))}
              </div>
            )}

            {result.treatments.length > 0 && (
              <div className="mt-2">
                <b>Treatments:</b>
                {result.treatments.map((t, i) => (
                  <div key={i}>
                    • {typeof t === "string"
                      ? t
                      : `${t?.medication || t?.name || "Unknown"} - ${t?.dosage || "-"}`}
                  </div>
                ))}
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="mt-2 text-yellow-400">
                <b>Warnings:</b>
                {result.warnings.map((w, i) => (
                  <div key={i}>
                    ⚠ {typeof w === "string" ? w : w?.warning || "-"}
                  </div>
                ))}
              </div>
            )}

            {result.seeDoctorReason && (
              <p className="mt-2 text-red-400">
                {result.seeDoctorReason}
              </p>
            )}

            <button
              onClick={reset}
              className="bg-red-500 px-4 py-2 rounded-xl"
            >
              Analyze Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}