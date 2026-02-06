import React from "react";
import { motion } from "framer-motion";

const engineColors = {
  "Bing": "from-blue-500 to-blue-600",
  "Google": "from-red-400 via-yellow-400 to-blue-500",
  "DuckDuckGo": "from-orange-400 to-orange-600",
  "Brave": "from-orange-500 to-red-500",
  "Ecosia": "from-green-400 to-green-600",
  "Qwant": "from-purple-500 to-indigo-600",
  "Ask": "from-red-500 to-red-700",
  "WebCrawler": "from-cyan-400 to-blue-500",
  "Gibiru": "from-lime-400 to-green-500",
  "Ekoru": "from-teal-400 to-teal-600",
};

export default function EngineTag({ name, count, isActive, onClick }) {
  const gradient = engineColors[name] || "from-gray-400 to-gray-600";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
        isActive
          ? "text-white shadow-lg"
          : "text-white/60 bg-white/5 border border-white/10 hover:border-white/20"
      }`}
    >
      {isActive && (
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-xl opacity-80`} />
      )}
      <span className="relative flex items-center gap-2">
        {name}
        {count > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            isActive ? "bg-white/20" : "bg-white/10"
          }`}>
            {count}
          </span>
        )}
      </span>
    </motion.button>
  );
}