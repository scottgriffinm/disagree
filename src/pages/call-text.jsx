import React, { useState, useEffect } from "react";
import { Globe, ArrowLeft, UserX, Send } from "lucide-react";
import { useSocket } from "../app.jsx";
import { useLocation } from "wouter";

const TextCallRoom = () => {
  const socket = useSocket();
  const [location, setLocation] = useLocation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const topic = searchParams.get("topic") || "Waiting for a topic...";
  const party = searchParams.get("party");
  const percentage = searchParams.get("percentage");
  const isOwner = searchParams.get("owner") === "true";

  useEffect(() => {
    if (!socket) return;

    socket.on("message", (message) => {
      setMessages((prev) => [...prev, { ...message, self: false }]);
    });

    socket.on("redirect-home", () => {
      setLocation("/");
    });

    socket.on("redirect-waiting", ({ room }) => {
      setLocation(
        `/waiting?topic=${encodeURIComponent(
          room.name
        )}&party=${encodeURIComponent(room.stance.party)}&percentage=${
          room.stance.percentage
        }`
      );
    });

    return () => {
      socket.off("message");
      socket.off("redirect-home");
      socket.off("redirect-waiting");
    };
  }, [socket, setLocation]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = { text: newMessage, timestamp: Date.now(), self: true };
      socket.emit("message", { text: newMessage, timestamp: Date.now() });
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStanceBubbleColor = () => {
    const percent = parseInt(percentage, 10);
    if (isNaN(percent)) return "bg-gray-800 text-gray-300 border-gray-700";
    if (Math.abs(percent) <= 25)
      return "bg-purple-500/10 text-purple-300 border-purple-500/30";
    return party === "Left"
      ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
      : "bg-red-500/10 text-red-300 border-red-500/30";
  };

  const handleNewPartner = () => {
    if (!socket) return;
    socket.emit("new-partner", (response) => {
      if (!response.success) {
        console.error("Failed to find a new partner.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-5xl mx-auto p-4 md:p-6 flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <a href="/" className="flex items-center space-x-2 group">
             
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                disagree
              </h1>
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden md:inline">Back to Rooms</span>
            </a>
            {isOwner && (
              <button
                onClick={handleNewPartner}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50 transition-all duration-200 hover:border-gray-600"
              >
                <UserX size={20} />
                <span className="hidden md:inline">New Partner</span>
              </button>
            )}
          </div>
        </div>

        {/* Topic Card */}
        <div className="bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700/50 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">{topic}</h2>
          {party && percentage && (
            <div className="flex items-center">
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getStanceBubbleColor()}`}
              >
                {percentage}% {party}
              </span>
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="flex-1 bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700/50 p-4 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 px-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.self ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%] bg-gray-700/50 text-gray-200 rounded-2xl px-4 py-2 shadow-lg">
                  <p className="text-sm md:text-base">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center space-x-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-xl py-2.5 px-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder-gray-500 resize-none h-12 leading-5"
              placeholder="Type your message..."
              rows={1}
            />
            <button
              onClick={sendMessage}
              className="p-3 rounded-xl bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 transition-colors duration-200 flex items-center justify-center border border-gray-700 hover:border-gray-600"
              disabled={!newMessage.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextCallRoom;