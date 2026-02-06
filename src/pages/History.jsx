import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Search, Trash2, ChevronRight, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function HistoryPage() {
  const [selectedQuery, setSelectedQuery] = useState(null);

  const { data: analyses = [], isLoading: loadingAnalyses, refetch } = useQuery({
    queryKey: ["grammar-analyses"],
    queryFn: () => base44.entities.GrammarAnalysis.list("-created_date", 50),
  });

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ["search-results", selectedQuery],
    queryFn: () =>
      selectedQuery
        ? base44.entities.SearchResult.filter({ query: selectedQuery }, "-created_date", 100)
        : Promise.resolve([]),
    enabled: !!selectedQuery,
  });

  const handleDelete = async (id) => {
    await base44.entities.GrammarAnalysis.delete(id);
    refetch();
  };

  const uniqueQueries = [...new Map(analyses.map(a => [a.query, a])).values()];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-white/30" />
            <h1 className="text-3xl font-bold tracking-tight text-white/90">Search History</h1>
          </div>
          <p className="text-white/40 text-sm">Browse your past searches and grammar analyses</p>
        </motion.div>

        {loadingAnalyses ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : uniqueQueries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Search className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/30 text-sm">No search history yet. Start by searching something.</p>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Query List */}
            <div className="lg:col-span-1 space-y-2">
              {uniqueQueries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    onClick={() => setSelectedQuery(entry.query)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                      selectedQuery === entry.query
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">"{entry.query}"</p>
                        <p className="text-white/30 text-xs mt-1">
                          {entry.created_date && format(new Date(entry.created_date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {entry.total_words || 0} words
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            {(entry.nouns?.length || 0) + (entry.verbs?.length || 0)} key terms
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                          className="h-7 w-7 text-white/20 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          selectedQuery === entry.query ? "text-emerald-400 rotate-90" : "text-white/20"
                        }`} />
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {selectedQuery ? (
                  <motion.div
                    key={selectedQuery}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Analysis */}
                    {(() => {
                      const entry = analyses.find(a => a.query === selectedQuery);
                      if (!entry) return null;
                      const categories = [
                        { key: "nouns", label: "Nouns", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                        { key: "pronouns", label: "Pronouns", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                        { key: "verbs", label: "Verbs", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                        { key: "adjectives", label: "Adjectives", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                        { key: "adverbs", label: "Adverbs", color: "text-red-400 bg-red-500/10 border-red-500/20" },
                        { key: "prepositions", label: "Prepositions", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
                        { key: "conjunctions", label: "Conjunctions", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                        { key: "articles", label: "Articles", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
                      ];
                      return categories.filter(c => entry[c.key]?.length > 0).map(cat => (
                        <div key={cat.key} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                          <h3 className={`text-xs font-semibold tracking-widest uppercase mb-3 ${cat.color.split(" ")[0]}`}>
                            {cat.label} ({entry[cat.key].length})
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {entry[cat.key].slice(0, 60).map((word, i) => (
                              <span
                                key={`${word}-${i}`}
                                className={`px-2 py-0.5 rounded-lg text-xs border ${cat.color}`}
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Related Results */}
                    {loadingResults ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                      </div>
                    ) : results.length > 0 && (
                      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                        <h3 className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">
                          Search Results ({results.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          {results.map((r, i) => (
                            <div key={r.id || i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/30">{r.source}</span>
                                <p className="text-white/70 text-sm font-medium truncate">{r.title}</p>
                              </div>
                              {r.link && (
                                <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-emerald-400/60 text-xs hover:text-emerald-400 truncate block">
                                  {r.link}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-64 rounded-2xl bg-white/[0.01] border border-white/[0.04]"
                  >
                    <p className="text-white/20 text-sm">Select a search to view details</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}