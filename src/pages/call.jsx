import React, { useState, useEffect, useRef } from "react";
import { Globe, ArrowLeft, UserX } from "lucide-react";
import { useSocket } from "../app.jsx";
import { useLocation } from "wouter";

const VoiceCallRoom = () => {
  const socket = useSocket();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const topic = searchParams.get("topic") || "Waiting for a topic...";
  const party = searchParams.get("party");
  const percentage = searchParams.get("percentage");
  const isOwner = searchParams.get("owner") === "true";

  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const [gridWidth, setGridWidth] = useState(() => (window.innerWidth < 500 ? 8 : 12));
  const gridHeight = 4;

  // Utility function to get random colors
  const getRandomColor = () => {
    const colors = ["blue", "red", "purple"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Grid animation state
  const [gridData, setGridData] = useState(
    Array(gridWidth * gridHeight)
      .fill()
      .map(() => ({
        active: Math.random() < 0.5,
        color: getRandomColor(),
      }))
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 500 && gridWidth !== 8) {
        setGridWidth(8);
      } else if (window.innerWidth >= 500 && gridWidth !== 12) {
        setGridWidth(12);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gridWidth]);

  // Update grid on width change
  useEffect(() => {
    setGridData(
      Array(gridWidth * gridHeight)
        .fill()
        .map(() => ({
          active: Math.random() < 0.5,
          color: getRandomColor(),
        }))
    );
  }, [gridWidth, gridHeight]);

  // Animate the grid
  useEffect(() => {
    const interval = setInterval(() => {
      setGridData((prev) =>
        prev.map((square) => {
          if (Math.random() < 0.1) {
            return {
              active: !square.active,
              color: Math.random() < 0.05 ? getRandomColor() : square.color,
            };
          }
          return square;
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // WebRTC setup
  const createPeerConnection = (userId) => {
    const peerConnection = new RTCPeerConnection();
    localStreamRef.current.getTracks().forEach((track) =>
      peerConnection.addTrack(track, localStreamRef.current)
    );

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          target: userId,
          description: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      const audio = document.createElement("audio");
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      document.body.appendChild(audio);
    };

    return peerConnection;
  };

  useEffect(() => {
    // Request microphone access
    const setupStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        const audioElement = document.createElement("audio");
        audioElement.srcObject = stream;
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access is required to join the call.");
        setLocation("/");
      }
    };

    setupStream();

    // Handle WebRTC signaling
    socket.on("signal", async ({ sender, description }) => {
      let peerConnection = peersRef.current[sender];
      if (!peerConnection) {
        peerConnection = createPeerConnection(sender);
        peersRef.current[sender] = peerConnection;
      }

      if (description.type === "offer") {
        await peerConnection.setRemoteDescription(description);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("signal", {
          target: sender,
          description: peerConnection.localDescription,
        });
      } else if (description.type === "answer") {
        await peerConnection.setRemoteDescription(description);
      } else if (description.candidate) {
        await peerConnection.addIceCandidate(description);
      }
    });

    // Handle cleanup when users leave
    socket.on("user-left", (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
    });

    return () => {
      // Cleanup on component unmount
      socket.off("signal");
      socket.off("user-left");
      Object.values(peersRef.current).forEach((peer) => peer.close());
      peersRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [socket, setLocation]);

  const handleNewPartner = () => {
    socket.emit("new-partner", (response) => {
      if (response.success) {
        setLocation(
          `/waiting?topic=${encodeURIComponent(topic)}&party=${encodeURIComponent(
            party
          )}&percentage=${percentage}`
        );
      } else {
        console.error("Failed to handle new partner action.");
      }
    });
  };

  const getSquareColor = (color, active) => {
    if (!active) return "bg-gray-800/50";
    switch (color) {
      case "blue":
        return "bg-blue-500";
      case "red":
        return "bg-red-500";
      case "purple":
        return "bg-purple-500";
      default:
        return "bg-blue-500";
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
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Rooms</span>
            </a>
            {isOwner && (
              <button
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50 transition-colors"
                onClick={handleNewPartner}
              >
                <UserX size={20} />
                <span>New Partner</span>
              </button>
            )}
          </div>
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

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
          <div className="h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
            <div className={`grid ${gridWidth === 8 ? "grid-cols-8" : "grid-cols-12"} gap-2`}>
              {gridData.map((square, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 border border-gray-800 transition-all duration-1000 ${getSquareColor(
                    square.color,
                    square.active
                  )} opacity-90`}
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