import { useState, useRef, useEffect } from "react";
import { API_URL } from "../config";

const authHeader = () => ({ "Authorization": `Bearer ${localStorage.getItem("token")}` });

const DOC_TYPES = [
  { key: "Medical History", label: "Medical History" },
  { key: "Lab Report", label: "Lab Report" },
  { key: "Prescription", label: "Prescription" },
  { key: "Imaging / Scan", label: "Imaging / Scan" },
  { key: "Discharge Summary", label: "Discharge Summary" },
  { key: "Other Document", label: "Other Document" },
];

const STORAGE_QUOTA_GB = 10;

const uploadXHR = (formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/doctor/upload-document`);
    xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("token")}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(JSON.parse(xhr.responseText)?.error || "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
};

export default function DoctorUpload() {
  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState("");
  const [docType, setDocType] = useState("");
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);
  const [storageBytes, setStorageBytes] = useState(0);

  const [patientDocs, setPatientDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState("");

  const inputRef = useRef();

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

  const loadRecentUploads = async () => {
    try {
      const res = await fetch(`${API_URL}/doctor/recent-uploads`, {
        headers: authHeader(),
      });
      const data = await res.json();
      setRecentUploads(data.uploads || []);
    } catch (err) {
      console.log("RECENT UPLOADS ERROR:", err.message);
    }
  };

  const loadStorage = async () => {
    try {
      const res = await fetch(`${API_URL}/doctor/storage`, {
        headers: authHeader(),
      });
      const data = await res.json();
      setStorageBytes(data.totalBytes || 0);
    } catch (err) {
      console.log("STORAGE ERROR:", err.message);
    }
  };

  const loadPatientDocs = async (patientId) => {
    if (!patientId) {
      setPatientDocs([]);
      return;
    }
    setDocsLoading(true);
    setDocsError("");
    try {
      const res = await fetch(`${API_URL}/doctor/patient/${patientId}/documents`, {
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load documents");
      setPatientDocs(data.documents || []);
    } catch (err) {
      setDocsError(err.message);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    loadRecentUploads();
    loadStorage();
  }, []);

  useEffect(() => {
    loadPatientDocs(patient);
  }, [patient]);

  const downloadDoc = async (docId, fileName) => {
    try {
      const res = await fetch(`${API_URL}/doctor/document/${docId}/download`, {
        headers: authHeader(),
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

  const addFiles = (incoming) => {
    const arr = Array.from(incoming).map((f) => ({ file: f, status: "ready", progress: 0 }));
    setFiles((prev) => [...prev, ...arr]);
  };

  const upload = async () => {
    if (!patient || !docType || files.length === 0) return;

    setUploading(true);
    setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" })));

    const selectedPatient = patients.find((p) => p.id === patient);
    const formData = new FormData();
    formData.append("patientId", patient);
    formData.append("patientName", selectedPatient?.name || "");
    formData.append("docType", docType);
    formData.append("notes", notes);
    files.forEach((f) => formData.append("files", f.file));

    try {
      await uploadXHR(formData, (pct) => {
        setFiles((prev) => prev.map((f) => (f.status === "uploading" ? { ...f, progress: pct } : f)));
      });

      setFiles((prev) => prev.map((f) => ({ ...f, status: "done", progress: 100 })));
      setUploading(false);
      setSuccess(true);
      loadRecentUploads();
      loadStorage();
      loadPatientDocs(patient);

      setTimeout(() => {
        setSuccess(false);
        setFiles([]);
        setNotes("");
        setDocType("");
      }, 3000);
    } catch (err) {
      console.log("UPLOAD ERROR:", err.message);
      setUploading(false);
      setFiles((prev) => prev.map((f) => ({ ...f, status: "ready" })));
    }
  };

  const storageGB = (storageBytes / 1024 ** 3).toFixed(2);
  const storagePct = Math.min((storageBytes / (STORAGE_QUOTA_GB * 1024 ** 3)) * 100, 100);
  const selectedPatientName = patients.find((p) => p.id === patient)?.name;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Patient Documents</h1>
        <p className="text-slate-400 text-sm mt-0.5">Upload medical records, lab reports, and prescriptions to patient profiles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</span>
              Select Patient
            </h2>
            {patients.length === 0 ? (
              <p className="text-slate-500 text-xs">No registered patients found</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPatient(p.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border transition-all ${
                      patient === p.id ? "bg-blue-500/15 border-blue-500/40 text-blue-300" : "bg-white/3 border-white/8 text-slate-400 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${patient === p.id ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400"}`}>
                      {p.name?.[0] || "?"}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-medium leading-tight truncate">{p.name}</div>
                      <div className="text-xs opacity-60 truncate">{p.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {patient && (
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
              <h2 className="text-white font-semibold text-sm mb-3">
                Existing Documents — {selectedPatientName}
              </h2>

              {docsLoading && <p className="text-slate-500 text-xs">Loading...</p>}
              {docsError && <p className="text-red-400 text-xs">{docsError}</p>}
              {!docsLoading && !docsError && patientDocs.length === 0 && (
                <p className="text-slate-500 text-xs">No documents uploaded yet for this patient</p>
              )}

              <div className="space-y-2">
                {patientDocs.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-2.5 bg-white/3 rounded-xl border border-white/6">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-xs font-medium truncate">{d.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-blue-400 text-xs">{d.type}</span>
                        <span className="text-slate-600 text-xs">·</span>
                        <span className="text-slate-500 text-xs">
                          {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                        <span className="text-slate-600 text-xs">·</span>
                        <span className="text-slate-500 text-xs">{(d.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadDoc(d.id, d.name)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium flex-shrink-0 px-2.5 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</span>
              Document Type
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DOC_TYPES.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDocType(d.key)}
                  className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                    docType === d.key ? "bg-blue-500/15 border-blue-500/40" : "bg-white/3 border-white/8 hover:border-white/15"
                  }`}
                >
                  <span className={`text-xs font-semibold ${docType === d.key ? "text-blue-300" : "text-white"}`}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">3</span>
              Upload Files
            </h2>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragging ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-blue-500/40 hover:bg-white/3"
              }`}
            >
              <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={(e) => addFiles(e.target.files)} />
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-white text-sm font-medium">Drop files or click to browse</p>
              <p className="text-slate-500 text-xs mt-1">PDF, Word, JPEG · Max 50MB</p>
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-white/3 rounded-xl border border-white/6">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0 text-xs">PDF</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{f.file.name}</div>
                      <div className="text-slate-500 text-xs">{(f.file.size / 1024).toFixed(0)} KB</div>
                      {f.status === "uploading" && (
                        <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                        </div>
                      )}
                    </div>
                    {f.status === "done" && <span className="text-emerald-400 text-xs flex-shrink-0">✓ Done</span>}
                    {f.status === "ready" && (
                      <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 transition text-xs flex-shrink-0">✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">4</span>
              Doctor Notes <span className="text-slate-500 font-normal">(optional)</span>
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add context for this document — findings, follow-up instructions, or notes for the patient..."
              className="w-full bg-white/5 border border-white/8 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition placeholder-slate-600 resize-none"
            />
          </div>

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-400">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <div className="font-semibold text-sm">Documents uploaded successfully!</div>
                <div className="text-xs text-emerald-400/70 mt-0.5">Files saved to patient record.</div>
              </div>
            </div>
          )}

          <button
            onClick={upload}
            disabled={!patient || !docType || files.length === 0 || uploading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading to patient record...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Upload to Patient Record</>
            )}
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Recent Uploads</h3>
          {recentUploads.length === 0 ? (
            <p className="text-slate-500 text-xs">No uploads yet</p>
          ) : (
            recentUploads.map((u, i) => (
              <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-3 hover:border-white/15 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-xs font-medium truncate">{u.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{u.patient}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-blue-400 text-xs">{u.type}</span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-slate-500 text-xs">{new Date(u.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-center">
            <div className="text-blue-400 text-xs font-medium mb-0.5">Storage Used</div>
            <div className="text-white font-bold text-sm">{storageGB} GB</div>
            <div className="w-full h-1.5 bg-white/8 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${storagePct}%` }} />
            </div>
            <div className="text-slate-500 text-xs mt-1">of {STORAGE_QUOTA_GB} GB</div>
          </div>
        </div>
      </div>
    </div>
  );
}