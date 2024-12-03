import React, { useEffect, useState } from 'react';
import { Globe, ArrowLeft } from 'lucide-react';

const VoiceCallWaiting = () => {
  const [dots, setDots] = useState(Array(8).fill(false));
  const [elapsedTime, setElapsedTime] = useState(0);

  // Dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        const newDots = [...prev];
        const firstActive = newDots.findIndex(dot => dot);
        if (firstActive === -1) {
          newDots[0] = true;
          return newDots;
        }
        if (firstActive === newDots.length - 1) {
          return Array(8).fill(false);
        }
        newDots[firstActive] = false;
        newDots[firstActive + 1] = true;
        return newDots;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format elapsed time
  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
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

        {/* Topic Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-100">Should pineapple be on pizza?</h2>
          <div className="flex justify-between mt-2">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
              75% Democrat
            </span>
          </div>
        </div>

        {/* Custom Loading Animation */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
          <div className="h-48 bg-gray-900/50 rounded-lg flex flex-col items-center justify-center gap-8">
            {/* Animated Dots */}
            <div className="flex gap-4">
              {dots.map((active, index) => (
                <div
                  key={index}
                  className={`w-4 h-12 rounded-full transition-all duration-200 ${
                    active 
                      ? 'bg-gradient-to-b from-blue-400 to-purple-400 scale-y-100' 
                      : 'bg-gray-700 scale-y-50'
                  }`}
                />
              ))}
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg text-gray-300">Waiting for a partner to join...</div>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallWaiting;