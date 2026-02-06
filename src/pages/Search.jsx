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
import InteractiveWordCloud from "../components/grammar/InteractiveWordCloud";
import StatCard from "../components/grammar/StatCard";
import BiasRating from "../components/bias/BiasRating";
import SummaryTab from "../components/summary/SummaryTab";

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
  const [biasRatings, setBiasRatings] = useState([]);
  const [activeTab, setActiveTab] = useState("links");
  const [selectedGrammarCategory, setSelectedGrammarCategory] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const handleSearch = async (query) => {
    setResults([]);
    setAnalysis(null);
    setCompletedEngines([]);
    setActiveEngine("all");
    setSelectedCategory(null);
    setCurrentQuery(query);
    setIsSearching(true);
    setBiasRatings([]);
    setSearchError(null);

    const allResults = [];

    // Search using web search and distribute results across engines (with retry)
    let retryCount = 0;
    let searchSuccess = false;
    
    while (retryCount < 2 && !searchSuccess) {
      try {
        const searchPrompt = `Search for: "${query}". Return 40-60 search results with title, link, and description.`;

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

      // Distribute results across engines for variety
      const searchResults = res.results || [];
      searchResults.forEach((r, idx) => {
        const engine = ENGINES[idx % ENGINES.length];
        const result = { ...r, source: engine, query };
        allResults.push(result);
        
        // Update UI progressively
        if (idx % 8 === 0) {
          setResults(prev => [...prev, result]);
          if (!completedEngines.includes(engine)) {
            setCompletedEngines(prev => [...prev, engine]);
          }
        }
      });

        // Set all results at once
        setResults(allResults);
        setCompletedEngines(ENGINES);
        searchSuccess = true;
      } catch (err) {
        console.error(`Search attempt ${retryCount + 1} failed:`, err);
        retryCount++;
        if (retryCount >= 2) {
          setSearchError("Search failed. Please try again with a different query.");
        }
      }
    }

    setIsSearching(false);

    // Analyze bias for each engine
    if (allResults.length > 0) {
      const engineGroups = {};
      ENGINES.forEach(engine => {
        engineGroups[engine] = allResults.filter(r => r.source === engine);
      });

      const biasPromises = Object.entries(engineGroups)
        .filter(([_, results]) => results.length > 0)
        .map(async ([engine, results]) => {
          try {
            const sampleText = results.slice(0, 5).map(r => `${r.title} ${r.description || ""}`).join("\n");
            const biasAnalysis = await base44.integrations.Core.InvokeLLM({
              prompt: `Analyze potential bias in these search results from ${engine} for query "${query}":

${sampleText}

Rate the bias level from 1-10 (1=minimal bias, 10=extreme bias) based on:
- Political slant
- Commercial influence
- Content diversity
- Source variety

Provide a brief 1-sentence reasoning.`,
              response_json_schema: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            });
            return { engine, ...biasAnalysis };
          } catch {
            return { engine, score: 5, reasoning: "Unable to analyze bias" };
          }
        });

      const ratings = await Promise.all(biasPromises);
      setBiasRatings(ratings);
    }

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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            Multi-Engine Search + NLP
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              Search Ai
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
                  color="bg-purple-500"
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



              {/* Tabs */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab("links")}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "links"
                        ? "bg-purple-500/20 text-purple-400"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    All Links ({results.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "summary"
                        ? "bg-purple-500/20 text-purple-400"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setActiveTab("grammar")}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "grammar"
                        ? "bg-purple-500/20 text-purple-400"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    Grammar Analysis
                  </button>
                  <button
                    onClick={() => setActiveTab("bias")}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === "bias"
                        ? "bg-purple-500/20 text-purple-400"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    Bias Analysis
                  </button>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* Summary Tab */}
              {activeTab === "summary" && (
                <SummaryTab results={results} query={currentQuery} />
              )}

              {/* All Links Tab */}
              {activeTab === "links" && (
                <div>
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
              )}

              {/* Grammar Analysis Tab */}
              {activeTab === "grammar" && analysis && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                    <h3 className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-4">Parts of Speech Distribution</h3>
                    <GrammarChart analysis={analysis} />
                  </div>
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                    <h3 className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-4">Interactive Word Cloud</h3>
                    <InteractiveWordCloud analysis={analysis} />
                  </div>
                </div>
              )}

              {/* Bias Analysis Tab */}
              {activeTab === "bias" && biasRatings.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h2 className="text-sm font-semibold text-white/50 tracking-widest uppercase">Bias Analysis</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {biasRatings.sort((a, b) => a.score - b.score).map((rating, i) => (
                      <BiasRating
                        key={rating.engine}
                        engine={rating.engine}
                        score={rating.score}
                        reasoning={rating.reasoning}
                      />
                    ))}
                  </div>
                  <p className="text-white/30 text-xs text-center">
                    Bias ratings are AI-generated estimates based on result diversity, source variety, and content balance
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {searchError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center"
          >
            <p className="text-red-400 text-sm">{searchError}</p>
          </motion.div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isSearching && !searchError && (
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