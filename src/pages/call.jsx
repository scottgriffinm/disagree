import React, { useState, useEffect, useRef } from "react";
import { Globe, ArrowLeft, UserX } from "lucide-react";
import { useSocket } from "../app.jsx";
import { useLocation } from "wouter";

function getRandomColor() {
  const colors = ["blue", "red", "purple"];
  return colors[Math.floor(Math.random() * colors.length)];
}

const VoiceCallRoom = () => {
  const socket = useSocket();
  const [location, setLocation] = useLocation();

  const searchParams = new URLSearchParams(window.location.search);
  const topic = searchParams.get("topic") || "Waiting for a topic...";
  const party = searchParams.get("party");
  const percentage = searchParams.get("percentage");
  const isOwner = searchParams.get("owner") === "true";

  const [gridWidth, setGridWidth] = useState(
    window.innerWidth < 500 ? 8 : 12
  );
  const gridHeight = 4;
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

  // WebRTC-related
  const [localStream, setLocalStream] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const peerConnectionsRef = useRef({});
  const [otherUserId, setOtherUserId] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleRedirectHome = () => {
      cleanupCall();
      setLocation("/");
    };

    const handleRedirectWaiting = ({ room }) => {
      cleanupCall();
      setLocation(
        `/waiting?topic=${encodeURIComponent(room.name)}&party=${encodeURIComponent(
          room.stance.party
        )}&percentage=${room.stance.percentage}`
      );
    };

    socket.on("redirect-home", handleRedirectHome);
    socket.on("redirect-waiting", handleRedirectWaiting);

    return () => {
      socket.off("redirect-home", handleRedirectHome);
      socket.off("redirect-waiting", handleRedirectWaiting);
    };
  }, [socket, setLocation]);

  useEffect(() => {
    if (!socket || !localStream || !callStarted) return;

    const handleStartCall = ({ room, participants }) => {
      if (participants.length === 2) {
        const other = participants.find((p) => p !== socket.id);
        setOtherUserId(other);

        if (isOwner) {
          const pc = createPeerConnection(other);
          peerConnectionsRef.current[other] = pc;
          localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
          (async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('signal', { target: other, description: offer, roomId: room.id });
          })();
        } else {
          const pc = createPeerConnection(other);
          peerConnectionsRef.current[other] = pc;
          localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
        }
      }
    };

    const handleSignal = async (data) => {
      const { sender, description } = data;
      let pc = peerConnectionsRef.current[sender];
      if (!pc) {
        pc = createPeerConnection(sender);
        peerConnectionsRef.current[sender] = pc;
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      }

      if (description.type === 'offer') {
        await pc.setRemoteDescription(description);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', { target: sender, description: answer });
      } else if (description.type === 'answer') {
        await pc.setRemoteDescription(description);
      } else if (description.candidate) {
        try {
          await pc.addIceCandidate(description);
        } catch (err) {
          console.error('Error adding ICE candidate', err);
        }
      }
    };

    socket.on('start-call', handleStartCall);
    socket.on('signal', handleSignal);

    return () => {
      socket.off('start-call', handleStartCall);
      socket.off('signal', handleSignal);
    };
  }, [socket, localStream, isOwner, callStarted]);

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection();
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', {
          target: userId,
          description: event.candidate
        });
      }
    };
    pc.ontrack = (event) => {
      const remoteAudio = document.getElementById("remote-audio");
      if (!remoteAudio) {
        const audioElement = document.createElement('audio');
        audioElement.id = "remote-audio";
        audioElement.srcObject = event.streams[0];
        audioElement.autoplay = true;
        audioElement.playsInline = true; // Important for iOS Safari
        document.getElementById('users').appendChild(audioElement);
      }
    };
    return pc;
  };

  const handleNewPartner = () => {
    if (!socket) return;
    socket.emit("new-partner", (response) => {
      if (!response.success) {
        console.error("Failed to handle new partner action.");
      }
    });
  };

  const cleanupCall = () => {
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current = {};

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);

    const remoteAudio = document.getElementById("remote-audio");
    if (remoteAudio && remoteAudio.srcObject) {
      remoteAudio.srcObject.getTracks().forEach(track => track.stop());
      remoteAudio.remove();
    }
  };

  // Request microphone with a user gesture
  const requestMicrophoneAccess = async () => {
    try {
      // Must be called from a direct user interaction on iOS Safari
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      setCallStarted(true);
    } catch (err) {
      console.error("Failed to access microphone:", err);
      alert("We couldn't access your microphone. Please check Safari Settings > Privacy > Microphone and ensure it's allowed.");
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
              onClick={(e) => { e.preventDefault(); cleanupCall(); setLocation("/"); }}
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
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {percentage}% {party}
              </span>
            </div>
          )}
        </div>

        {/* Users Container and Audio Streams */}
        <div id="users" className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8 mb-8">
          {!localStream && (
            <div className="text-gray-300 mb-4">
              Please tap the button below to allow microphone access and start the call.
            </div>
          )}

          {!callStarted && (
            <button
              className="px-4 py-2 mb-4 rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50 transition-colors"
              onClick={requestMicrophoneAccess}
            >
              Enable Microphone & Start Call
            </button>
          )}

          {localStream && (
            <audio
              id="local-audio"
              srcObject={localStream}
              autoPlay
              playsInline // Helps on iOS
              muted
            ></audio>
          )}
          {callStarted && <p className="text-gray-300">Your Call is Live</p>}
        </div>

        {/* Digital Random Grid Visualizer */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
          <div className="h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
            <div className={`grid ${gridWidth === 8 ? "grid-cols-8" : "grid-cols-12"} gap-2`}>
              {gridData.map((square, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 border border-gray-800 transition-all duration-1000 ${
                    !square.active ? "bg-gray-800/50" :
                    square.color === "blue" ? "bg-blue-500" :
                    square.color === "red" ? "bg-red-500" :
                    "bg-purple-500"
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