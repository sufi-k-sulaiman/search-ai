import React from "react";
import { motion } from "framer-motion";

const categoryConfig = {
  nouns: { label: "Nouns", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" },
  pronouns: { label: "Pronouns", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/20" },
  verbs: { label: "Verbs", color: "bg-purple-500/20 text-purple-400 border-purple-500/20" },
  adjectives: { label: "Adjectives", color: "bg-amber-500/20 text-amber-400 border-amber-500/20" },
  adverbs: { label: "Adverbs", color: "bg-red-500/20 text-red-400 border-red-500/20" },
  prepositions: { label: "Prepositions", color: "bg-pink-500/20 text-pink-400 border-pink-500/20" },
  conjunctions: { label: "Conjunctions", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/20" },
  articles: { label: "Articles", color: "bg-teal-500/20 text-teal-400 border-teal-500/20" },
  interjections: { label: "Interjections", color: "bg-orange-500/20 text-orange-400 border-orange-500/20" },
};

export default function WordCloud({ analysis, selectedCategory, onCategorySelect }) {
  if (!analysis) return null;

  const categories = Object.entries(categoryConfig).filter(
    ([key]) => analysis[key]?.length > 0
  );

  const displayWords = selectedCategory
    ? analysis[selectedCategory] || []
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {categories.map(([key, config], i) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onCategorySelect(selectedCategory === key ? null : key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
              selectedCategory === key
                ? config.color + " shadow-lg"
                : "bg-white/5 text-white/50 border-white/10 hover:border-white/20"
            }`}
          >
            {config.label}
            <span className="ml-1.5 opacity-60">({analysis[key]?.length || 0})</span>
          </motion.button>
        ))}
      </div>

      {displayWords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap gap-1.5 pt-2"
        >
          {displayWords.slice(0, 80).map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`px-2.5 py-1 rounded-lg text-xs border ${
                categoryConfig[selectedCategory]?.color || "bg-white/5 text-white/50 border-white/10"
              }`}
            >
              {word}
            </motion.span>
          ))}
        </motion.div>
      )}

      {!selectedCategory && (
        <p className="text-white/30 text-xs text-center py-6">
          Select a grammar category above to explore words
        </p>
      )}
    </div>
  );
}