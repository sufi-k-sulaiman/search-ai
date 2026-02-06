import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function InteractiveWordCloud({ analysis, selectedCategory, onCategorySelect }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [hoveredWord, setHoveredWord] = useState(null);

  const wordData = useMemo(() => {
    if (!analysis) return [];
    
    const allWords = {};
    const categories = ['nouns', 'verbs', 'adjectives', 'adverbs', 'pronouns', 'prepositions', 'conjunctions'];
    
    categories.forEach(cat => {
      if (analysis[cat]) {
        analysis[cat].forEach(word => {
          if (!allWords[word]) {
            allWords[word] = { word, count: 0, categories: [] };
          }
          allWords[word].count++;
          allWords[word].categories.push(cat);
        });
      }
    });

    let words = Object.values(allWords);
    
    // Filter by selected category if set
    if (selectedCategory) {
      words = words.filter(w => w.categories.includes(selectedCategory));
    }

    return words
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);
  }, [analysis, selectedCategory]);

  const maxCount = Math.max(...wordData.map(w => w.count), 1);

  const categoryColors = {
    nouns: "bg-purple-500/30 text-purple-300 border-purple-500/40",
    verbs: "bg-violet-500/30 text-violet-300 border-violet-500/40",
    adjectives: "bg-fuchsia-500/30 text-fuchsia-300 border-fuchsia-500/40",
    adverbs: "bg-pink-500/30 text-pink-300 border-pink-500/40",
    pronouns: "bg-indigo-500/30 text-indigo-300 border-indigo-500/40",
    prepositions: "bg-purple-600/30 text-purple-200 border-purple-600/40",
    conjunctions: "bg-violet-600/30 text-violet-200 border-violet-600/40",
  };

  const getWordSize = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-3xl";
    if (ratio > 0.5) return "text-2xl";
    if (ratio > 0.3) return "text-xl";
    return "text-base";
  };

  const getWordColor = (categories) => {
    const primaryCat = categories[0];
    return categoryColors[primaryCat] || "bg-white/10 text-white/60 border-white/20";
  };

  if (!analysis || wordData.length === 0) {
    return (
      <div className="text-center py-12 text-white/30 text-sm">
        No words to display
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 justify-center items-center min-h-[300px] p-6">
        {wordData.map((item, i) => (
          <motion.button
            key={item.word}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.01, duration: 0.3 }}
            whileHover={{ scale: 1.15, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedWord(item)}
            onMouseEnter={() => setHoveredWord(item.word)}
            onMouseLeave={() => setHoveredWord(null)}
            className={`px-3 py-1.5 rounded-lg border transition-all duration-200 ${getWordSize(item.count)} ${
              getWordColor(item.categories)
            } ${hoveredWord === item.word ? "shadow-lg" : ""}`}
          >
            {item.word}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedWord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedWord(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white/90">{selectedWord.word}</h3>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Frequency</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedWord.count / maxCount) * 100}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                      />
                    </div>
                    <span className="text-white/60 text-sm font-medium">{selectedWord.count}</span>
                  </div>
                </div>

                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedWord.categories.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedWord(null);
                          onCategorySelect(cat);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all hover:scale-105 cursor-pointer ${categoryColors[cat]}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Relative Size</p>
                  <p className="text-white/60 text-sm">
                    {selectedWord.count === maxCount ? "Most frequent word" : 
                     `${Math.round((selectedWord.count / maxCount) * 100)}% of max frequency`}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/30">
        <span>Click any word to see details</span>
        <span>•</span>
        <span>Size indicates frequency</span>
      </div>
    </div>
  );
}