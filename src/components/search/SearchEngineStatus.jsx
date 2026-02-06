import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";

const engines = [
  "Bing", "Google", "DuckDuckGo", "Brave", "Ecosia",
  "Qwant", "Ask", "WebCrawler", "Gibiru", "Ekoru"
];

export default function SearchEngineStatus({ isSearching, completedEngines }) {
  if (!isSearching && completedEngines.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {engines.map((engine, i) => {
          const done = completedEngines.includes(engine);
          return (
            <motion.div
              key={engine}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                done
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : isSearching
                  ? "bg-white/5 text-white/40 border border-white/10"
                  : "bg-white/[0.02] text-white/20 border border-white/5"
              }`}
            >
              {done ? (
                <CheckCircle className="w-3 h-3" />
              ) : isSearching ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-white/10" />
              )}
              {engine}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}