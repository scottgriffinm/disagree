import React, { useState, useEffect } from "react";
import { Globe, ArrowLeft, MessageSquare, Mic } from "lucide-react";
import { useSocket } from "../app.jsx";
import { Link, useLocation } from "wouter";

const CreateRoom = () => {
  const socket = useSocket();
  const [formData, setFormData] = useState({
    topic: "",
    stanceValue: 1,
    roomType: "text"
  });
  const [showError, setShowError] = useState(false);
  const [placeholderTopic, setPlaceholderTopic] = useState("");
  
  const topics = [
    "Enter your topic here...",
  ];

  useEffect(() => {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    setPlaceholderTopic(randomTopic);
  }, []);

  const [location, setLocation] = useLocation();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.topic && formData.stanceValue !== 0) {
      const stance = {
        party: formData.stanceValue < 0 ? "Left" : "Right",
        percentage: Math.abs(formData.stanceValue),
      };

      const newRoom = {
        name: formData.topic,
        stance,
        type: formData.roomType
      };

      socket.emit("create-room", newRoom, (response) => {
        if (response && response.error) {
          console.error("Error creating room:", response.error);
          return;
        }

        const { room } = response;
        setLocation(
          `/waiting?topic=${encodeURIComponent(room.name)}&party=${encodeURIComponent(room.stance.party)}&percentage=${room.stance.percentage}`
        );
      });
    } else {
      setShowError(true);
    }
  };

  const handleStanceChange = (e) => {
    let value = parseInt(e.target.value);
    if (value === 0) {
      value = e.target.value > formData.stanceValue ? 1 : -1;
    }
    setFormData((prev) => ({
      ...prev,
      stanceValue: value,
    }));
  };

  const handleTopicChange = (e) => {
    setFormData((prev) => ({ ...prev, topic: e.target.value }));
    if (showError) setShowError(false);
  };

  const handleRoomTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      roomType: type
    }));
  };

  const getStanceText = () => {
    if (formData.stanceValue === 0) return "Select a stance";
    if (formData.stanceValue < 0) {
      return `${Math.abs(formData.stanceValue)}% Left`;
    } else {
      return `${formData.stanceValue}% Right`;
    }
  };

  const getStanceColor = () => {
    if (formData.stanceValue === 0) return "text-gray-400";
    if (Math.abs(formData.stanceValue) <= 25) return "text-purple-400";
    return formData.stanceValue < 0 ? "text-blue-400" : "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-2xl mx-auto p-6">
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

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">
            Create a New Topic Room
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-gray-300 mb-2">Topic</label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleTopicChange}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder={`${placeholderTopic}`}
              />
              {showError && formData.topic.length === 0 && (
                <p className="text-red-400 text-sm mt-1">
                  * Please enter a topic
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-gray-300 mb-2">Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoomTypeChange("text")}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-lg border transition-all ${
                    formData.roomType === "text"
                      ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                      : "border-gray-700 bg-gray-900/50 text-gray-400 hover:bg-gray-800/50"
                  }`}
                >
                  <MessageSquare size={20} />
                  <span>Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoomTypeChange("voice")}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-lg border transition-all ${
                    formData.roomType === "voice"
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : "border-gray-700 bg-gray-900/50 text-gray-400 hover:bg-gray-800/50"
                  }`}
                >
                  <Mic size={20} />
                  <span>Voice</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-gray-300">Your Stance</label>
                <span className={`font-medium ${getStanceColor()}`}>
                  {getStanceText()}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  value={formData.stanceValue}
                  onChange={handleStanceChange}
                  className="w-full mt-6"
                  min="-100"
                  max="100"
                  step="1"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center px-6 py-3 rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50 transition-colors"
            >
              <span>Create Room</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;