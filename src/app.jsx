import React from "react";
import { Route } from "wouter";

// Import your DisagreePlatform component
import DisagreePlatform from "./pages/home.jsx";

export default function PageRouter() {
  return (
    <>
      {/* Render DisagreePlatform for the root path */}
      <Route path="/" component={DisagreePlatform} />
      {/* Other routes can go here */}
    </>
  );
}