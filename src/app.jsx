import React from "react";
import { Route } from "wouter";

// Import your DisagreePlatform component
import DisagreePlatform from "./pages/home.jsx";
import CreateRoom from "./pages/create.jsx";
import VoiceCallWaiting from "./pages/waiting.jsx";
import VoiceCallRoom from "./pages/call.jsx";

export default function PageRouter() {
  return (
    <>
      {/* Render DisagreePlatform for the root path */}
      <Route path="/" component={DisagreePlatform} />
      <Route path="/create" component={CreateRoom} />
      <Route path="/waiting" component={VoiceCallWaiting} />
      <Route path="/call" component={VoiceCallRoom} />
      {/* Other routes can go here */}
    </>
  );
}