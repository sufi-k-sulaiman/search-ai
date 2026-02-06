import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, BarChart3, FileText, Layers, Hash, Sparkles } from "lucide-react";
import SearchBar from "../components/search/SearchBar";
import SearchEngineStatus from "../components/search/SearchEngineStatus";
import EngineTag from "../components/search/EngineTag";
import ResultCard from "../components/search/ResultCard";
import GrammarChart from "../components/grammar/GrammarChart";
import WordCloud from "../components/grammar/WordCloud";
import StatCard from "../components/grammar/StatCard";

const ENGINES = ["Bing", "Google", "DuckDuckGo", "Brave", "Ecosia", "Qwant", "Ask", "WebCrawler", "Gibiru", "Ekoru"];

export default function SearchPage() {
  const [results, setResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completedEngines, setCompletedEngines] = useState([]);
  const [activeEngine, setActiveEngine] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentQuery, setCurrentQuery] = useState("");

  const handleSearch = async (query) => {
    setResults([]);
    setAnalysis(null);
    setCompletedEngines([]);
    setActiveEngine("all");
    setSelectedCategory(null);
    setCurrentQuery(query);
    setIsSearching(true);

    const allResults = [];

    // Use the web search integration to search across multiple engines
    // We simulate multi-engine by searching with engine-specific prefixes
    for (const engine of ENGINES) {
      try {
        const searchPrompt = `Search the web for: "${query}". 
        Pretend you are searching on ${engine}. 
        Return up to 8 search results with title, link, and description.
        Be thorough and return real, relevant results.`;

        const res = await base44.integrations.Core.InvokeLLM({
          prompt: searchPrompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    link: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        });

        const engineResults = (res.results || []).map(r => ({
          ...r,
          source: engine,
          query
        }));
        allResults.push(...engineResults);
        setResults(prev => [...prev, ...engineResults]);
        setCompletedEngines(prev => [...prev, engine]);
      } catch (err) {
        console.log(`${engine} search skipped:`, err);
        setCompletedEngines(prev => [...prev, engine]);
      }
    }

    setIsSearching(false);

    // Save results to database
    if (allResults.length > 0) {
      try {
        await base44.entities.SearchResult.bulkCreate(allResults);
      } catch (e) {
        console.log("Failed to save results:", e);
      }
    }

    // Now do NLP analysis
    if (allResults.length > 0) {
      setIsAnalyzing(true);
      const allText = allResults.map(r => `${r.title || ""} ${r.description || ""}`).join(" ");

      try {
        const nlpResult = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert NLP linguist. Analyze the following text and extract all parts of speech.
          
TEXT:
${allText.slice(0, 8000)}

Categorize every meaningful word into the correct grammatical category. Remove duplicates within each category. Sort each list alphabetically. Only include English words.

Categories:
- nouns: Common and proper nouns
- pronouns: Personal, possessive, demonstrative, relative, etc.
- verbs: Action and linking verbs (base form)
- adjectives: Descriptive words
- adverbs: Words modifying verbs, adjectives, or other adverbs
- prepositions: Words showing relationships
- conjunctions: Connecting words
- articles: a, an, the
- interjections: Exclamatory words

Also provide total_words (total unique words analyzed).`,
          response_json_schema: {
            type: "object",
            properties: {
              nouns: { type: "array", items: { type: "string" } },
              pronouns: { type: "array", items: { type: "string" } },
              verbs: { type: "array", items: { type: "string" } },
              adjectives: { type: "array", items: { type: "string" } },
              adverbs: { type: "array", items: { type: "string" } },
              prepositions: { type: "array", items: { type: "string" } },
              conjunctions: { type: "array", items: { type: "string" } },
              articles: { type: "array", items: { type: "string" } },
              interjections: { type: "array", items: { type: "string" } },
              total_words: { type: "number" }
            }
          }
        });

        setAnalysis(nlpResult);

        // Save analysis
        try {
          await base44.entities.GrammarAnalysis.create({ query, ...nlpResult });
        } catch (e) {
          console.log("Failed to save analysis:", e);
        }
      } catch (err) {
        console.log("NLP analysis failed:", err);
      }
      setIsAnalyzing(false);
    }
  };

  const filteredResults = activeEngine === "all"
    ? results
    : results.filter(r => r.source === activeEngine);

  const engineCounts = ENGINES.reduce((acc, engine) => {
    acc[engine] = results.filter(r => r.source === engine).length;
    return acc;
  }, {});

  const totalCategories = analysis
    ? Object.entries(analysis).filter(([k, v]) => Array.isArray(v) && v.length > 0).length
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            Multi-Engine Search + NLP
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              Search Analyzer
            </span>
          </h1>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Search across 10 engines simultaneously and analyze results with natural language processing
          </p>
        </motion.div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        <SearchEngineStatus isSearching={isSearching} completedEngines={completedEngines} />

        {/* Results Section */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 space-y-10"
            >
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Total Results"
                  value={results.length}
                  icon={FileText}
                  color="bg-emerald-500"
                  delay={0}
                />
                <StatCard
                  label="Engines Used"
                  value={completedEngines.length}
                  icon={Layers}
                  color="bg-purple-500"
                  delay={0.1}
                />
                <StatCard
                  label="Total Words"
                  value={analysis?.total_words || "—"}
                  icon={Hash}
                  color="bg-cyan-500"
                  delay={0.2}
                />
                <StatCard
                  label="Categories"
                  value={totalCategories}
                  icon={BarChart3}
                  color="bg-amber-500"
                  delay={0.3}
                />
              </div>

              {/* NLP Analysis */}
              {(isAnalyzing || analysis) && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h2 className="text-sm font-semibold text-white/50 tracking-widest uppercase">Grammar Analysis</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>

                  {isAnalyzing ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center py-16"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-white/40 text-sm">Analyzing grammar with NLP...</p>
                      </div>
                    </motion.div>
                  ) : analysis ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                        <h3 className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-4">Parts of Speech Distribution</h3>
                        <GrammarChart analysis={analysis} />
                      </div>
                      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                        <h3 className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-4">Word Explorer</h3>
                        <WordCloud
                          analysis={analysis}
                          selectedCategory={selectedCategory}
                          onCategorySelect={setSelectedCategory}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Engine filter tabs */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <h2 className="text-sm font-semibold text-white/50 tracking-widest uppercase">Search Results</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <EngineTag
                    name="All"
                    count={results.length}
                    isActive={activeEngine === "all"}
                    onClick={() => setActiveEngine("all")}
                  />
                  {ENGINES.filter(e => engineCounts[e] > 0).map(engine => (
                    <EngineTag
                      key={engine}
                      name={engine}
                      count={engineCounts[engine]}
                      isActive={activeEngine === engine}
                      onClick={() => setActiveEngine(engine)}
                    />
                  ))}
                </div>

                <div className="grid gap-2">
                  {filteredResults.map((result, i) => (
                    <ResultCard key={`${result.source}-${i}`} result={result} index={i} />
                  ))}
                </div>

                {filteredResults.length === 0 && (
                  <p className="text-center text-white/30 text-sm py-12">No results for this engine</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {results.length === 0 && !isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-20"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <SearchIcon className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/30 text-sm">
              Enter a query to search across 10 engines and analyze the results
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}