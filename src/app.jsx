// app.jsx

import React, { useEffect, useRef, createContext, useContext } from 'react';
import { io } from 'socket.io-client';
import { Route } from 'wouter';
import DisagreePlatform from "./pages/home.jsx";
import CreateRoom from "./pages/create.jsx";
import VoiceCallWaiting from "./pages/waiting.jsx";
import VoiceCallRoom from "./pages/call.jsx";

// Create a context to store the socket
const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export default function App() {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect socket only once
    socketRef.current = io(); // adjust URL if needed
    return () => {
      // Optionally handle cleanup if needed
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      <Route path="/" component={DisagreePlatform} />
      <Route path="/create" component={CreateRoom} />
      <Route path="/waiting" component={VoiceCallWaiting} />
      <Route path="/call" component={VoiceCallRoom} />
    </SocketContext.Provider>
  );
}