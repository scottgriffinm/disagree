import React from "react";
import { Router } from "wouter";
import PageRouter from "./components/router.jsx";

export default function App() {
  return (
    <Router>
      <PageRouter />
    </Router>
  );
}