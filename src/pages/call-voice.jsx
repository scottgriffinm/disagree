import React, { useState, useEffect, useRef } from "react";
import { Globe, ArrowLeft, UserX } from "lucide-react";
import { useSocket } from "../app.jsx";
import { useLocation } from "wouter";

const VoiceCallRoom = () => {
  // Extract query params from URL
  const socket = useSocket();
  const [location, setLocation] = useLocation();
  const [peers, setPeers] = useState({});
  const localStreamRef = useRef(null);

  const searchParams = new URLSearchParams(window.location.search);
  const topic = searchParams.get("topic") || "Waiting for a topic...";
  const party = searchParams.get("party");
  const percentage = searchParams.get("percentage");
  const isOwner = searchParams.get("owner") === "true";

  // Determine grid width based on initial screen size
  const [gridWidth, setGridWidth] = useState(() =>
    window.innerWidth < 500 ? 8 : 12
  );
  const gridHeight = 4;

  function getRandomColor() {
    const colors = ["blue", "red", "purple"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const getStanceBubbleColor = () => {
    const percent = parseInt(percentage, 10); // Convert percentage to number
    if (isNaN(percent)) return "bg-gray-700 text-gray-300"; // Default color if invalid
    if (Math.abs(percent) <= 24)
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    return party === "Left"
      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
      : "bg-red-500/20 text-red-300 border-red-500/30";
  };

  const createPeerConnection = (userId) => {
    const peerConnection = new RTCPeerConnection();
    localStreamRef.current
      .getTracks()
      .forEach((track) =>
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
      document.body.appendChild(audio); // Add remote audio to the UI
    };

    return peerConnection;
  };

  const [gridData, setGridData] = useState(
    Array(gridWidth * gridHeight)
      .fill()
      .map(() => ({
        active: Math.random() < 0.5,
        color: getRandomColor(),
      }))
  );

  useEffect(() => {
    // Request microphone access and handle stream
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        localStreamRef.current = stream;
        const audio = document.createElement("audio");
        audio.srcObject = stream;
        audio.autoplay = true;
        document.body.appendChild(audio); // Add local audio to the UI
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Microphone access is required to join the call.");
      }
    };

    getMedia();

    // Handle incoming WebRTC signals
    socket.on("signal", async ({ sender, description }) => {
      let peerConnection = peers[sender];
      if (!peerConnection) {
        peerConnection = createPeerConnection(sender);
        setPeers((prev) => ({ ...prev, [sender]: peerConnection }));
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

    // Clean up on component unmount
    return () => {
      socket.off("signal");

      // Stop and close all peer connections
      Object.values(peers).forEach((peer) => {
        peer.getSenders().forEach((sender) => sender.track.stop()); // Stop all tracks
        peer.close();
      });
      setPeers({});

      // Stop local media stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [socket, peers]);

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

  // Reset grid data whenever gridWidth changes
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

  // Listen for redirect events
  useEffect(() => {
    if (!socket) return;

    const handleRedirectHome = () => {
      // Send non-owner back to home page
      setLocation("/");
    };

    const handleRedirectWaiting = ({ room }) => {
      // Send owner back to waiting with room info
      setLocation(
        `/waiting?topic=${encodeURIComponent(
          room.name
        )}&party=${encodeURIComponent(room.stance.party)}&percentage=${
          room.stance.percentage
        }`
      );
    };

    socket.on("redirect-home", handleRedirectHome);
    socket.on("redirect-waiting", handleRedirectWaiting);

    return () => {
      socket.off("redirect-home", handleRedirectHome);
      socket.off("redirect-waiting", handleRedirectWaiting);
    };
  }, [socket, setLocation]);

  const handleNewPartner = () => {
    if (!socket) return;

    socket.emit("new-partner", (response) => {
      if (response.success) {
        // Owner gets redirected to the waiting page with room info
        setLocation(
          `/waiting?topic=${encodeURIComponent(
            topic
          )}&party=${encodeURIComponent(party)}&percentage=${percentage}`
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

        {/* Topic Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-100">{topic}</h2>
          {party && percentage && (
            <div className="flex justify-between mt-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStanceBubbleColor()}`}
              >
                {percentage}% {party}
              </span>
            </div>
          )}
        </div>

        {/* Digital Random Grid Visualizer */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
          <div className="h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
            <div
              className={`grid ${
                gridWidth === 8 ? "grid-cols-8" : "grid-cols-12"
              } gap-2`}
            >
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
