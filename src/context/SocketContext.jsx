import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Create the context
const SocketContext = createContext(null);

// Custom hook to use the socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

// SocketProvider to initialize the socket and provide it to the app
export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(); // Initialize the socket connection

    return () => {
      socketRef.current.disconnect(); // Disconnect on unmount
      socketRef.current = null; // Cleanup
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};