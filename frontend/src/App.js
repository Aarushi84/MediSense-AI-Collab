import { useState } from "react";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";

// Doctor pages
import Dashboard from "./pages/Dashboard";
import PatientForm from "./pages/PatientForm";
import Result from "./pages/Result";
import Upload from "./pages/Upload";
import DoctorAIAssistant from "./pages/DoctorAIAssistant";

// Patient pages
import PatientDashboard from "./pages/PatientDashboard";
import PatientUpload from "./pages/PatientUpload";
import PatientResults from "./pages/PatientResults";
import PatientChatbot from "./pages/PatientChatbot";

export default function App() {
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("dashboard");

  const handleLogin = (selectedRole) => {
    setRole(selectedRole);
    setPage("dashboard");
  };

const handleLogout = () => {
  setRole(null);
  setPage("dashboard");
  localStorage.removeItem("name");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};

  if (!role) return <Login onLogin={handleLogin} />;

  const doctorPages = {
    dashboard: <Dashboard setPage={setPage} />,
    patient: <PatientForm setPage={setPage} />,
    results: <Result setPage={setPage} />,
    upload: <Upload setPage={setPage} />,
   chatbot: <DoctorAIAssistant setPage={setPage} />,
  };

  const patientPages = {
    dashboard: <PatientDashboard setPage={setPage} />,
    analyze: <PatientUpload setPage={setPage} />,
    reports: <PatientResults setPage={setPage} />,
    chat: <PatientChatbot setPage={setPage} />,
  };

  const pages = role === "doctor" ? doctorPages : patientPages;

  return (
    <div className="min-h-screen bg-[#060B18] text-white">
      <Navbar role={role} activePage={page} setPage={setPage} onLogout={handleLogout} />

      <main className="relative pt-18 pb-8 px-4 sm:px-6 max-w-7xl mx-auto" style={{ paddingTop: "4.5rem" }}>
        {pages[page] || pages.dashboard}
      </main>
    </div>
  );
}