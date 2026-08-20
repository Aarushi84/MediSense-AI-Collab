import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { API_URL } from "../config";

export default function PatientResults() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
 

  useEffect(() => {
    fetch(`${API_URL}/reports`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        const safeData = Array.isArray(data) ? data : [];

        const normalized = safeData.map(r => ({
          ...r,
          summary: r.summary || "",
          severity: r.severity || "Moderate",
          disease: r.disease,
          treatments: Array.isArray(r.treatments) ? r.treatments : [],
          warnings: Array.isArray(r.warnings) ? r.warnings : [],
          abnormalities: Array.isArray(r.abnormalities) ? r.abnormalities : [],
        }));

        setReports(normalized);

        const selectedId = String(
          localStorage.getItem("selectedReportId") || ""
        );

        const clickedReport = normalized.find(
          r => String(r._id) === selectedId
        );

        setSelected(clickedReport || normalized[0] || null);
      })
      .catch(err => console.log("Error loading reports:", err));
  }, []);

  const handleSelect = (report) => {
    if (!report) return;

    setSelected({
      ...report,
      summary: report.summary || "",
      severity: report.severity || "Moderate",
      treatments: Array.isArray(report.treatments) ? report.treatments : [],
      warnings: Array.isArray(report.warnings) ? report.warnings : [],
      abnormalities: Array.isArray(report.abnormalities) ? report.abnormalities : [],
    });
  };

 

  const downloadPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");

    let y = 10;

    const add = (text, bold = false) => {
      if (!text) text = "-";

      const lines = pdf.splitTextToSize(String(text), 180);

      pdf.setFont("helvetica", bold ? "bold" : "normal");

      lines.forEach((line) => {
        if (y > 280) {
          pdf.addPage();
          y = 10;
        }

        pdf.text(line, 10, y);
        y += 6;
      });
    };

    pdf.setFontSize(18);
    add("AI MEDICAL HEALTH REPORT", true);

    y += 5;

    pdf.setFontSize(11);

    add("PATIENT INFORMATION", true);
    add(`Patient Name: ${selected?.patientName || "-"}`);
    add(`Age: ${selected?.age || "-"}`);
    add(`Height: ${selected?.height || "-"} cm`);
    add(`Weight: ${selected?.weight || "-"} kg`);
    add(`Blood Pressure: ${selected?.bloodPressure || "-"}`);
    add(`Blood Sugar: ${selected?.bloodSugar || "-"}`);

    y += 3;

    add("SYMPTOM DETAILS", true);
    add(`Affected Area: ${selected?.area || "-"}`);
    add(`Duration: ${selected?.duration || "-"}`);
    add(`Description: ${selected?.description || "-"}`);

    y += 3;

    add("AI ANALYSIS", true);
    add(`Disease: ${selected?.disease || "Unknown"}`);
    add(`Severity: ${selected?.severity || "Moderate"}`);
    add(`Confidence: ${selected?.confidence || 0}%`);

    y += 3;

    add("SUMMARY", true);
    add(selected?.summary || "-");

    y += 3;

    add("ABNORMALITIES", true);

    if (selected?.abnormalities?.length) {
      selected.abnormalities.forEach((a) => {
        add(`• ${a}`);
      });
    } else {
      add("None Reported");
    }

    y += 3;

    add("TREATMENTS", true);

    if (selected?.treatments?.length) {
      selected.treatments.forEach((t) => {
        add(`• ${t}`);
      });
    } else {
      add("None Reported");
    }

    y += 3;

    add("WARNINGS", true);

    if (selected?.warnings?.length) {
      selected.warnings.forEach((w) => {
        add(`• ${w}`);
      });
    } else {
      add("None Reported");
    }

    y += 3;

    add("DOCTOR RECOMMENDATION", true);
    add(selected?.seeDoctorReason || "Consult a healthcare professional if symptoms persist.");

    if (selected?.image) {
      const img = new Image();

      img.onload = () => {
        try {
          if (y + 90 > 280) {
            pdf.addPage();
            y = 10;
          }

          pdf.setFont("helvetica", "bold");
          pdf.text("UPLOADED IMAGE", 10, y);

          y += 8;

          pdf.addImage(img, "PNG", 10, y, 80, 80);

          pdf.save(`${selected?.disease || "Medical"}-Report.pdf`);
        } catch (err) {
          console.log("PDF IMAGE ERROR:", err);
          pdf.save(`${selected?.disease || "Medical"}-Report.pdf`);
        }
      };

      img.onerror = (e) => {
        console.log("IMAGE LOAD FAILED:", e);
        console.log("URL:", `${API_URL}/uploads/${selected.image}`);

        pdf.save(`${selected?.disease || "Medical"}-Report.pdf`);
      };

      img.src = `${API_URL}/uploads/${selected.image}`;

      return;
    }

    pdf.save(`${selected?.disease || "Medical"}-Report.pdf`);
  };

  if (!selected) {
    return <div className="text-white text-center mt-10">Loading reports...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">My Health Reports</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          View all your previous visit reports and AI analysis
        </p>

        <button
          onClick={downloadPDF}
          className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm"
        >
          Download Report PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-2">
          {reports.map((r, i) => (
            <button
              key={r?._id || r?.createdAt || i}
              onClick={() => handleSelect(r)}
              className="w-full text-left p-4 rounded-2xl border border-white/10 hover:border-blue-400 transition"
            >
              <div className="text-white font-medium">
                {r.disease || r.originalname || "Medical Report"}
              </div>

              <div className="text-xs text-slate-400 mt-1">
                {r?.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </div>

              <div className="text-xs mt-1 text-slate-300">
                {r?.severity || "Moderate"} severity
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <h2 className="text-white font-bold text-2xl">
              AI Medical Report
            </h2>

            <div>
              <h3 className="text-blue-400 font-semibold mb-2">
                Patient Information
              </h3>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>Name: {selected.patientName || "-"}</div>
                <div>Age: {selected.age || "-"}</div>
                <div>Height: {selected.height || "-"} cm</div>
                <div>Weight: {selected.weight || "-"} kg</div>
                <div>Blood Pressure: {selected.bloodPressure || "-"}</div>
                <div>Blood Sugar: {selected.bloodSugar || "-"}</div>
              </div>
            </div>

            <div>
              <h3 className="text-blue-400 font-semibold mb-2">
                Symptom Details
              </h3>

              <div className="space-y-2 text-slate-300 text-sm">
                <div>
                  <strong>Area:</strong> {selected.area || "-"}
                </div>
                <div>
                  <strong>Duration:</strong> {selected.duration || "-"}
                </div>
                <div>
                  <strong>Description:</strong>
                  <br />
                  {selected.description || "-"}
                </div>
              </div>
            </div>

            {selected.image && (
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">
                  Uploaded Image
                </h3>

                <img
                  src={`${API_URL}/uploads/${selected.image}`}
                  alt="Report"
                  className="w-60 rounded-xl border border-white/10"
                />
              </div>
            )}

            <div>
              <h3 className="text-green-400 font-semibold mb-3">
                AI Analysis
              </h3>

              <div className="space-y-3 text-slate-300">
                <div>
                  <strong>Disease:</strong> {selected.disease || "Unknown"}
                </div>
                <div>
                  <strong>Severity:</strong> {selected.severity || "Moderate"}
                </div>
                <div>
                  <strong>Confidence:</strong> {selected.confidence || 0}%
                </div>
                <div>
                  <strong>Summary:</strong>
                  <br />
                  {selected.summary || "-"}
                </div>
              </div>
            </div>

            {selected.abnormalities?.length > 0 && (
              <div>
                <h3 className="text-red-400 font-semibold mb-2">
                  Abnormalities
                </h3>

                <ul className="space-y-2">
                  {selected.abnormalities.map((a, i) => (
                    <li key={i} className="bg-red-500/10 p-2 rounded-lg">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.treatments?.length > 0 && (
              <div>
                <h3 className="text-green-400 font-semibold mb-2">
                  Treatments
                </h3>

                <ul className="space-y-2">
                  {selected.treatments.map((t, i) => (
                    <li key={i} className="bg-green-500/10 p-2 rounded-lg">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.warnings?.length > 0 && (
              <div>
                <h3 className="text-yellow-400 font-semibold mb-2">
                  Warnings
                </h3>

                <ul className="space-y-2">
                  {selected.warnings.map((w, i) => (
                    <li key={i} className="bg-yellow-500/10 p-2 rounded-lg">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-purple-400 font-semibold mb-2">
                Doctor Recommendation
              </h3>

              <p className="text-slate-300">
                {selected.seeDoctorReason ||
                  "Consult a healthcare professional if symptoms persist."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}