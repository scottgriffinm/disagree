import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft } from 'lucide-react';

const CreateRoom = () => {
  const [formData, setFormData] = useState({
    topic: '',
    stanceValue: -50 // -100 to -1 is Democrat, 1 to 100 is Republican
  });
  
  const [showError, setShowError] = useState(false);
  const [placeholderTopic, setPlaceholderTopic] = useState('');

  const topics = [
    "Censorship online",
    "AR-15s should be legal",
    "Transgender women in sports",
    "Weed should be legal",
    "War in Ukraine",
    "Age limit in politics",
    "Illegal immigration",
    "Polygamy is harmful to society",
    "War in Palestine"
  ];

  useEffect(() => {
    // Select a random topic from the list when the component loads
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    setPlaceholderTopic(randomTopic);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.topic && formData.stanceValue !== 0) {
      const stance = {
        party: formData.stanceValue < 0 ? 'Democrat' : 'Republican',
        percentage: Math.abs(formData.stanceValue)
      };
      console.log('Room created:', { topic: formData.topic, stance });
    } else {
      setShowError(true);
    }
  };

  const handleStanceChange = (e) => {
    let value = parseInt(e.target.value);
    // Skip 0 to prevent neutral stance
    if (value === 0) {
      value = e.target.value > formData.stanceValue ? 1 : -1;
    }
    setFormData(prev => ({
      ...prev,
      stanceValue: value
    }));
  };

  const handleTopicChange = (e) => {
    setFormData(prev => ({ ...prev, topic: e.target.value }));
    if (showError) setShowError(false);
  };

  const getStanceText = () => {
    if (formData.stanceValue === 0) return 'Select a stance';
    if (formData.stanceValue < 0) {
      return `${Math.abs(formData.stanceValue)}% Democrat`;
    } else {
      return `${formData.stanceValue}% Republican`;
    }
  };

  const getStanceColor = () => {
    if (formData.stanceValue === 0) return 'text-gray-400';
    return formData.stanceValue < 0 ? 'text-blue-400' : 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-2xl mx-auto p-6">
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

        {/* Form Container */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">Create a New Topic Room</h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-gray-300 mb-2">Topic Title</label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleTopicChange}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder={`e.g., ${placeholderTopic}`} // Use the random placeholder
              />
              {showError && formData.topic.length === 0 && (
                <p className="text-red-400 text-sm mt-1">* Please enter a topic title</p>
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
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
            >
              Create Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;