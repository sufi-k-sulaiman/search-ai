import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Globe } from "lucide-react";

export default function ResultCard({ result, index }) {
  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group"
    >
      <div className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <span className="text-xs text-purple-400/70 truncate">
                {result.link ? getDomain(result.link) : "—"}
              </span>
              <span className="text-xs text-white/20 px-2 py-0.5 rounded-full bg-white/5">
                {result.source}
              </span>
            </div>
            <h3 className="text-white/90 font-medium text-sm leading-relaxed mb-1.5 line-clamp-2">
              {result.title}
            </h3>
            {result.description && (
              <p className="text-white/40 text-xs leading-relaxed line-clamp-2">
                {result.description}
              </p>
            )}
          </div>
          {result.link && (
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 text-white/30 hover:text-purple-400 transition-all duration-300 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}