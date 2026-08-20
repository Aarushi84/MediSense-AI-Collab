import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
const originalFetch = window.fetch;

window.fetch = function (url, options = {}) {
  if (typeof url === "string" && url.includes("localhost:5000")) {
    const token = localStorage.getItem("token");
    if (token) {
      options.headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return originalFetch(url, options);
};
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);