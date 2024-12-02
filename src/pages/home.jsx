import React, { useState } from "react";
import { Search, ArrowUpDown, Plus, Globe } from "lucide-react";

const DisagreePlatform = () => {
    const initialRooms = Array.from({ length: 55 }, (_, index) => ({
    id: index + 1,
    name: `Topic Room ${index + 1}`,
    stance: {
      party: index % 2 === 0 ? "Democrat" : "Republican",
      percentage: Math.floor(Math.random() * 100) + 1,
    },
    participants: Math.floor(Math.random() * 3),
    maxParticipants: 2,
    created: new Date(
      Date.now() - Math.floor(Math.random() * 1000000000)
    ).toISOString(),
  }));

  const [rooms, setRooms] = useState(initialRooms);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 5;

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
        const aScore = a.stance.party === "Democrat" ? -a.stance.percentage : a.stance.percentage;
        const bScore = b.stance.party === "Democrat" ? -b.stance.percentage : b.stance.percentage;
        return direction === "asc" ? aScore - bScore : bScore - aScore;
      }

      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setRooms(sortedRooms);
    setSortConfig({ key, direction });
  };

  const handleSearch = (event) => {
    const searchTerm = event.target.value;
    setSearchTerm(searchTerm);

    const filtered = initialRooms.filter((room) =>
      room.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    setRooms(filtered);
    setCurrentPage(1);
  };
  
  const getPagination = () => {
  const pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) {
        pages.push("...");
      }
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
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

  
  
  
  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center space-x-2">
          <a href="/" className="flex items-center space-x-2">
            <Globe className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              disagree
            </h1>
          </a>
        </div>
        <button className="group bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 flex items-center space-x-2">
          <Plus size={20} className="transform group-hover:rotate-90 transition-transform duration-300" />
          <span>New Room</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-gray-100">24</div>
          <div className="text-sm text-gray-400">Active Debates</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-gray-100">142</div>
          <div className="text-sm text-gray-400">Users Online</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-gray-100">1,287</div>
          <div className="text-sm text-gray-400">Debates Today</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search rooms..."
            className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/50">
                <th
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-300 font-medium">Room</span>
                    <ArrowUpDown size={16} className="text-gray-500" />
                  </div>
                </th>
                <th
                  className="px-7 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors whitespace-nowrap w-[150px]"
                  onClick={() => handleSort("stance")}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-300 font-medium">Stance</span>
                    <ArrowUpDown size={16} className="text-gray-500" />
                  </div>
                </th>
                <th
                  className="px-5 py-4 text-left cursor-pointer hover:bg-gray-700/50 transition-colors"
                  onClick={() => handleSort("created")}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-300 font-medium">Created</span>
                    <ArrowUpDown size={16} className="text-gray-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {paginatedRooms.map((room) => (
                <tr
                  key={room.id}
                  className="hover:bg-gray-700/30 transition-colors duration-200"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          room.maxParticipants - room.participants < 1
                            ? "bg-gray-400"
                            : room.stance.party === "Republican"
                            ? "bg-red-400"
                            : "bg-blue-400"
                        }`}
                      />
                      <span className="text-gray-100 font-medium">
                        {room.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium w-32 inline-block text-center ${
                        room.stance.party === "Democrat"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {room.stance.percentage}% {room.stance.party}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400">
                      {formatTimeAgo(room.created)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              className={`px-4 py-2 mx-1 rounded-lg ${
                currentPage === page
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300"
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