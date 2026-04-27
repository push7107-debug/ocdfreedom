import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import posthog from 'posthog-js'; // <--- AGGIUNGI QUESTO
import App from "./App";
import "./index.css";

// INIZIALIZZA POSTHOG QUI SOTTO
posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  person_profiles: 'identified_only', 
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);