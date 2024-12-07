import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Create context
const SocketContext = createContext(null);

// Hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

// Socket provider
export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(); // Initialize Socket.IO connection

    return () => {
      socketRef.current.disconnect(); // Disconnect socket on unmount
      socketRef.current = null; // Cleanup
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};