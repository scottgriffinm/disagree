import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft, UserX } from 'lucide-react';

const VoiceCallRoom = () => {
  // 12x4 grid
  const GRID_WIDTH = 12;
  const GRID_HEIGHT = 4;

  const [gridData, setGridData] = useState(
    Array(GRID_WIDTH * GRID_HEIGHT).fill().map(() => ({
      active: Math.random() < 0.5, // 50% chance of starting as active
      color: getRandomColor(), // Random initial color
    }))
  );

  function getRandomColor() {
    const colors = ['blue', 'red', 'purple'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setGridData(prev => {
        return prev.map(square => {
          if (Math.random() < 0.1) {
            return {
              active: !square.active,
              color: Math.random() < 0.05 ? getRandomColor() : square.color
            };
          }
          return square;
        });
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const getSquareColor = (color, active) => {
    if (!active) return 'bg-gray-800/50';
    switch(color) {
      case 'blue': return 'bg-blue-500';
      case 'red': return 'bg-red-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
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
          <div className="flex items-center space-x-4">
            <a 
              href="/"
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Rooms</span>
            </a>
            <button 
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50 transition-colors"
            >
              <UserX size={20} />
              <span>Find New Partner</span>
            </button>
          </div>
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

        {/* Digital Random Grid Visualizer */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
          <div className="h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
            <div className="grid grid-cols-12 gap-2">
              {gridData.map((square, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 border border-gray-800 transition-all duration-1000 ${
                    getSquareColor(square.color, square.active)
                  } opacity-90`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallRoom;