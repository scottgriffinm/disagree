import React from "react";
import ReactDOM from "react-dom";
import App from "./app.jsx";
import { HelmetProvider } from "react-helmet-async";
import { SocketProvider } from "./context/SocketContext"; // Import SocketProvider
import "./styles/styles.css";

ReactDOM.render(
  <React.StrictMode>
    <HelmetProvider>
      <SocketProvider> {/* Wrap everything */}
        <App />
      </SocketProvider>
    </HelmetProvider>
  </React.StrictMode>,
  document.getElementById("root")
);