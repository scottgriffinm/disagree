// app.jsx

import React, { useRef, createContext, useContext } from 'react';
import { io } from 'socket.io-client';
import { Route } from 'wouter';
import DisagreePlatform from "./pages/home.jsx";
import CreateRoom from "./pages/create.jsx";
import VoiceCallWaiting from "./pages/waiting.jsx";
import VoiceCallRoom from "./pages/call.jsx";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export default function App() {
  const socketRef = useRef(io()); // Initialize immediately here

  return (
    <SocketContext.Provider value={socketRef.current}>
      <Route path="/" component={DisagreePlatform} />
      <Route path="/create" component={CreateRoom} />
      <Route path="/waiting" component={VoiceCallWaiting} />
      <Route path="/call" component={VoiceCallRoom} />
    </SocketContext.Provider>
  );
}