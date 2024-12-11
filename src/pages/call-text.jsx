import React, { useState, useEffect } from "react";
import { Globe, ArrowLeft } from "lucide-react";
import { useSocket } from "../app.jsx";
import { useLocation } from "wouter";

const TextChatRoom = () => {
    const socket = useSocket();
    const [location, setLocation] = useLocation();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const searchParams = new URLSearchParams(window.location.search);
    const topic = searchParams.get("topic") || "Waiting for a topic...";
    const party = searchParams.get("party");
    const percentage = searchParams.get("percentage");

    useEffect(() => {
        if (!socket) return;

        socket.on("message", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            socket.off("message");
        };
    }, [socket]);

    const sendMessage = () => {
        if (newMessage.trim()) {
            const message = { text: newMessage, timestamp: Date.now() };
            socket.emit("message", message);
            setMessages((prev) => [...prev, { ...message, self: true }]);
            setNewMessage("");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center space-x-2">
                        <a href="/" className="flex items-center space-x-2">
                            <Globe className="w-8 h-8 text-blue-400" />
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                disagree
                            </h1>
                        </a>
                    </div>
                    <a
                        href="/"
                        className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Rooms</span>
                    </a>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-100">{topic}</h2>
                    {party && percentage && (
                        <div className="flex justify-between mt-2">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {percentage}% {party}
                            </span>
                        </div>
                    )}
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
                    <div className="h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-4 mb-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`mb-2 ${
                                    msg.self ? "text-right" : "text-left"
                                }`}
                            >
                                <span
                                    className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                                        msg.self
                                            ? "bg-blue-500/20 text-blue-300"
                                            : "bg-gray-700 text-gray-300"
                                    }`}
                                >
                                    {msg.text}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-grow bg-gray-900/50 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            placeholder="Type your message..."
                        />
                        <button
                            onClick={sendMessage}
                            className="ml-4 px-6 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextChatRoom;