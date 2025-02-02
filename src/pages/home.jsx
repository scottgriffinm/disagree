import React, { useState, useEffect } from "react";
import { Search, ArrowUpDown, Plus, Globe } from "lucide-react";
import { useSocket } from "../app.jsx";
import { Link, useLocation } from "wouter";

const DisagreePlatform = () => {
  const socket = useSocket();
  const [allRooms, setAllRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({
    usersOnline: 0,
    activeDebates: 0,
    debatesToday: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "participants",
    direction: "asc",
  });
  const [filters, setFilters] = useState({
    right: false,
    left: false,
    open: false,
    centrist: false,
    text: false,
    voice: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 5;
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch("/api/rooms");
        const data = await response.json();
        // Filter out full rooms
        const openRooms = data.filter(
          (room) => room.maxParticipants > room.participants
        );
        setAllRooms(openRooms.sort((a, b) => a.participants - b.participants));
        setRooms(openRooms.sort((a, b) => a.participants - b.participants));
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        var data = await response.json();
        data.usersOnline = data.usersOnline + 1; // + 1 hack to count user
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchRooms();
    fetchStats();

    return () => {};
  }, [socket]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sortedRooms = [...rooms].sort((a, b) => {
      if (key === "created") {
        return direction === "asc"
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      }

      if (key === "stance") {
        const aScore =
          a.stance.party === "Left"
            ? -a.stance.percentage
            : a.stance.percentage;
        const bScore =
          b.stance.party === "Left"
            ? -b.stance.percentage
            : b.stance.percentage;
        return direction === "asc" ? aScore - bScore : bScore - aScore;
      }

      if (key === "type") {
        return direction === "asc"
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      }

      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setRooms(sortedRooms);
    setSortConfig({ key, direction });
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    applyFilters(event.target.value, filters);
  };

  const calculateTotalPages = (filteredRooms) => {
    return Math.ceil(filteredRooms.length / roomsPerPage);
  };

  const isRoomOpen = (room) => {
    return room.maxParticipants > room.participants;
  };

  const applyFilters = (searchTerm, filters) => {
    const filteredRooms = allRooms // Use allRooms as the source
      .filter((room) => {
        let matchesFilter = true;

        // Apply specific party filters
        if (filters.right) {
          matchesFilter =
            room.stance.party === "Right" && room.stance.percentage > 25;
        } else if (filters.left) {
          matchesFilter =
            room.stance.party === "Left" && room.stance.percentage > 25;
        } else if (filters.centrist) {
          matchesFilter =
            (room.stance.party === "Left" && room.stance.percentage <= 25) ||
            (room.stance.party === "Right" && room.stance.percentage <= 25);
        }

        if (filters.text) {
          matchesFilter = matchesFilter && room.type === "text";
        }

        if (filters.voice) {
          matchesFilter = matchesFilter && room.type === "voice";
        }

        return matchesFilter;
      })
      .filter((room) =>
        room.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      );

    setRooms(filteredRooms);
    const totalPages = calculateTotalPages(filteredRooms);

    // Adjust current page if it's invalid for the filtered result
    if (currentPage > totalPages) {
      setCurrentPage(1); // Reset to the first page
    }
  };

  const getPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      pages.push(1); // Always show the first page

      if (startPage > 2) {
        pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages); // Always show the last page
    }

    return pages;
  };

  const totalPages = Math.ceil(rooms.length / roomsPerPage);
  const paginatedRooms = rooms.slice(
    (currentPage - 1) * roomsPerPage,
    currentPage * roomsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleJoinRoom = (room) => {
    socket.emit("join-room", room.id, (response) => {
      if (response.error) {
        console.error("Failed to join room:", response.error);
        return;
      }

      const { room: joinedRoom } = response;
      setLocation(
        `/call-${room.type}?topic=${encodeURIComponent(
          joinedRoom.name
        )}&party=${encodeURIComponent(
          joinedRoom.stance.party
        )}&percentage=${encodeURIComponent(
          joinedRoom.stance.percentage
        )}&owner=false`
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <a href="/" className="flex items-center space-x-2">
          
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                disagree
              </h1>
            </a>
          </div>
          <Link to="/create">
            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50 transition-colors">
              <Plus size={20} />
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-gray-100">
              {stats.activeDebates}
            </div>
            <div className="text-sm text-gray-400">Active Debates</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-gray-100">
              {stats.usersOnline}
            </div>
            <div className="text-sm text-gray-400">Users Online</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-gray-100">
              {stats.debatesToday}
            </div>
            <div className="text-sm text-gray-400">Debates Today</div>
          </div>
        </div>

        {/* Search and Filters Container */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search rooms..."
              className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search
              className="absolute left-4 top-3.5 text-gray-400"
              size={20}
            />
          </div>
          {/* Filters */}
          <div className="relative max-w-full overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filters.right
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    right: !filters.right,
                    left: false,
                    centrist: false,
                  };
                  setFilters(newFilters);
                  applyFilters(searchTerm, newFilters);
                }}
              >
                Right
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filters.left
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    left: !filters.left,
                    right: false,
                    centrist: false,
                  };
                  setFilters(newFilters);
                  applyFilters(searchTerm, newFilters);
                }}
              >
                Left
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filters.centrist
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    centrist: !filters.centrist,
                    right: false,
                    left: false,
                  };
                  setFilters(newFilters);
                  applyFilters(searchTerm, newFilters);
                }}
              >
                Centrist
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filters.text
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    text: !filters.text,
                    voice: false,
                  };
                  setFilters(newFilters);
                  applyFilters(searchTerm, newFilters);
                }}
              >
                Text
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filters.voice
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    voice: !filters.voice,
                    text: false,
                  };
                  setFilters(newFilters);
                  applyFilters(searchTerm, newFilters);
                }}
              >
                Voice
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            {rooms.length === 0 ? (
              // Display a message when no rooms are available
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-400 text-center text-sm sm:text-base md:text-lg font-medium leading-tight max-w-xs sm:max-w-md md:max-w-lg lg:max-w-none mx-auto">
                  No rooms available, please refresh or create your own.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900/50">
                    <th
                      className="px-6 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors w-1/5"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300 font-medium">Room</span>
                        <ArrowUpDown size={16} className="text-gray-500" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors w-1/5"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300 font-medium">Type</span>
                        <ArrowUpDown size={16} className="text-gray-500" />
                      </div>
                    </th>
                    <th
                      className="px-7 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors w-1/5"
                      onClick={() => handleSort("stance")}
                    >
                      <div className="flex items-center justify-center space-x-2 -ml-10">
                        <span className="text-gray-300 font-medium">
                          Stance
                        </span>
                        <ArrowUpDown size={16} className="text-gray-500" />
                      </div>
                    </th>
                    <th
                      className="px-5 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors w-1/5"
                      onClick={() => handleSort("created")}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300 font-medium">
                          Created
                        </span>
                        <ArrowUpDown size={16} className="text-gray-500" />
                      </div>
                    </th>
                    <th className="px-3 py-4 text-right w-1/5">
                      <span className="text-gray-300 font-medium"></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {paginatedRooms.map((room) => (
                    <tr
                      key={room.id}
                      className="hover:bg-gray-700/30 transition-colors duration-200"
                    >
                      <td className="px-4 py-4 w-1/5">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-100 font-medium">
                            {room.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center w-1/5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium w-24 flex justify-center items-center ${
                            room.type === "text"
                              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              : "bg-green-500/20 text-green-300 border border-green-500/30"
                          }`}
                        >
                          {room.type === "text" ? "Text" : "Voice"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center w-1/5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium w-32 inline-block text-center ${
                            room.stance.percentage <= 25
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : room.stance.party === "Left"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {room.stance.percentage}% {room.stance.party}
                        </span>
                      </td>
                      <td className="px-6 py-4 w-1/5">
                        <span className="text-gray-400">
                          {formatTimeAgo(room.created)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right w-1/5">
                        <button
                          className={`flex items-center justify-center space-x-2 px-6 py-2 w-28 rounded-lg transition-all ${
                            isRoomOpen(room)
                              ? "bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50"
                              : "bg-gray-700 text-gray-400 cursor-not-allowed"
                          }`}
                          disabled={!isRoomOpen(room)}
                          onClick={() => {
                            if (isRoomOpen(room)) {
                              handleJoinRoom(room);
                            }
                          }}
                        >
                          <span>{isRoomOpen(room) ? "Join" : "Full"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-4">
          {getPagination().map((page, index) =>
            page === "..." ? (
              <span key={index} className="px-4 py-2 mx-1 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={index}
                className={`flex items-center justify-center px-4 py-2 mx-1 rounded-lg ${
                  currentPage === page
                    ? "bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/50"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-800/50"
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DisagreePlatform;
