import React, { useEffect, useState } from "react";
import { Globe, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const VoiceCallWaiting = () => {
  const [dots, setDots] = useState(Array(8).fill(false));
  const [currentMessage, setCurrentMessage] = useState(
    "Waiting for a partner to join..."
  );
  const [fade, setFade] = useState(true);

  // Retrieve the room information from the router state
  const [location] = useLocation();
  const room = location.state?.room; // Access the passed room info

   const messages = [
    "Waiting for a partner to join...",
    '"I disapprove of what you say, but I will defend to the death your right to say it."',
    '"If everyone is thinking alike, then somebody isn\'t thinking."',
    '"Honest disagreement is often a good sign of progress."',
    '"People generally quarrel because they cannot argue."',
    '"If we agree about everything, one of us is unnecessary."',
    '"The aim of argument should not be victory, but progress."',
    '"Don\'t make people agree with you. Make them think."',
    '"The highest result of education is tolerance."',
    '"Truth springs from argument amongst friends."',
    '"Whenever you find yourself on the side of the majority, it is time to pause and reflect."',
    '"We may have all come on different ships, but we\'re in the same boat now."',
    '"Don\'t raise your voice, improve your argument."',
    '"Difference of opinion is helpful in religion."',
    '"Strong minds discuss ideas, weak minds discuss people."',
    '"I respect those who resist me; I curse those who submit to me."',
    '"The enemy is not the person who is wrong, but wrongness itself."',
    '"If liberty means anything at all, it means the right to tell people what they do not want to hear."',
    '"Those who cannot change their minds cannot change anything."',
    '"To avoid criticism, say nothing, do nothing, be nothing."',
    '"I never learned anything from a man who agreed with me."',
    '"The measure of intelligence is the ability to change."',
    '"You can disagree without being disagreeable."',
    '"A wise man changes his mind, a fool never will."',
    '"The best way to solve problems and to fight against war is through dialogue."',
    '"Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth."',
    '"The eye sees only what the mind is prepared to comprehend."',
    '"We don\'t see things as they are, we see them as we are."',
    '"It is never too late to give up your prejudices."',
    '"The more I see, the less I know for sure."',
  ];

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        const newDots = [...prev];
        const firstActive = newDots.findIndex((dot) => dot);
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

  // Timer to cycle messages
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // Start fade out
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * messages.length);
        setCurrentMessage(messages[randomIndex]);
        setFade(true); // Start fade in
      }, 4000); // Fade out duration
    }, 12000); // 12-second interval

    return () => clearInterval(interval);
  }, []);

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
          <h2 className="text-xl font-semibold text-gray-100">
            {room ? room.name : "Topic not available"}
          </h2>
          <div className="flex justify-between mt-2">
            {room && room.stance ? (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  room.stance.percentage <= 25
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : room.stance.party === "Left"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                {room.stance.percentage}% {room.stance.party}
              </span>
            ) : (
              <span className="text-gray-400">Stance not available</span>
            )}
          </div>
        </div>

        {/* Custom Loading Animation */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
          <div className="h-60 bg-gray-900/50 rounded-lg flex flex-col items-center justify-center gap-8 relative">
            {/* Shift Down */}
            <div className="absolute inset-0 flex flex-col items-center gap-8 pt-16">
              {/* Animated Dots */}
              <div className="flex gap-4">
                {dots.map((active, index) => (
                  <div
                    key={index}
                    className={`w-4 h-12 rounded-full transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-b from-blue-400 to-purple-400 scale-y-100"
                        : "bg-gray-700 scale-y-50"
                    }`}
                  />
                ))}
              </div>
              {/* Message */}
              <div
                className={`text-lg text-gray-300 transition-opacity duration-6000 w-3/4 text-center ${
                  fade ? "opacity-100" : "opacity-0"
                }`}
                style={{ minHeight: "4rem" }} // Maintain space for multi-line quotes
              >
                {currentMessage}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallWaiting;