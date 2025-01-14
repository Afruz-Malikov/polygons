import { Fragment } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./pages/home/home.jsx";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CreatePolygon } from "./pages/createPolygon";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <Fragment>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/polygon/:id/:type" element={<CreatePolygon />} />
        </Routes>
      </QueryClientProvider>
    </BrowserRouter>
  </Fragment>
);
