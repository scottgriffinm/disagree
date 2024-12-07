import React, { useState, useEffect } from "react";
import { Globe, ArrowLeft } from "lucide-react";
import { useSocket } from "../app.jsx"; // or the file where the context is defined
import { Link, useLocation } from "wouter"; // Import useLocation for navigation

const CreateRoom = () => {
  const [formData, setFormData] = useState({
    topic: "",
    stanceValue: 1,
  });
  const [showError, setShowError] = useState(false);
  const [placeholderTopic, setPlaceholderTopic] = useState("");
  
  const topics = [
    "Censorship online",
    "AR-15s should be legal",
    "Transgender women in sports",
    "Weed should be legal",
    "War in Ukraine",
    "Age limit in politics",
    "Illegal immigration",
    "Polygamy is harmful to society",
    "War in Palestine",
  ];

  useEffect(() => {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    setPlaceholderTopic(randomTopic);
  }, []);

  const [location, setLocation] = useLocation(); // Hook to change route

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.topic && formData.stanceValue !== 0) {
      const stance = {
        party: formData.stanceValue < 0 ? "Left" : "Right",
        percentage: Math.abs(formData.stanceValue),
      };

      const newRoom = {
        name: formData.topic,
        stance,
      };

      try {
        const response = await fetch("/api/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newRoom),
        });

        if (!response.ok) {
          throw new Error("Failed to create room");
        }

        const result = await response.json();

        // Redirect the user to the waiting page, passing the topic and stance in the query
        setLocation(`/waiting?topic=${encodeURIComponent(result.name)}&party=${encodeURIComponent(result.stance.party)}&percentage=${result.stance.percentage}`);
      } catch (error) {
        console.error("Error creating room:", error);
      }
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
    if (Math.abs(formData.stanceValue) < 25) return "text-purple-400"; 
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
                placeholder={`e.g., ${placeholderTopic}`}
              />
              {showError && formData.topic.length === 0 && (
                <p className="text-red-400 text-sm mt-1">
                  * Please enter a topic
                </p>
              )}
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