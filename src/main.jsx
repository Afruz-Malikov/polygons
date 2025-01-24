import React from "react";
import { createRoot } from "react-dom/client";
import App from "./pages/home/home.jsx";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CreatePolygon } from "./pages/createPolygon";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/polygon/:id/:type" element={<CreatePolygon />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
