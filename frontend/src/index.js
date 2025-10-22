// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";


const root = ReactDOM.createRoot(document.getElementById("root"));

document.documentElement.style.scrollBehavior = "smooth";

// Set default theme
if (!localStorage.getItem("cipherstudio-theme")) {
  localStorage.setItem("cipherstudio-theme", "dark");
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
